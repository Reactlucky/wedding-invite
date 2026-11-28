#!/usr/bin/env node
/**
 * Renders the Wedding Express as one portrait MP4: the train opening (with the
 * horn, chime and announcement), then a slow scroll through the invitation with
 * the wedding music.
 *
 * Local only. Needs Chrome, ffmpeg and a running production server:
 *   npm run build && npx next start -p 3100
 *   npm run export:video            # writes .data/exports/wedding-express-portrait.mp4
 */
import { spawn, execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const ORIGIN = process.env.ORIGIN ?? "http://localhost:3100";
const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH ?? "ffprobe";
const W = 540;
const H = 960;
const FPS = Number(process.env.FPS ?? 60);
const CROSSFADE = 0.8; // softens the cut from the opening into the invitation page
const MUSIC = path.resolve("public/wedding-music.mp3");
const MUSIC_AT = 23.2; // TRAIN2_CUES.hero: the music comes in with the invitation
const MUSIC_VOLUME = 0.7;
const WORK = path.resolve(".data/exports");
const OUT = path.resolve(process.argv[2] ?? path.join(WORK, "wedding-express-portrait.mp4"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("[video]", ...a);

function chromePath() {
  const found = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].find((p) => p && existsSync(p));
  if (!found) throw new Error("Chrome not found. Set CHROME_PATH.");
  return found;
}

function duration(file) {
  const out = execFileSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString();
  return Number(out.trim());
}

function run(cmd, args, input) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: [input ? "pipe" : "ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err = (err + d).slice(-4000)));
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}: ${err}`))));
    if (input) input(p.stdin);
  });
}

/** The opening comes from the app's own exporter, which also mixes its sound. */
async function renderOpening() {
  const res = await fetch(`${ORIGIN}/api/export`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ template: "train2", format: "portrait", fps: FPS }),
  });
  if (!res.ok) throw new Error(`Export request failed: ${res.status} ${await res.text()}`);
  const { id } = await res.json();
  let last = -1;
  for (;;) {
    await sleep(2000);
    const job = await (await fetch(`${ORIGIN}/api/export/${id}`)).json();
    if (job.status === "error") throw new Error(`Opening export failed: ${job.error}`);
    const pct = Math.round((job.progress ?? 0) * 100);
    if (pct !== last) {
      log(`opening ${job.status} ${pct}%`);
      last = pct;
    }
    if (job.status === "done") return path.join(WORK, id, "train2-opening-portrait.mp4");
  }
}

/** Page clock that only moves when a frame is captured, so animations and the countdown run at video speed. */
function installClock() {
  const realPerf = performance.now.bind(performance);
  const RealDate = Date;
  const realDateNow = RealDate.now.bind(RealDate);
  let frozen = false;
  let perf = 0;
  let epoch = 0;
  const dateNow = () => (frozen ? epoch : realDateNow());
  performance.now = () => (frozen ? perf : realPerf());
  class VirtualDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(dateNow());
      else super(...args);
    }
    static now() {
      return dateNow();
    }
  }
  window.Date = VirtualDate;
  // CSS animations follow the wall clock, so each one is paused and stepped with the virtual clock.
  const anims = new WeakMap();
  let elapsed = 0;
  const stepAnimations = () => {
    for (const a of document.getAnimations()) {
      if (!anims.has(a)) {
        a.pause();
        anims.set(a, elapsed - (Number(a.currentTime) || 0));
      }
      a.currentTime = elapsed - anims.get(a);
    }
  };
  window.__clock = {
    freeze() {
      perf = realPerf();
      epoch = realDateNow();
      frozen = true;
      stepAnimations();
    },
    advance(ms) {
      perf += ms;
      epoch += ms;
      elapsed += ms;
      stepAnimations();
    },
  };
}

async function renderScroll(file) {
  const browser = await puppeteer.launch({
    executablePath: chromePath(),
    headless: true,
    args: ["--no-sandbox", "--hide-scrollbars", "--mute-audio", "--ignore-gpu-blocklist", `--window-size=${W},${H}`],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 });
    await page.evaluateOnNewDocument(installClock);
    await page.goto(`${ORIGIN}/?view=invitation`, { waitUntil: "networkidle0", timeout: 120_000 });
    await page.addStyleTag({
      content: `button[aria-label="Mute music"],button[aria-label="Unmute music"]{display:none!important}html{scroll-behavior:auto!important}.no-scrollbar{scroll-snap-type:none!important}`,
    });
    await page.evaluate(async () => {
      document.querySelectorAll("img").forEach((img) => (img.loading = "eager"));
      await Promise.all([...document.images].map((img) => (img.complete ? 0 : new Promise((r) => (img.onload = img.onerror = r)))));
      await document.fonts.ready;
    });
    await sleep(1800);

    const layout = await page.evaluate(() => {
      const main = document.querySelector("main");
      const blocks = [...main.children]
        .filter((el) => el.tagName === "SECTION" || el.tagName === "FOOTER")
        .map((el) => ({
          top: el.getBoundingClientRect().top + window.scrollY,
          h: el.offsetHeight,
          hero: el.classList.contains("hero-wrap"),
          diary: !!el.querySelector(".no-scrollbar"),
        }));
      return { max: document.documentElement.scrollHeight - window.innerHeight, blocks };
    });

    // Shot list: hold on each section, glide to the next.
    const shots = [];
    let t = 0;
    let y = 0;
    const clamp = (v) => Math.max(0, Math.min(layout.max, v));
    const hold = (d, extra = {}) => {
      shots.push({ from: t, to: t + d, y0: y, y1: y, ...extra });
      t += d;
    };
    const glide = (target, speed = 230) => {
      target = clamp(target);
      if (Math.abs(target - y) < 4) return;
      const d = Math.max(1.1, Math.abs(target - y) / speed);
      shots.push({ from: t, to: t + d, y0: y, y1: target });
      t += d;
      y = target;
    };
    hold(2.2);
    for (const b of layout.blocks) {
      if (b.hero) continue;
      glide(b.top - 16);
      if (b.diary) hold(7, { diary: true });
      else hold(b.h > H * 0.9 ? 1.4 : 2.4);
      if (b.h > H) glide(b.top + b.h - H, 170);
    }
    glide(layout.max);
    hold(3);

    const total = Math.round(t * FPS);
    log(`invitation scroll: ${t.toFixed(1)}s, ${total} frames`);
    const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

    await page.evaluate(() => window.__clock.freeze());
    let stdin;
    const encoding = run(
      FFMPEG,
      ["-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "pipe:0", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", String(FPS), file],
      (s) => (stdin = s),
    );
    for (let i = 0; i < total; i++) {
      const time = i / FPS;
      const shot = shots.find((s) => time < s.to) ?? shots[shots.length - 1];
      const k = Math.min(1, (time - shot.from) / (shot.to - shot.from));
      const yy = shot.y0 + (shot.y1 - shot.y0) * ease(k);
      const xx = shot.diary ? ease(Math.min(1, Math.max(0, (k - 0.1) / 0.8))) : null;
      await page.evaluate(
        (ms, top, x) => {
          window.__clock.advance(ms);
          window.scrollTo(0, top);
          if (x != null) {
            const s = document.querySelector(".no-scrollbar");
            if (s) s.scrollLeft = x * (s.scrollWidth - s.clientWidth);
          }
          return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        },
        1000 / FPS,
        yy,
        xx,
      );
      const frame = await page.screenshot({ type: "jpeg", quality: 92, optimizeForSpeed: true });
      if (!stdin.write(frame)) await new Promise((r) => stdin.once("drain", r));
      if (i % (FPS * 5) === 0) log(`invitation ${Math.round((i / total) * 100)}%`);
    }
    stdin.end();
    await encoding;
  } finally {
    await browser.close().catch(() => {});
  }
}

async function main() {
  await mkdir(WORK, { recursive: true });
  log(`using ${ORIGIN}`);
  const opening = await renderOpening();
  const scroll = path.join(WORK, "invitation-scroll.mp4");
  await renderScroll(scroll);

  const d1 = duration(opening);
  const total = d1 + duration(scroll) - CROSSFADE;
  const musicLen = total - MUSIC_AT;
  log(`joining: opening ${d1.toFixed(1)}s + invitation = ${total.toFixed(1)}s`);
  await run(FFMPEG, [
    "-y",
    "-i", opening,
    "-i", scroll,
    "-stream_loop", "-1", "-i", MUSIC,
    "-filter_complex",
    [
      `[0:v]setsar=1,fps=${FPS}[v0]`,
      `[1:v]setsar=1,fps=${FPS}[v1]`,
      `[v0][v1]xfade=transition=fade:duration=${CROSSFADE}:offset=${(d1 - CROSSFADE).toFixed(3)},fade=t=out:st=${(total - 1.2).toFixed(2)}:d=1.2[v]`,
      `[0:a]aresample=48000,apad=whole_dur=${total.toFixed(3)}[oa]`,
      `[2:a]aresample=48000,atrim=0:${musicLen.toFixed(3)},asetpts=PTS-STARTPTS,volume=${MUSIC_VOLUME},afade=t=in:d=1.5,afade=t=out:st=${(musicLen - 2.5).toFixed(2)}:d=2.5,adelay=${Math.round(MUSIC_AT * 1000)}:all=1[m]`,
      `[oa][m]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[a]`,
    ].join(";"),
    "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-c:a", "aac", "-b:a", "192k", "-t", total.toFixed(3), "-movflags", "+faststart",
    OUT,
  ]);
  log(`done → ${OUT}`);
}

main().catch((err) => {
  console.error("[video]", err);
  process.exit(1);
});
