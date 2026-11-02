"use client";

import type { RefObject } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

/**
 * Scroll choreography for invitation pages:
 *  [data-reveal]            fade + rise (staggered in batches)
 *  [data-reveal="line"]     ornamental rule draws from the centre
 *  [data-reveal="zoom"]     soft scale-in
 *  [data-parallax="0.2"]    drifts against the scroll
 */
export function useReveal(scope: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const els = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      if (reduce) {
        gsap.set(els, { opacity: 1 });
        return;
      }
      const groups: Record<string, HTMLElement[]> = { up: [], line: [], zoom: [] };
      els.forEach((el) => {
        const kind = el.dataset.reveal || "up";
        (groups[kind] ?? groups.up).push(el);
      });

      gsap.set(groups.up, { opacity: 0, y: 36 });
      gsap.set(groups.line, { scaleX: 0, opacity: 1 });
      gsap.set(groups.zoom, { opacity: 0, scale: 0.92 });

      ScrollTrigger.batch(groups.up, {
        start: "top 88%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.12 }),
      });
      ScrollTrigger.batch(groups.line, {
        start: "top 92%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { scaleX: 1, duration: 1.4, ease: "power2.inOut", stagger: 0.1 }),
      });
      ScrollTrigger.batch(groups.zoom, {
        start: "top 90%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, scale: 1, duration: 1.2, ease: "power3.out", stagger: 0.08 }),
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const amt = Number(el.dataset.parallax) || 0.2;
        gsap.to(el, {
          yPercent: -100 * amt,
          ease: "none",
          scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true },
        });
      });

      // layout can shift once images/fonts load
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh);
      document.fonts?.ready.then(refresh);
      return () => window.removeEventListener("load", refresh);
    },
    { scope, dependencies: deps, revertOnUpdate: true },
  );
}
