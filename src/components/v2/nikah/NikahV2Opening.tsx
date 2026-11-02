"use client";

import { useEffect, useRef, useState } from "react";
import { NIKAH2_CUES as C } from "@/lib/cues";
import { gsap } from "@/lib/gsap";
import { clamp } from "@/lib/random";
import type { InvitationData } from "@/lib/types";
import { useCinematicTimeline, type OpeningProps } from "../../shared/useCinematicTimeline";
import { ConfettiField } from "../shared/confetti";
import { ArchBay, CourtyardScene, FlatLantern, GrandGate } from "./art";
import { NikahV2Hero } from "./NikahV2Hero";

const BAYS_BEFORE = 4;
const BAYS_AFTER = 3;
const BAY_RATIO = 200 / 300;
const GATE_RATIO = 320 / 420;
const GATE_SCALE = 1.4; // gate height relative to a bay

export function Banner() {
  return (
    <div className="cy-banner" style={{ color: "var(--c-ink)" }}>
      <p className="font-arabic text-[clamp(22px,6.6vw,36px)] leading-snug" style={{ color: "var(--c-secondary)" }} dir="rtl" lang="ar">
        بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
      </p>
      <p className="font-v2-sans mx-auto mt-1 max-w-[32ch] text-[clamp(11px,3.1vw,14px)] leading-relaxed opacity-70">
        In the name of Allah, the Most Gracious, the Most Merciful
      </p>
    </div>
  );
}

/** Arcade strip: bays, then the grand gate, then more bays. Height is set by CSS. */
export function Arcade({ stripRef }: { stripRef?: React.Ref<HTMLDivElement> }) {
  const bay = (k: string) => (
    <div key={k} className="relative h-full shrink-0" style={{ aspectRatio: `${BAY_RATIO}` }}>
      <ArchBay className="absolute inset-0 h-full w-full" />
      <div className="n2-swing absolute left-1/2 top-[15%] w-[18%] -translate-x-1/2" style={{ transformOrigin: "50% 0%" }}>
        <FlatLantern className="w-full" />
      </div>
    </div>
  );
  return (
    <div className="absolute bottom-[18%] left-0" style={{ height: "min(38dvh, 62vw)" }}>
      <div ref={stripRef} className="flex h-full items-end will-change-transform">
        {Array.from({ length: BAYS_BEFORE }, (_, i) => bay(`b${i}`))}
        <div className="relative shrink-0" style={{ height: `${GATE_SCALE * 100}%`, aspectRatio: `${GATE_RATIO}` }}>
          <GrandGate className="absolute inset-0 h-full w-full" />
        </div>
        {Array.from({ length: BAYS_AFTER }, (_, i) => bay(`a${i}`))}
      </div>
    </div>
  );
}

export function NikahV2Opening({ data, exportMode, started, onComplete }: OpeningProps<InvitationData>) {
  const root = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const confettiCanvas = useRef<HTMLCanvasElement>(null);
  const confetti = useRef<ConfettiField | null>(null);
  const fx = useRef({ confetti: 0 });
  const geo = useRef({ vw: 390, Hb: 240 });
  const [size, setSize] = useState("");
  const palette = data.theme.nikah2.palette;

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
    deps: [size, data.bride, data.groom, data.nameOrder, data.date, palette.secondary, palette.accent],
    build: (tl) => {
      if (!size || !root.current) return;
      const vw = root.current.clientWidth;
      const vh = root.current.clientHeight;
      const Hb = Math.min(vh * 0.38, vw * 0.62);
      geo.current = { vw, Hb };
      if (confettiCanvas.current) {
        confetti.current = new ConfettiField(confettiCanvas.current, ["#e8516f", "#f4a6b8", "#c2185b", palette.accent, "#ffffff", "#f6a21a"], vw < 640 ? 120 : 190, 44);
      }
      fx.current = { confetti: 0 };

      const Hg = Hb * GATE_SCALE;
      const doorY = vh * 0.82 - Hg + Hg * (290 / 420);
      gsap.set(".cy-layer", { transformOrigin: `${vw / 2}px ${doorY}px`, scale: 1, autoAlpha: 1 });
      gsap.set(".flood", { left: vw / 2, top: doorY, xPercent: -50, yPercent: -50, opacity: 0, scale: 0.1 });
      gsap.set(".hero-layer", { autoAlpha: 0 });
      gsap.set(".n2-door-glow", { opacity: 0 });
      gsap.set(".n2-door-l", { scaleX: 1, transformOrigin: "0% 50%" });
      gsap.set(".n2-door-r", { scaleX: 1, transformOrigin: "100% 50%" });
      gsap.set([".h-emblem", ".h-eyebrow", ".h-request"], { opacity: 0, y: 16 });
      gsap.set(".h-sign", { yPercent: -160, rotation: -10 });
      gsap.set(".h-date", { opacity: 0, scale: 0.8 });
      gsap.set(".h-skyline", { yPercent: 40, opacity: 0 });
      gsap.set(".h-cue", { opacity: 0, y: 10 });

      tl.to(".cy-banner", { scale: 1.04, duration: 0.3, yoyo: true, repeat: 1, ease: "power1.inOut" }, C.chime)
        .to(".n2-door-glow", { opacity: 1, duration: 0.5 }, C.doorsOpen)
        .to(".n2-door-l", { scaleX: 0.06, duration: 1.1, ease: "power2.inOut" }, C.doorsOpen)
        .to(".n2-door-r", { scaleX: 0.06, duration: 1.1, ease: "power2.inOut" }, C.doorsOpen)
        .to(".cy-layer", { scale: 1.7, duration: 1.5, ease: "power2.in" }, C.doorsOpen + 0.3)
        .to(".flood", { opacity: 1, scale: 1, duration: 0.9, ease: "power2.in" }, C.flood)
        .set(".cy-layer", { autoAlpha: 0 }, C.hero - 0.02)
        .set(".hero-layer", { autoAlpha: 1 }, C.hero - 0.02)
        .to(".flood", { opacity: 0, duration: 1.1, ease: "power2.out" }, C.hero)
        .to(fx.current, { confetti: 1, duration: 0.01 }, C.hero)
        .to(".h-skyline", { yPercent: 0, opacity: 1, duration: 1.4, ease: "power3.out" }, C.hero + 0.1)
        .to([".h-emblem", ".h-eyebrow"], { opacity: 0.85, y: 0, duration: 0.8, stagger: 0.12, ease: "power2.out" }, C.hero + 0.1)
        .to(".h-sign", { yPercent: 0, duration: 0.7, ease: "power3.out" }, C.plaque)
        .to(".h-sign", { rotation: 0, duration: 1.6, ease: "elastic.out(1.1, 0.35)" }, C.plaque + 0.35)
        .to(".h-request", { opacity: 0.85, y: 0, duration: 0.8, ease: "power2.out" }, C.date - 0.5)
        .to(".h-date", { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2)" }, C.date)
        .to(".h-cue", { opacity: 1, y: 0, duration: 0.6 }, C.date + 0.9);
    },
    render: (t) => {
      const { vw, Hb } = geo.current;
      const Wb = Hb * BAY_RATIO;
      const Wg = Hb * GATE_SCALE * GATE_RATIO;
      const xStop = vw / 2 - (BAYS_BEFORE * Wb + Wg / 2);
      const p = clamp((t - C.pan) / (C.panEnd - C.pan));
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const x = xStop * e;
      if (strip.current) strip.current.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      // lanterns sway, a little more while the camera moves
      const motion = Math.sin(Math.PI * p);
      root.current?.querySelectorAll<HTMLElement>(".n2-swing, .cy-lantern").forEach((el, i) => {
        const deg = (2.5 + motion * 5) * Math.sin(t * 1.6 + i * 1.3);
        el.style.transform = `rotate(${deg.toFixed(2)}deg)`;
      });
      confetti.current?.draw(t - C.hero, false, fx.current.confetti);
    },
  });

  return (
    <div ref={root} className="absolute inset-0 overflow-hidden" style={{ contain: "strict", background: "var(--c-base)" }}>
      <div className="cy-layer absolute inset-0 will-change-transform">
        <CourtyardScene banner={<Banner />} arcade={<Arcade stripRef={strip} />} />
      </div>
      <div className="hero-layer invisible absolute inset-0">
        <NikahV2Hero
          data={data}
          cue={
            <div className="h-cue font-v2-sans absolute bottom-[3.5%] left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1.5 text-xs font-medium shadow-md" style={{ color: "var(--c-ink)" }}>
              Scroll to enter ↓
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
