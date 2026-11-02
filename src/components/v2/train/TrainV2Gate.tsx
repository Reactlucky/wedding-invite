"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { GateProps } from "../../shared/InvitationExperience";
import { StationLedBoard, StationScene } from "./art";
import { Announcement, stationTexts } from "./TrainV2Opening";

/** Identical framing to the opening's first frame, so tapping flows straight into the train's arrival. */
export function TrainV2Gate({ data, onOpen }: GateProps) {
  const root = useRef<HTMLDivElement>(null);
  const { a, b, name, marquee } = stationTexts(data);
  useGSAP(
    () => {
      gsap.fromTo(".g-pill", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: "power3.out" });
      gsap.to(".g-pill", { scale: 1.05, duration: 0.9, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1.2 });
    },
    { scope: root },
  );
  return (
    <div ref={root} className="fixed inset-0 z-50">
      <StationScene
        city={data.city || "Shaadi"}
        board={<StationLedBoard trainNo="1402" name={name} marquee={marquee} />}
        announcement={<Announcement a={a} b={b} />}
        overlay={
          <button
            type="button"
            onClick={onOpen}
            className="g-pill font-v2-sans absolute bottom-[9%] left-1/2 -translate-x-1/2 rounded-full bg-white px-6 py-2.5 text-sm font-medium shadow-[0_8px_24px_-8px_rgba(0,0,0,.45)] transition active:scale-95"
            style={{ color: "#3a2a22" }}
          >
            Tap to board 🎟️
          </button>
        }
      />
    </div>
  );
}
