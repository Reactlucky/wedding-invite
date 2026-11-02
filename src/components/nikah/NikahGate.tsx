"use client";

import { useRef } from "react";
import { orderedNames } from "@/lib/defaults";
import { gsap, useGSAP } from "@/lib/gsap";
import type { GateProps } from "../shared/InvitationExperience";
import { PatternBackdrop, StarRosette } from "./ornaments";

export function NikahGate({ data, onOpen }: GateProps) {
  const root = useRef<HTMLDivElement>(null);
  const [a, b] = orderedNames(data);

  useGSAP(
    () => {
      gsap.fromTo(".g-in", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.15, ease: "power3.out", delay: 0.2 });
      gsap.to(".g-seal", { rotation: 360, duration: 60, repeat: -1, ease: "none" });
      gsap.to(".g-pulse", { scale: 1.5, opacity: 0, duration: 2.2, repeat: -1, ease: "power2.out" });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-deep px-6 text-center">
      <div className="absolute inset-0" style={{ background: "radial-gradient(70% 60% at 50% 45%, var(--c-base), var(--c-deep))" }} />
      <PatternBackdrop id="gate-bg" className="absolute inset-0" opacity={0.12} size={70} />
      <p className="g-in relative font-display text-[10px] tracking-[0.5em] text-accent-light/80 uppercase">You are invited to</p>
      <p className="g-in text-gold relative mt-2 font-serif text-3xl italic">the Nikah of</p>

      <button
        type="button"
        onClick={onOpen}
        className="g-in group relative my-10 grid h-44 w-44 place-items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-light"
        aria-label="Open the invitation"
      >
        <span className="g-pulse absolute inset-0 rounded-full border border-accent/60" />
        <StarRosette className="g-seal absolute inset-0 h-full w-full opacity-80" />
        <span
          className="relative grid h-24 w-24 place-items-center rounded-full shadow-[0_10px_40px_rgba(0,0,0,.5)] transition duration-500 group-hover:scale-105 group-active:scale-95"
          style={{ background: "radial-gradient(circle at 35% 30%, var(--c-accent-light), var(--c-accent) 55%, color-mix(in oklab, var(--c-accent) 50%, black))" }}
        >
          <span className="font-script text-4xl text-deep">
            {a.charAt(0)}
            <span className="font-serif text-xl">&</span>
            {b.charAt(0)}
          </span>
        </span>
      </button>

      <p className="g-in text-gold relative font-script text-4xl sm:text-5xl">
        {a} &amp; {b}
      </p>
      <button
        type="button"
        onClick={onOpen}
        className="g-in relative mt-8 rounded-full border border-accent/70 px-8 py-3 font-display text-[11px] tracking-[0.4em] text-accent-light uppercase transition hover:bg-accent hover:text-deep"
      >
        Open Invitation
      </button>
      <p className="g-in relative mt-4 text-xs text-ink/50">Best experienced with sound on</p>
    </div>
  );
}
