"use client";

import { useEffect, useRef, useState } from "react";
import { TRAIN2_CUES as C } from "@/lib/cues";
import { orderedNames } from "@/lib/defaults";
import { gsap } from "@/lib/gsap";
import { clamp } from "@/lib/random";
import type { InvitationData } from "@/lib/types";
import { useCinematicTimeline, type OpeningProps } from "../../shared/useCinematicTimeline";
import { ConfettiField } from "../shared/confetti";
import { Coach, Locomotive, StationLedBoard, StationScene } from "./art";
import { TrainV2Hero } from "./TrainV2Hero";

const CAR_RATIO = 400 / 120;
const DOOR_CAR = 3; // loco, S1, S2, [B1] ← this coach's door opens
const DOOR_X = 23 / 400; // door centre within a car

export function stationTexts(data: InvitationData) {
  const [a, b] = orderedNames(data);
  const name = `${a.slice(0, 6)}-${b.slice(0, 6)} EXP`.toUpperCase();
  const marquee = `ARRIVING ON PLATFORM 1  ·  ${a.toUpperCase()} & ${b.toUpperCase()}  ·  ON TIME  ·  ${data.city.toUpperCase()} JN.  ·`;
  return { a, b, name, marquee };
}

export function Announcement({ a, b }: { a: string; b: string }) {
  return (
    <div className="st-ann" style={{ color: "#3a2a22" }}>
      <p className="font-v2-hindi text-[clamp(17px,5vw,26px)] font-semibold">यात्रीगण कृपया ध्यान दें</p>
      <p className="font-v2-sans mx-auto mt-1 max-w-[30ch] text-[clamp(11px,3.2vw,15px)] leading-relaxed opacity-75">
        Kind attention please. The {a} &amp; {b} Wedding Express will shortly arrive on platform 1.
      </p>
    </div>
  );
}

export function TrainV2Opening({ data, exportMode, started, onComplete }: OpeningProps<InvitationData>) {
  const root = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const marquee = useRef<HTMLSpanElement | null>(null);
  const confettiCanvas = useRef<HTMLCanvasElement>(null);
  const confetti = useRef<ConfettiField | null>(null);
  const fx = useRef({ confetti: 0 });
  const geo = useRef({ vw: 390, vh: 844, H: 180 });
  const [size, setSize] = useState("");
  const { a, b, name, marquee: marqueeText } = stationTexts(data);
  const palette = data.theme.train2.palette;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize(`${Math.round(e.contentRect.width)}x${Math.round(e.contentRect.height)}`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useCinematicTimeline(root, {
    duration: C.duration,
    exportMode,
    started,
    onComplete,
    deps: [size, a, b, data.date, data.city, palette.secondary, palette.accent],
    build: (tl) => {
      if (!size || !root.current) return;
      const vw = root.current.clientWidth;
      const vh = root.current.clientHeight;
      const Hpx = Math.min(vh * 0.2, vw * 0.5);
      geo.current = { vw, vh, H: Hpx };
      marquee.current = root.current.querySelector<HTMLSpanElement>(".v2-marquee");
      if (confettiCanvas.current) {
        confetti.current = new ConfettiField(confettiCanvas.current, [palette.secondary, palette.accent, "#ff8c1a", "#ffd166", "#f4a6b8", "#ffffff"], vw < 640 ? 130 : 200, 21);
      }
      fx.current = { confetti: 0 };

      // door position on screen once the train stops (horizontally centred by design)
      const doorY = vh * 0.68 - Hpx + Hpx * (58 / 120);
      gsap.set(".st-layer", { transformOrigin: `${vw / 2}px ${doorY}px`, scale: 1, autoAlpha: 1 });
      gsap.set(".flood", { left: vw / 2, top: doorY, xPercent: -50, yPercent: -50, opacity: 0, scale: 0.1 });
      gsap.set(".hero-layer", { autoAlpha: 0 });
      gsap.set(".v2-door-glow", { opacity: 0 });
      gsap.set(".v2-door-leaf", { x: 0 });
      gsap.set([".h-emblem", ".h-eyebrow", ".h-request"], { opacity: 0, y: 16 });
      gsap.set(".h-sign", { yPercent: -180, rotation: -5 });
      gsap.set(".h-date", { opacity: 0, scale: 0.7 });
      gsap.set(".h-train", { xPercent: 130 });
      gsap.set(".h-cue", { opacity: 0, y: 10 });

      tl.to(".st-ann", { scale: 1.05, duration: 0.22, yoyo: true, repeat: 1, ease: "power1.inOut" }, C.chime)
        // door slides open with warm light behind it; camera pushes in
        .to(".v2-door-glow", { opacity: 1, duration: 0.4 }, C.doorOpen)
        .to(".v2-door-leaf", { x: 25, duration: 0.7, ease: "power2.inOut" }, C.doorOpen + 0.1)
        .to(".st-layer", { scale: 1.5, duration: 1.4, ease: "power2.in" }, C.doorOpen + 0.15)
        .to(".flood", { opacity: 1, scale: 1, duration: 0.9, ease: "power2.in" }, C.flood)
        .set(".st-layer", { autoAlpha: 0 }, C.hero - 0.02)
        .set(".hero-layer", { autoAlpha: 1 }, C.hero - 0.02)
        .to(".flood", { opacity: 0, duration: 1.1, ease: "power2.out" }, C.hero)
        .to(fx.current, { confetti: 1, duration: 0.01 }, C.hero)
        // hero assembles
        .to(".h-sign", { yPercent: 0, rotation: 0, duration: 1, ease: "bounce.out" }, C.sign)
        .to([".h-emblem", ".h-eyebrow"], { opacity: 0.85, y: 0, duration: 0.8, stagger: 0.12, ease: "power2.out" }, C.hero + 0.15)
        .to(".h-train", { xPercent: 0, duration: 2, ease: "power3.out" }, C.hero + 0.5)
        .to(".h-request", { opacity: 0.85, y: 0, duration: 0.8, ease: "power2.out" }, C.date - 0.5)
        .to(".h-date", { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2.2)" }, C.date)
        .to(".h-cue", { opacity: 1, y: 0, duration: 0.6 }, C.date + 0.9);
    },
    render: (t) => {
      const { vw, H: Hpx } = geo.current;
      const W = Hpx * CAR_RATIO;
      const x0 = vw + Hpx * 0.6;
      const xStop = vw / 2 - (DOOR_CAR * W + DOOR_X * W);
      const p = clamp((t - C.enter) / (C.stop - C.enter));
      const e = 1 - Math.pow(1 - p, 2.4);
      const x = x0 + (xStop - x0) * e;
      const speed = p < 1 ? Math.pow(1 - p, 1.4) : 0;
      const bob = Math.sin(t * 19) * 0.9 * speed;
      if (strip.current) {
        strip.current.style.transform = `translate3d(${x.toFixed(2)}px, ${bob.toFixed(2)}px, 0)`;
        const r = (8 / 120) * Hpx;
        strip.current.style.setProperty("--wheel", `${(-((x0 - x) / r) * 57.2958) % 360}deg`);
      }
      // LED marquee scrolls at a fixed rate
      if (marquee.current) {
        const half = marquee.current.scrollWidth / 2 || 1;
        marquee.current.style.transform = `translateX(${-((t * 55) % half)}px)`;
      }
      confetti.current?.draw(t - C.hero, false, fx.current.confetti);
    },
  });

  return (
    <div ref={root} className="absolute inset-0 overflow-hidden bg-[#f7efe2]" style={{ contain: "strict" }}>
      <div className="st-layer absolute inset-0 will-change-transform">
        <StationScene
          city={data.city || "Shaadi"}
          board={<StationLedBoard trainNo="1402" name={name} marquee={marqueeText} manual />}
          announcement={<Announcement a={a} b={b} />}
          trainSlot={
            <div className="absolute bottom-[32%] left-0" style={{ height: "min(20dvh, 50vw)" }}>
              <div ref={strip} className="flex h-full will-change-transform" style={{ transform: "translate3d(200vw,0,0)" }}>
                {/* headlight spill ahead of the engine */}
                <div className="pointer-events-none absolute -left-[14%] top-[40%] h-[60%] w-[30%]" style={{ background: "radial-gradient(closest-side, rgba(255,246,205,.9), rgba(255,236,170,.35) 55%, transparent)" }} />
                <Locomotive label={`${a} & ${b}`.toUpperCase()} className="h-full w-auto shrink-0" style={{ aspectRatio: "400 / 120" }} />
                {["S1", "S2", "B1", "B2", "B3"].map((n, i) => (
                  <Coach
                    key={n}
                    number={n}
                    board={`${a} ♥ ${b}`.toUpperCase()}
                    door={i === DOOR_CAR - 1}
                    uid={`op-${n}`}
                    className="h-full w-auto shrink-0"
                    style={{ aspectRatio: "400 / 120" }}
                  />
                ))}
              </div>
            </div>
          }
        />
      </div>

      <div className="hero-layer invisible absolute inset-0">
        <TrainV2Hero
          data={data}
          cue={
            <div className="h-cue font-v2-sans absolute bottom-[3.5%] left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1.5 text-xs font-medium shadow-md" style={{ color: "var(--c-ink)" }}>
              Scroll to board ↓
            </div>
          }
        />
        <canvas ref={confettiCanvas} className="pointer-events-none absolute inset-0 h-full w-full" />
      </div>

      <div
        className="flood pointer-events-none absolute h-[260vmax] w-[260vmax] rounded-full"
        style={{ background: "radial-gradient(circle, #fffef6 0%, #fff4d6 30%, #ffe2a8 55%, rgba(255,214,150,0) 70%)" }}
      />
    </div>
  );
}
