"use client";

import { useEffect, useId, useRef, useState } from "react";
import { NIKAH_CUES as C } from "@/lib/cues";
import { gsap } from "@/lib/gsap";
import type { InvitationData } from "@/lib/types";
import { ParticleField } from "../shared/particles";
import { useCinematicTimeline, type OpeningProps } from "../shared/useCinematicTimeline";
import { NikahNames } from "./NikahNames";
import { Crescent, DOOR_CLIP, DoorLeaf, Lantern, MEHRAB, Mehrab, PatternBackdrop } from "./ornaments";

const LANTERNS = [
  { left: 7, chain: 18, scale: 1.0, depth: 1, mobile: true },
  { left: 21, chain: 6, scale: 0.75, depth: 0.7, mobile: false },
  { left: 33, chain: 26, scale: 0.55, depth: 0.5, mobile: true },
  { left: 67, chain: 22, scale: 0.55, depth: 0.5, mobile: true },
  { left: 79, chain: 4, scale: 0.75, depth: 0.7, mobile: false },
  { left: 93, chain: 14, scale: 1.0, depth: 1, mobile: true },
];

// mehrab width so that its 2:3 box never exceeds 94% of the viewport height
const MEHRAB_W = "min(94vw, 62.6dvh)";
const D = MEHRAB.door;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

export function NikahOpening({ data, exportMode, started, onComplete }: OpeningProps<InvitationData>) {
  const uid = useId().replace(/:/g, "");
  const root = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLCanvasElement>(null);
  const front = useRef<HTMLCanvasElement>(null);
  const fields = useRef<{ back: ParticleField; front: ParticleField } | null>(null);
  const fx = useRef({ dust: 0, stars: 0, swing: 1 });
  const burst = useRef<{ t0: number; x: number; y: number } | null>(null);
  const [size, setSize] = useState("");

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize(`${Math.round(e.contentRect.width)}x${Math.round(e.contentRect.height)}`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const palette = data.theme.nikah.palette;

  useCinematicTimeline(root, {
    duration: C.duration,
    exportMode,
    started,
    onComplete,
    deps: [size, data.bride, data.groom, data.nameOrder, data.date, data.venue, data.city, palette.accentLight],
    build: (tl) => {
      if (!size || !root.current || !back.current || !front.current) return;
      const mobile = root.current.clientWidth < 640;
      fields.current = {
        back: new ParticleField(back.current, "#fff6dc", { dust: 0, stars: mobile ? 110 : 200, seed: 9, maxDpr: 2 }),
        front: new ParticleField(front.current, palette.accentLight, {
          dust: mobile ? 45 : 85,
          sparks: mobile ? 110 : 190,
          seed: 4,
          maxDpr: 2,
        }),
      };
      fx.current = { dust: 0, stars: 0, swing: 1 };

      // Camera pivots on the doorway so the push-in flies straight through it
      const rootBox = root.current.getBoundingClientRect();
      const doorBox = root.current.querySelector(".n-doorway")!.getBoundingClientRect();
      const cx = doorBox.left - rootBox.left + doorBox.width / 2;
      const cy = doorBox.top - rootBox.top + doorBox.height * 0.55;
      burst.current = { t0: C.doorsOpen + 0.25, x: cx, y: cy };
      gsap.set(".n-cam", { transformOrigin: `${cx}px ${cy}px`, scale: 1.08 });

      // initial states
      gsap.set([".n-sky", ".n-wall", ".n-doorway", ".m-callig"], { opacity: 0 });
      gsap.set(".n-moon", { opacity: 0, y: 50, scale: 0.9 });
      gsap.set(".n-lantern", { yPercent: -140 });
      gsap.set(".n-seam", { opacity: 0, scaleY: 0.2 });
      gsap.set(".n-doorlight", { opacity: 0.0, scale: 0.85 });
      gsap.set(".n-names", { autoAlpha: 0 });
      gsap.set(".n-flash", { opacity: 0 });
      gsap.set(".nn-frame path", { strokeDashoffset: 1 });
      gsap.set(".nn-crescent", { opacity: 0, y: -20 });
      gsap.set([".nn-dua", ".nn-venue"], { opacity: 0, y: 14, filter: "blur(6px)" });
      gsap.set(".nn-eyebrow", { opacity: 0, letterSpacing: "1em" });
      gsap.set(".nn-name1 .ch, .nn-name2 .ch", { opacity: 0, y: 34, filter: "blur(10px)", scale: 1.15 });
      gsap.set(".nn-amp", { opacity: 0, scale: 0.4 });
      gsap.set(".nn-line", { scaleX: 0 });
      gsap.set(".nn-divider", { opacity: 0, scale: 0.3, rotation: -120 });
      gsap.set(".nn-date", { opacity: 0, y: 18, letterSpacing: "0.5em" });
      gsap.set(".nn-name1 .ch, .nn-name2 .ch", { backgroundPosition: "0% 50%" });

      // 1 · night sky, crescent, stars
      tl.to(".n-sky", { opacity: 1, duration: 1.8, ease: "power1.inOut" }, C.skyIn)
        .to(fx.current, { stars: 1, duration: 2.5, ease: "power1.in" }, C.skyIn)
        .to(".n-moon", { opacity: 1, y: 0, scale: 1, duration: 2.6, ease: "power2.out" }, C.skyIn + 0.4)
        .to(fx.current, { dust: 0.55, duration: 3, ease: "power1.in" }, C.skyIn + 0.6);

      // 2 · the gateway draws itself in gold
      tl.to(".n-wall", { opacity: 1, duration: 2.2, ease: "power1.inOut" }, C.archDraw - 0.3)
        .to(".m-outline", { strokeDashoffset: 0, duration: 2.3, stagger: 0.12, ease: "power2.inOut" }, C.archDraw)
        .to(".m-fill", { opacity: 1, duration: 1.6, stagger: 0.04, ease: "power1.out" }, C.archDraw + 0.9)
        .to(".m-pattern", { opacity: 1, duration: 1.8, ease: "power1.out" }, C.archDraw + 1.3)
        .to(".m-beads", { opacity: 0.9, duration: 1.2 }, C.archDraw + 1.9)
        .to(".n-doorway", { opacity: 1, duration: 1.3, ease: "power1.out" }, C.archDraw + 1.1);

      // 3 · lanterns lower on their chains
      tl.to(".n-lantern", { yPercent: 0, duration: 2.6, ease: "power3.out", stagger: { each: 0.16, from: "edges" } }, C.lanterns);

      // 4 · Bismillah reveals right-to-left
      tl.fromTo(
        ".m-callig",
        { opacity: 0, clipPath: "inset(0 0 0 100%)" },
        { opacity: 1, clipPath: "inset(0 0 0 0%)", duration: 1.8, ease: "power2.inOut" },
        C.calligraphy,
      );

      // 5 · slow dolly: settle, then push towards the doors
      tl.to(".n-cam", { scale: 1, duration: C.pushIn, ease: "power1.out" }, 0)
        .to(".n-cam", { scale: 1.14, duration: C.doorsOpen - C.pushIn + 0.6, ease: "power1.inOut" }, C.pushIn)
        .to(".n-seam", { opacity: 1, scaleY: 1, duration: 0.8, ease: "power2.in" }, C.doorsOpen - 0.7)
        .to(".n-doorlight", { opacity: 0.35, duration: 0.7 }, C.doorsOpen - 0.7);

      // 6 · the golden doors swing open, light floods out
      tl.to(".n-door-l", { rotateY: 104, duration: 1.8, ease: "power2.inOut" }, C.doorsOpen)
        .to(".n-door-r", { rotateY: -104, duration: 1.8, ease: "power2.inOut" }, C.doorsOpen)
        .to(".n-seam", { opacity: 0, duration: 0.5 }, C.doorsOpen + 0.3)
        .to(".n-doorlight", { opacity: 1, scale: 1.1, duration: 1.4, ease: "power2.out" }, C.doorsOpen + 0.15)
        .to(fx.current, { dust: 1, duration: 1.2 }, C.doorsOpen + 0.2)
        .to(fx.current, { swing: 2.2, duration: 0.6, ease: "power2.out" }, C.doorsOpen + 0.1)
        .to(fx.current, { swing: 1, duration: 2.5, ease: "power1.inOut" }, C.doorsOpen + 0.7);

      // 7 · fly through the doorway into light
      tl.to(".n-cam", { scale: 6, duration: C.flash - C.flythrough, ease: "power3.in" }, C.flythrough)
        .to(".n-lanterns", { scale: 1.9, opacity: 0, duration: C.flash - C.flythrough - 0.1, ease: "power2.in" }, C.flythrough)
        .to(".n-moon", { opacity: 0, y: -60, duration: 0.9, ease: "power2.in" }, C.flythrough)
        .to(".n-flash", { opacity: 1, duration: 0.55, ease: "power2.in" }, C.flash - 0.55)
        .set(".n-world", { autoAlpha: 0 }, C.flash)
        .set(".n-names", { autoAlpha: 1 }, C.flash)
        .set(fx.current, { dust: 0.6 }, C.flash)
        .to(".n-flash", { opacity: 0, duration: 1.6, ease: "power2.out" }, C.flash);

      // 8 · names reveal
      tl.to(".nn-frame path", { strokeDashoffset: 0, duration: 2.8, stagger: 0.15, ease: "power2.inOut" }, C.flash)
        .to(".nn-crescent", { opacity: 1, y: 0, duration: 1.4, ease: "power2.out" }, C.names - 0.2)
        .to(".nn-dua", { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.3, ease: "power2.out" }, C.names)
        .to(".nn-eyebrow", { opacity: 1, letterSpacing: "0.42em", duration: 1.5, ease: "power2.out" }, C.names + 0.3)
        .to(".nn-name1 .ch", { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, duration: 1.1, stagger: 0.07, ease: "power3.out" }, C.names + 0.6)
        .to(".nn-line", { scaleX: 1, duration: 1, ease: "power2.inOut" }, C.names + 1.4)
        .to(".nn-amp", { opacity: 1, scale: 1, duration: 0.9, ease: "back.out(2)" }, C.names + 1.5)
        .to(".nn-name2 .ch", { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, duration: 1.1, stagger: 0.07, ease: "power3.out" }, C.names + 1.8)
        .to(".nn-name1 .ch, .nn-name2 .ch", { backgroundPosition: "100% 50%", duration: 3.2, ease: "power1.inOut" }, C.names + 1.6)
        .to(".nn-divider", { opacity: 1, scale: 1, rotation: 0, duration: 1.1, ease: "back.out(1.6)" }, C.date - 0.5)
        .to(".nn-date", { opacity: 1, y: 0, letterSpacing: "0em", duration: 1.3, ease: "power3.out" }, C.date)
        .to(".nn-venue", { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.1, ease: "power2.out" }, C.date + 0.5);
    },
    render: (t) => {
      const f = fields.current;
      if (!f) return;
      const { dust, stars, swing } = fx.current;
      f.back.draw(t, 0, stars, null);
      f.front.draw(t, dust, 0, burst.current);
      // lantern sway & flame flicker are pure functions of t
      const sw = root.current?.querySelectorAll<HTMLElement>(".n-swing");
      sw?.forEach((el, i) => {
        const amp = (2.2 + 4 * Math.exp(-Math.max(0, t - C.lanterns - 1.2) * 0.6)) * swing;
        el.style.transform = `rotate(${amp * Math.sin(t * (1.1 + i * 0.13) + i * 1.7)}deg)`;
      });
      root.current?.querySelectorAll<SVGElement>(".n-flame").forEach((el, i) => {
        const fl = 0.72 + 0.14 * Math.sin(t * 9.1 + i * 3) + 0.1 * Math.sin(t * 13.7 + i) + 0.04 * Math.sin(t * 23 + i * 5);
        el.style.opacity = String(fl);
      });
    },
  });

  return (
    <div ref={root} className="grain absolute inset-0 overflow-hidden bg-deep" style={{ contain: "strict" }}>
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <clipPath id={`${uid}-door`} clipPathUnits="objectBoundingBox">
            <path d={DOOR_CLIP} />
          </clipPath>
        </defs>
      </svg>

      <div className="n-world absolute inset-0">
        <div
          className="n-sky absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 70% at 50% 100%, color-mix(in oklab, var(--c-secondary) 80%, transparent) 0%, transparent 60%), linear-gradient(to bottom, color-mix(in oklab, var(--c-deep) 70%, black) 0%, var(--c-deep) 55%, var(--c-base) 100%)",
          }}
        />
        <canvas ref={back} className="absolute inset-0 h-full w-full" />
        <Crescent className="n-moon absolute right-[8%] top-[4%] w-[22vw] max-w-[150px] sm:right-[14%] sm:top-[7%]" />

        <div className="n-cam absolute inset-0 will-change-transform">
          {/* flanking walls with girih tilework */}
          <div
            className="n-wall absolute inset-x-0 bottom-0"
            style={{
              height: `calc(${MEHRAB_W} * 1.5 * 0.64)`,
              background: "linear-gradient(to bottom, var(--c-base), var(--c-deep))",
              boxShadow: "0 -2px 0 color-mix(in oklab, var(--c-accent) 70%, transparent)",
            }}
          >
            <PatternBackdrop id={`${uid}-wall`} className="absolute inset-0" opacity={0.16} size={64} />
            {/* blind arcade along the wall */}
            <svg className="absolute inset-0 h-full w-full" aria-hidden>
              <defs>
                <pattern id={`${uid}-arcade`} width="150" height="3000" patternUnits="userSpaceOnUse" x="50%">
                  <path d="M18 3000 V150 C18 100 52 70 75 46 C98 70 132 100 132 150 V3000" fill="rgba(0,0,0,.22)" stroke="var(--c-accent)" strokeOpacity=".45" strokeWidth="1.5" />
                  <path d="M28 3000 V156 C28 112 58 86 75 66 C92 86 122 112 122 156 V3000" fill="none" stroke="var(--c-accent)" strokeOpacity=".2" />
                  <circle cx="0" cy="40" r="5" fill="var(--c-accent)" fillOpacity=".6" />
                  <circle cx="150" cy="40" r="5" fill="var(--c-accent)" fillOpacity=".6" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#${uid}-arcade)`} />
            </svg>
            <div className="absolute inset-0" style={{ background: "radial-gradient(60% 80% at 50% 100%, transparent 30%, rgba(0,0,0,.55) 100%)" }} />
          </div>

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: MEHRAB_W, aspectRatio: "2 / 3" }}>
            <Mehrab uid={uid} />
            <div
              className="n-doorway absolute"
              style={{
                left: pct(D.x, MEHRAB.w),
                top: pct(D.y, MEHRAB.h),
                width: pct(D.w, MEHRAB.w),
                height: pct(D.h, MEHRAB.h),
                clipPath: `url(#${uid}-door)`,
              }}
            >
              <div
                className="n-doorlight absolute inset-0"
                style={{
                  background:
                    "radial-gradient(70% 55% at 50% 62%, #fffdf3 0%, var(--c-accent-light) 32%, color-mix(in oklab, var(--c-accent) 60%, transparent) 62%, color-mix(in oklab, var(--c-deep) 80%, transparent) 100%)",
                }}
              >
                <div
                  className="absolute inset-[-40%] opacity-60 mix-blend-screen"
                  style={{
                    background:
                      "repeating-conic-gradient(from 0deg at 50% 62%, rgba(255,248,220,.5) 0deg 4deg, transparent 4deg 13deg)",
                    maskImage: "radial-gradient(circle at 50% 62%, black 0%, transparent 60%)",
                    WebkitMaskImage: "radial-gradient(circle at 50% 62%, black 0%, transparent 60%)",
                  }}
                />
              </div>
              <div className="absolute inset-0 flex" style={{ perspective: "1100px" }}>
                <div className="n-door-l h-full w-1/2" style={{ transformOrigin: "0% 50%" }}>
                  <DoorLeaf uid={uid} side="left" />
                </div>
                <div className="n-door-r h-full w-1/2" style={{ transformOrigin: "100% 50%" }}>
                  <DoorLeaf uid={uid} side="right" />
                </div>
              </div>
              <div
                className="n-seam absolute left-1/2 top-[8%] h-[92%] w-[3px] -translate-x-1/2"
                style={{ background: "linear-gradient(to bottom, transparent, #fff6d5 25%, #fff6d5 85%, transparent)", boxShadow: "0 0 24px 6px var(--c-accent-light)" }}
              />
            </div>
          </div>
        </div>

        <div className="n-lanterns pointer-events-none absolute inset-0" style={{ transformOrigin: "50% 40%" }}>
          {LANTERNS.map((l, i) => (
            <div
              key={i}
              className={`n-lantern absolute top-0 ${l.mobile ? "" : "hidden sm:block"}`}
              style={{ left: `${l.left}%`, width: `clamp(${38 * l.scale}px, ${7 * l.scale}vw, ${92 * l.scale}px)`, filter: l.depth < 0.6 ? "blur(0.6px) brightness(.85)" : undefined }}
            >
              <div className="n-swing -translate-x-1/2" style={{ transformOrigin: "50% 0%" }}>
                <div className="mx-auto w-[2px]" style={{ height: `${l.chain}dvh`, background: "linear-gradient(var(--c-accent), var(--c-accent-light))" }} />
                <Lantern className="-mt-[2px] block w-full" glowClass="n-flame" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <canvas ref={front} className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="n-names invisible absolute inset-0">
        <div className="absolute inset-0" style={{ background: "radial-gradient(80% 60% at 50% 45%, var(--c-base) 0%, var(--c-deep) 75%)" }} />
        <PatternBackdrop id={`${uid}-names-bg`} className="absolute inset-0" opacity={0.1} size={72} />
        <NikahNames data={data} uid={`${uid}-nn`} />
      </div>

      <div
        className="n-flash pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 55%, #fffef8 0%, #fff7dc 35%, var(--c-accent-light) 75%, var(--c-accent) 100%)" }}
      />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,.55) 100%)" }} />
    </div>
  );
}
