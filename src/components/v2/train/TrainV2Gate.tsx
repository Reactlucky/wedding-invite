"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { parseLocal } from "@/lib/format";
import type { GateProps } from "../../shared/InvitationExperience";
import { StationLedBoard, StationScene } from "./art";
import { shortDate } from "./TrainV2Hero";
import { Announcement, stationTexts } from "./TrainV2Opening";

/**
 * Welcome card over the station's first frame. Its tap is what lets the browser
 * play the horn and announcement while the train arrives.
 */
export function TrainV2Gate({ data, onOpen }: GateProps) {
  const root = useRef<HTMLDivElement>(null);
  const { a, b, name, marquee } = stationTexts(data);
  useGSAP(
    () => {
      gsap.fromTo(".g-veil", { opacity: 0 }, { opacity: 1, duration: 0.6 });
      gsap.fromTo(".g-card", { opacity: 0, y: 24, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, delay: 0.15, ease: "power3.out" });
      gsap.to(".g-open", { scale: 1.04, duration: 0.9, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1.2 });
    },
    { scope: root },
  );
  return (
    <div ref={root} className="fixed inset-0 z-50">
      <StationScene
        city={data.city || "Shaadi"}
        board={<StationLedBoard trainNo="1402" name={name} marquee={marquee} />}
        announcement={<Announcement a={a} b={b} />}
      />
      <div className="g-veil absolute inset-0 z-[60] grid place-items-center bg-black/55 px-5 backdrop-blur-[2px]">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="g-title"
          className="g-card w-full max-w-sm rounded-2xl border-4 px-6 py-8 text-center shadow-[0_24px_60px_-20px_rgba(0,0,0,.7)]"
          style={{ background: "var(--c-base)", borderColor: "var(--c-accent)", color: "var(--c-ink)" }}
        >
          <p className="font-v2-sans text-[10px] font-semibold tracking-[0.35em] uppercase opacity-70">Train 1402 · Platform 1</p>
          <h1 id="g-title" className="font-v2-serif mt-4 text-[clamp(28px,8vw,38px)] leading-tight">
            You&apos;re invited
          </h1>
          <p className="font-v2-serif mt-3 text-xl">
            {a} <span style={{ color: "var(--c-secondary)" }}>♥</span> {b}
          </p>
          <p className="font-v2-sans mt-2 text-xs tracking-[0.2em] uppercase opacity-70">{shortDate(parseLocal(data.date))}</p>
          <button
            type="button"
            onClick={onOpen}
            className="g-open font-v2-sans mt-7 inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold tracking-[0.12em] text-white uppercase shadow-[0_10px_24px_-10px_rgba(0,0,0,.6)] transition active:scale-95"
            style={{ background: "var(--c-secondary)" }}
          >
            Open invitation ✉️
          </button>
          <p className="font-v2-sans mt-4 text-[10px] tracking-[0.2em] uppercase opacity-50">Turn your sound on 🔊</p>
        </div>
      </div>
    </div>
  );
}
