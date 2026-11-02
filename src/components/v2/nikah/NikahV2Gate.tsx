"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { GateProps } from "../../shared/InvitationExperience";
import { CourtyardScene } from "./art";
import { Arcade, Banner } from "./NikahV2Opening";

/** Same framing as the opening's first frame: tapping flows straight into the pan. */
export function NikahV2Gate({ onOpen }: GateProps) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.fromTo(".g-pill", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: "power3.out" });
      gsap.to(".g-pill", { scale: 1.05, duration: 0.9, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1.2 });
      gsap.to(".n2-swing, .cy-lantern", { rotation: 3, duration: 1.8, yoyo: true, repeat: -1, ease: "sine.inOut", stagger: 0.3 });
    },
    { scope: root },
  );
  return (
    <div ref={root} className="fixed inset-0 z-50">
      <CourtyardScene
        banner={<Banner />}
        arcade={<Arcade />}
        overlay={
          <button
            type="button"
            onClick={onOpen}
            className="g-pill font-v2-sans absolute bottom-[6%] left-1/2 -translate-x-1/2 rounded-full bg-white px-6 py-2.5 text-sm font-medium shadow-[0_8px_24px_-8px_rgba(0,0,0,.45)] transition active:scale-95"
            style={{ color: "var(--c-ink)" }}
          >
            Tap to enter ✨
          </button>
        }
      />
    </div>
  );
}
