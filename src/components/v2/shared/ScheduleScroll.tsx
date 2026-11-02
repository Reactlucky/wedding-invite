"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

/**
 * Scroll driver for the v2 schedules: moves the marker (.tt-train) down the
 * rail (.tt-track) and reports which stop (.tt-stop) it has reached.
 * Must be rendered inside the section element with class "v2-tt".
 */
export function ScheduleScroll({ count, onStop }: { count: number; onStop: (i: number) => void }) {
  const anchor = useRef<HTMLSpanElement>(null);
  useGSAP(
    () => {
      const section = anchor.current?.closest<HTMLElement>(".v2-tt");
      if (!section) return;
      const track = section.querySelector<HTMLElement>(".tt-track")!;
      const train = section.querySelector<HTMLElement>(".tt-train")!;
      const stops = Array.from(section.querySelectorAll<HTMLElement>(".tt-stop"));
      let last = -1;
      ScrollTrigger.create({
        trigger: track,
        start: "top 55%",
        end: "bottom 55%",
        scrub: 0.6,
        onUpdate: (self) => {
          gsap.set(train, { y: self.progress * (track.offsetHeight - train.offsetHeight) });
          const trainTop = train.getBoundingClientRect().top;
          let idx = 0;
          stops.forEach((s, i) => {
            if (s.getBoundingClientRect().top - 40 <= trainTop) idx = i;
          });
          if (idx !== last) {
            last = idx;
            onStop(idx);
          }
        },
      });
    },
    { dependencies: [count] },
  );
  return <span ref={anchor} hidden />;
}
