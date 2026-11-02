"use client";

import { useEffect, useRef } from "react";
import { orderedNames } from "@/lib/defaults";
import { TRAIN_CUES as C } from "@/lib/cues";
import { formatDayMonth, formatTime, parseLocal } from "@/lib/format";
import { gsap } from "@/lib/gsap";
import type { InvitationData } from "@/lib/types";
import { useCinematicTimeline, type OpeningProps } from "../shared/useCinematicTimeline";
import { FlapRow, renderFlaps } from "./SplitFlap";
import { TrainScene } from "./TrainScene";
import { TrainTicket } from "./TrainTicket";

const pad = (n: number) => String(n).padStart(2, "0");

export function TrainOpening({ data, exportMode, started, onComplete }: OpeningProps<InvitationData>) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const scene = useRef<TrainScene | null>(null);

  const [a, b] = orderedNames(data);
  const date = parseLocal(data.date);
  const d = formatDayMonth(date);
  const palette = data.theme.train.palette;
  const paletteKey = JSON.stringify(palette);
  const initials = `${a.charAt(0)}&${b.charAt(0)}`;

  // The WebGL scene lives outside the timeline so resizes don't rebuild it
  useEffect(() => {
    const el = canvas.current;
    const host = root.current;
    if (!el || !host) return;
    const s = new TrainScene(el, { palette: JSON.parse(paletteKey), initials, clockTime: parseLocal(data.date), exportMode });
    scene.current = s;
    const ro = new ResizeObserver(([e]) => {
      s.resize(e.contentRect.width, e.contentRect.height);
    });
    ro.observe(host);
    document.fonts?.ready.then(() => scene.current === s && s.refreshTextures());
    return () => {
      ro.disconnect();
      scene.current = null;
      s.dispose();
    };
  }, [paletteKey, initials, data.date, exportMode]);

  const lineA = a.toUpperCase();
  const lineB = `& ${b.toUpperCase()}`;
  const maxLen = Math.max(lineA.length, lineB.length, 14);

  useCinematicTimeline(root, {
    duration: C.duration,
    exportMode,
    started,
    onComplete,
    deps: [a, b, data.date, data.venue, data.city],
    ready: async () => {
      while (!scene.current) await new Promise((r) => setTimeout(r, 30));
      await document.fonts.ready;
      scene.current.refreshTextures();
    },
    build: (tl) => {
      gsap.set(".t-fade", { opacity: 1 });
      gsap.set(".t-bar", { scaleY: 0 });
      gsap.set(".t-title > *", { opacity: 0, y: 24, filter: "blur(8px)" });
      gsap.set(".t-arriving", { opacity: 0, x: -20 });
      gsap.set(".t-steam", { opacity: 0 });
      gsap.set(".t-blob", { scale: 0.5 });
      gsap.set(".t-boardwrap", { autoAlpha: 0 });
      gsap.set(".t-board", { y: 50, scale: 0.94, rotateX: 12 });
      gsap.set(".t-datewrap", { autoAlpha: 0 });
      gsap.set(".t-save", { opacity: 0, letterSpacing: "1.2em" });
      gsap.set(".t-digit", { opacity: 0, y: -120, scale: 1.5, filter: "blur(18px)" });
      gsap.set(".t-sep", { opacity: 0, scale: 0 });
      gsap.set(".t-when", { opacity: 0, y: 16 });
      gsap.set(".t-streak", { xPercent: -160 });
      gsap.set(".t-ticketwrap", { autoAlpha: 0 });
      gsap.set(".tk", { yPercent: 140, rotation: -9 });
      gsap.set(".tk-stamp", { opacity: 0, scale: 2.8, rotation: -40 });

      // fade up from black into letterboxed widescreen
      tl.to(".t-fade", { opacity: 0, duration: 1.8, ease: "power1.inOut" }, C.fadeIn)
        .to(".t-bar", { scaleY: 1, duration: 1.4, ease: "power3.inOut" }, 0.1);

      // title card
      tl.to(".t-title > *", { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.3, stagger: 0.22, ease: "power3.out" }, C.title)
        .to(".t-title > *", { opacity: 0, y: -18, filter: "blur(6px)", duration: 0.9, stagger: 0.08, ease: "power2.in" }, C.whistle + 0.4)
        .to(".t-arriving", { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" }, C.whistle + 1.2)
        .to(".t-arriving", { opacity: 0, duration: 0.6 }, C.steamEngulf - 0.6);

      // steam engulfs the camera as the engine arrives
      tl.to(".t-steam", { opacity: 1, duration: 1.1, ease: "power2.in" }, C.steamEngulf)
        .to(".t-blob", { scale: 1.7, duration: 2.6, stagger: 0.12, ease: "power2.out" }, C.steamEngulf)
        .to(".t-bar", { scaleY: 0, duration: 1, ease: "power2.inOut" }, C.board - 0.3)
        .to(".t-steam", { opacity: 0.35, duration: 1.6, ease: "power1.out" }, C.board);

      // split-flap departure board (letters flip in render())
      tl.to(".t-boardwrap", { autoAlpha: 1, duration: 0.7 }, C.board)
        .to(".t-board", { y: 0, scale: 1, rotateX: 0, duration: 1.1, ease: "power3.out" }, C.board)
        .to(".t-board", { y: -40, scale: 0.92, opacity: 0, filter: "blur(6px)", duration: 0.7, ease: "power2.in" }, C.dateReveal - 0.55)
        .set(".t-boardwrap", { autoAlpha: 0 }, C.dateReveal);

      // dramatic date reveal
      tl.set(".t-datewrap", { autoAlpha: 1 }, C.dateReveal - 0.3)
        .to(".t-save", { opacity: 1, letterSpacing: "0.5em", duration: 1.2, ease: "power3.out" }, C.dateReveal - 0.3)
        .to(".t-digit", { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.9, stagger: 0.16, ease: "expo.out" }, C.dateReveal)
        .to(".t-sep", { opacity: 1, scale: 1, duration: 0.5, stagger: 0.16, ease: "back.out(3)" }, C.dateReveal + 0.2)
        .to(".t-streak", { xPercent: 160, duration: 1.1, ease: "power2.inOut" }, C.dateReveal + 0.5)
        .to(".t-when", { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" }, C.dateReveal + 0.7)
        .to(".t-datewrap", { y: -60, opacity: 0, duration: 0.7, ease: "power2.in" }, C.ticket - 0.2);

      // boarding ticket slides in and gets stamped
      tl.set(".t-ticketwrap", { autoAlpha: 1 }, C.ticket)
        .to(".tk", { yPercent: 0, rotation: -2.5, duration: 1.1, ease: "power3.out" }, C.ticket)
        .to(".tk-stamp", { opacity: 0.9, scale: 1, rotation: -14, duration: 0.35, ease: "back.out(2.5)" }, C.ticket + 0.95)
        .to(".tk", { x: 4, duration: 0.05, yoyo: true, repeat: 3 }, C.ticket + 1.05);
    },
    render: (t) => {
      scene.current?.render(t);
      if (board.current) renderFlaps(board.current, t, C.flaps);
    },
  });

  return (
    <div ref={root} className="grain absolute inset-0 overflow-hidden bg-black" style={{ contain: "strict" }}>
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      {/* colour grade + vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(110% 80% at 50% 45%, transparent 50%, rgba(0,0,0,.6) 100%)" }}
      />

      {/* title card */}
      <div className="t-title pointer-events-none absolute inset-x-0 top-[17%] px-6 text-center">
        <p className="font-mono text-[10px] tracking-[0.5em] text-accent-light/90 uppercase sm:text-xs">Platform 1 · Evening Service</p>
        <h2 className="text-gold mt-3 font-display text-3xl tracking-[0.12em] uppercase sm:text-6xl">The Royal Express</h2>
        <p className="mt-3 font-serif text-lg italic text-ink/85 sm:text-2xl">A journey to forever begins</p>
      </div>
      <p className="t-arriving pointer-events-none absolute bottom-[16%] left-[6%] font-mono text-[10px] tracking-[0.4em] text-ink/80 uppercase sm:text-xs">
        ● Now arriving · Platform 1
      </p>

      {/* steam */}
      <div className="t-steam pointer-events-none absolute inset-0">
        {[
          ["20%", "70%", "90vmax"],
          ["75%", "60%", "80vmax"],
          ["50%", "95%", "110vmax"],
          ["40%", "30%", "70vmax"],
        ].map(([x, y, s], i) => (
          <div
            key={i}
            className="t-blob absolute rounded-full"
            style={{
              left: x,
              top: y,
              width: s,
              height: s,
              translate: "-50% -50%",
              background: "radial-gradient(circle, rgba(255,250,240,.95) 0%, rgba(255,240,220,.6) 35%, rgba(255,230,200,0) 70%)",
            }}
          />
        ))}
      </div>

      {/* departure board */}
      <div className="t-boardwrap absolute inset-0 grid place-items-center px-3" style={{ perspective: 900 }}>
        <div className="absolute inset-0 bg-black/45" />
        <div
          ref={board}
          className="t-board relative rounded-xl border-[3px] p-3 shadow-[0_30px_80px_rgba(0,0,0,.7)] sm:p-6"
          style={{
            ["--cell" as string]: `min(2.3rem, calc((100vw - 5.5rem) / ${maxLen + 3}))`,
            background: "linear-gradient(#0d0b09, #050403)",
            borderColor: "var(--c-accent)",
          }}
        >
          <div className="mb-3 flex items-end justify-between gap-6 border-b border-accent/40 pb-2">
            <p className="font-display text-sm tracking-[0.3em] text-accent-light uppercase sm:text-xl">Departures</p>
            <p className="font-mono text-sm text-[#ffd98f] sm:text-lg">
              {pad(date.getHours())}:{pad(date.getMinutes())}
            </p>
          </div>
          <div className="mb-1 flex justify-between font-mono text-[8px] tracking-[0.3em] text-ink/50 uppercase sm:text-[10px]">
            <span>Destination</span>
            <span>Plat.</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-[4px]">
              <FlapRow text={lineA.padEnd(maxLen, " ")} />
              <FlapRow text={lineB.padEnd(maxLen, " ")} />
            </div>
            <FlapRow text="1" />
          </div>
          <div className="mt-3 border-t border-accent/30 pt-2">
            <FlapRow text="FOREVER · ON TIME" />
          </div>
        </div>
      </div>

      {/* date reveal */}
      <div className="t-datewrap pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <div className="absolute inset-0" style={{ background: "radial-gradient(70% 60% at 50% 50%, rgba(0,0,0,.55), rgba(0,0,0,.25))" }} />
        <p className="t-save relative font-display text-xs text-accent-light uppercase sm:text-sm">Save the Date</p>
        <div className="relative mt-4 flex items-center gap-1.5 overflow-hidden px-2 sm:gap-5">
          <span className="t-digit text-gold font-display leading-none" style={{ fontSize: "clamp(2.6rem, 12.5vw, 10rem)" }}>
            {d.day}
          </span>
          <span className="t-sep h-3 w-3 rotate-45 bg-accent sm:h-4 sm:w-4" />
          <span className="t-digit text-gold font-display leading-none" style={{ fontSize: "clamp(2.6rem, 12.5vw, 10rem)" }}>
            {pad(date.getMonth() + 1)}
          </span>
          <span className="t-sep h-3 w-3 rotate-45 bg-accent sm:h-4 sm:w-4" />
          <span className="t-digit text-gold font-display leading-none" style={{ fontSize: "clamp(2.6rem, 12.5vw, 10rem)" }}>
            {d.year}
          </span>
          <span
            className="t-streak pointer-events-none absolute inset-y-0 left-0 w-1/2"
            style={{ background: "linear-gradient(100deg, transparent, rgba(255,250,235,.55), transparent)", mixBlendMode: "overlay" }}
          />
        </div>
        <p className="t-when relative mt-5 font-serif text-xl italic text-ink sm:text-3xl">
          {d.weekday}, {d.month} · {formatTime(date)}
        </p>
      </div>

      {/* ticket */}
      <div className="t-ticketwrap absolute inset-0 grid place-items-center px-2">
        <div className="absolute inset-0 bg-black/40" />
        <TrainTicket data={data} />
      </div>

      {/* letterbox */}
      <div className="t-bar pointer-events-none absolute inset-x-0 top-0 h-[9%] origin-top bg-black" />
      <div className="t-bar pointer-events-none absolute inset-x-0 bottom-0 h-[9%] origin-bottom bg-black" />
      <div className="t-fade pointer-events-none absolute inset-0 bg-black" />
    </div>
  );
}
