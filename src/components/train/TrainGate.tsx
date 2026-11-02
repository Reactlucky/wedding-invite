"use client";

import { useRef } from "react";
import { orderedNames } from "@/lib/defaults";
import { gsap, useGSAP } from "@/lib/gsap";
import type { GateProps } from "../shared/InvitationExperience";
import { StationBackdrop } from "./StationBackdrop";

export function TrainGate({ data, onOpen }: GateProps) {
  const root = useRef<HTMLDivElement>(null);
  const [a, b] = orderedNames(data);
  useGSAP(
    () => {
      gsap.fromTo(".g-in", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.14, ease: "power3.out", delay: 0.2 });
      gsap.to(".g-ticket", { y: -6, rotation: -1, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
    },
    { scope: root },
  );
  return (
    <div ref={root} className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6 text-center">
      <StationBackdrop />
      <div className="absolute inset-0 bg-black/45" />
      <p className="g-in relative font-mono text-[10px] tracking-[0.5em] text-accent-light uppercase">The Royal Express</p>
      <p className="g-in text-gold relative mt-3 font-script text-5xl sm:text-6xl">
        {a} &amp; {b}
      </p>
      <p className="g-in relative mt-2 font-serif text-lg italic text-ink/85">request the pleasure of your company</p>
      <button
        type="button"
        onClick={onOpen}
        aria-label="Board the train — open the invitation"
        className="g-in g-ticket relative mt-10 flex overflow-hidden rounded-xl text-[#2a1a10] shadow-[0_30px_60px_rgba(0,0,0,.6)] transition hover:scale-[1.03] active:scale-95"
        style={{ background: "linear-gradient(135deg, #fbf2dc, #e9d3a1)" }}
      >
        <span className="flex flex-col items-start px-6 py-4">
          <span className="font-mono text-[9px] tracking-[0.3em] uppercase">Admit one · First class</span>
          <span className="mt-1 font-display text-xl tracking-[0.15em] uppercase">Tap to board</span>
        </span>
        <span className="grid place-items-center border-l-2 border-dashed border-[#7a4a1c]/50 px-4 font-display text-2xl">→</span>
      </button>
      <p className="g-in relative mt-5 text-xs text-ink/60">Best experienced with sound on</p>
    </div>
  );
}
