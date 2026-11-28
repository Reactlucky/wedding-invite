import "server-only";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import puppeteer, { type Browser } from "puppeteer-core";
import { encodeWav, renderOpeningMix } from "@/lib/audio/score";
import { TEMPLATE_INFO, type TemplateId } from "@/lib/types";
import { resolveSounds } from "@/lib/sounds";
import { EXPORT_DIR, UPLOAD_DIR, getInvitation } from "./store";

export type ExportFormat = "portrait" | "landscape" | "square";

export const FORMATS: Record<ExportFormat, { width: number; height: number }> = {
  portrait: { width: 1080, height: 1920 },
  landscape: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
};

export interface ExportJob {
  id: string;
  template: TemplateId;
  format: ExportFormat;
  fps: number;
  status: "queued" | "rendering" | "encoding" | "done" | "error";
  /** 0..1 */
  progress: number;
  frames?: number;
  error?: string;
  file?: string;
  createdAt: number;
}

// Survive dev hot-reloads
const g = globalThis as unknown as { __exportJobs?: Map<string, ExportJob>; __exportChain?: Promise<unknown> };
const jobs = (g.__exportJobs ??= new Map());

export function getJob(id: string) {
  return jobs.get(id);
}

function chromePath(): string {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean) as string[];
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error("Chrome not found. Set CHROME_PATH to a Chrome/Chromium executable.");
  return found;
}

export function startExport(origin: string, template: TemplateId, format: ExportFormat, fps = 30): ExportJob {
  const job: ExportJob = { id: randomUUID(), template, format, fps, status: "queued", progress: 0, createdAt: Date.now() };
  jobs.set(job.id, job);
  pruneJobs();
  // One export at a time: headless WebGL rendering is CPU-heavy.
  g.__exportChain = (g.__exportChain ?? Promise.resolve()).then(() =>
    run(job, origin).catch((err) => {
      job.status = "error";
      job.error = err instanceof Error ? err.message : String(err);
      console.error("[export]", err);
    }),
  );
  return job;
}

function pruneJobs() {
  const all = [...jobs.values()].sort((a, b) => b.createdAt - a.createdAt);
  for (const old of all.slice(8)) {
    jobs.delete(old.id);
    if (old.file) rm(old.file, { force: true }).catch(() => {});
  }
}

async function run(job: ExportJob, origin: string) {
  job.status = "rendering";
  const FPS = job.fps;
  const { width, height } = FORMATS[job.format];
  const workDir = path.join(EXPORT_DIR, job.id);
  await mkdir(workDir, { recursive: true });

  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      executablePath: chromePath(),
      headless: true,
      args: [
        "--no-sandbox",
        "--hide-scrollbars",
        "--mute-audio",
        // Hardware GPU is 2–5x faster; SwiftShader stays available as a fallback on GPU-less servers.
        ...(process.env.EXPORT_SOFTWARE_GL === "1" ? ["--use-angle=swiftshader"] : []),
        "--enable-unsafe-swiftshader",
        "--ignore-gpu-blocklist",
        `--window-size=${width / 2},${height / 2}`,
      ],
    });
    const page = await browser.newPage();
    // Lay out like a real phone/laptop screen at 2x density: same output pixels, correct composition, crisper text.
    await page.setViewport({ width: width / 2, height: height / 2, deviceScaleFactor: 2 });
    await page.goto(`${origin}${TEMPLATE_INFO[job.template].route}?export=1`, { waitUntil: "networkidle0", timeout: 120_000 });
    await page.waitForFunction("window.__opening && window.__opening.ready === true", { timeout: 120_000 });
    const duration = (await page.evaluate("window.__opening.duration")) as number;
    const total = Math.round(duration * FPS);
    job.frames = total;

    // Soundtrack: original score (or the uploaded music) + synced sound design + uploaded one-shots at their cues
    const invitation = await getInvitation();
    const sounds = resolveSounds(invitation, job.template);
    const mediaPath = (src: string | null | undefined) => {
      if (!src?.startsWith("/api/media/")) return null;
      const f = path.join(UPLOAD_DIR, path.basename(src));
      return existsSync(f) ? f : null;
    };
    const musicFile = mediaPath(sounds.music.src);
    const samples = sounds.samples.map((s) => ({ ...s, file: mediaPath(s.src) })).filter((s) => s.file);
    const omit = samples.map((s) => s.key);
    const wavPath = path.join(workDir, "audio.wav");
    await writeFile(wavPath, encodeWav(renderOpeningMix(job.template, duration, !musicFile && sounds.bed, sounds.music.volume, omit)));

    const out = path.join(workDir, `${job.template}-opening-${job.format}.mp4`);
    const args = ["-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "pipe:0", "-i", wavPath];
    const filters: string[] = [];
    const mixIn = ["[1:a]"];
    let input = 2;
    if (musicFile) {
      args.push("-i", musicFile);
      filters.push(
        `[${input}:a]volume=${sounds.music.volume.toFixed(2)},atrim=0:${duration},afade=t=out:st=${Math.max(0, duration - 1.2)}:d=1.2[m]`,
      );
      mixIn.push("[m]");
      input++;
    }
    samples.forEach((s, i) => {
      args.push("-i", s.file!);
      const ms = Math.round(s.at * 1000);
      filters.push(`[${input}:a]aresample=44100,adelay=${ms}:all=1[s${i}]`);
      mixIn.push(`[s${i}]`);
      input++;
    });
    if (mixIn.length > 1) {
      filters.push(`${mixIn.join("")}amix=inputs=${mixIn.length}:normalize=0:duration=first,alimiter=limit=0.95[a]`);
      args.push("-filter_complex", filters.join(";"), "-map", "0:v", "-map", "[a]");
    } else {
      args.push("-map", "0:v", "-map", "1:a");
    }
    args.push(
      "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", String(FPS),
      "-c:a", "aac", "-b:a", "192k", "-t", String(duration), "-movflags", "+faststart", out,
    );

    const ffmpeg = spawn(/* turbopackIgnore: true */ process.env.FFMPEG_PATH ?? "ffmpeg", args, { stdio: ["pipe", "ignore", "pipe"] });
    let stderr = "";
    ffmpeg.stderr.on("data", (d) => (stderr = (stderr + d).slice(-4000)));
    const exited = new Promise<void>((resolve, reject) => {
      ffmpeg.on("error", (e) => reject(new Error(`ffmpeg failed to start: ${e.message}. Set FFMPEG_PATH.`)));
      ffmpeg.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${stderr}`))));
    });

    // CSS animations (LED marquees, pulses) run on the wall clock, so pin them to video time too or they jump between frames.
    for (let i = 0; i < total; i++) {
      await page.evaluate((t) => {
        (window as unknown as { __opening: { seek(t: number): void } }).__opening.seek(t);
        const seen = ((window as unknown as { __cssAnims?: WeakMap<Animation, number> }).__cssAnims ??= new WeakMap());
        for (const a of document.getAnimations()) {
          if (!seen.has(a)) {
            a.pause();
            seen.set(a, t * 1000 - (Number(a.currentTime) || 0));
          }
          a.currentTime = t * 1000 - seen.get(a)!;
        }
        return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }, i / FPS);
      const frame = await page.screenshot({ type: "jpeg", quality: 92, optimizeForSpeed: true });
      if (!ffmpeg.stdin.write(frame)) await new Promise((r) => ffmpeg.stdin.once("drain", r));
      job.progress = (i + 1) / total;
    }
    ffmpeg.stdin.end();
    job.status = "encoding";
    await exited;
    job.file = out;
    job.status = "done";
    job.progress = 1;
  } finally {
    await browser?.close().catch(() => {});
  }
}
