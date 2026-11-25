"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

export interface OpeningProps<D> {
  data: D;
  /** deterministic frame-by-frame rendering for MP4 export */
  exportMode: boolean;
  /** true while the opening timeline should advance */
  started: boolean;
  onComplete: () => void;
  /** Pause here until `holdReleased`, so a tap can continue the sequence. Ignored while exporting. */
  holdAt?: number;
  holdReleased?: boolean;
  onHold?: () => void;
}

interface Options {
  duration: number;
  exportMode: boolean;
  started: boolean;
  onComplete: () => void;
  /** add every tween/label to the master timeline */
  build: (tl: gsap.core.Timeline) => void;
  /** draw canvas / WebGL layers for timeline time t (seconds) */
  render?: (t: number) => void;
  /** resolves when heavy assets (3D scene, images) are ready for export */
  ready?: () => Promise<void>;
  /** Pause here until `holdReleased`. Ignored while exporting. */
  holdAt?: number;
  holdReleased?: boolean;
  onHold?: () => void;
  /** rebuild when these change (e.g. names edited live in the editor) */
  deps: unknown[];
}

declare global {
  interface Window {
    __opening?: { duration: number; ready: boolean; seek: (t: number) => void };
  }
}

/**
 * One master GSAP timeline drives the whole opening. Canvas/Three layers are
 * rendered from `tl.time()` instead of their own clocks, so the identical
 * sequence can be played live or seeked frame-by-frame by the MP4 exporter.
 */
export function useCinematicTimeline(scope: RefObject<HTMLElement | null>, opts: Options) {
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const optsRef = useRef(opts);
  // declared before useGSAP so it runs first in the layout-effect phase
  useLayoutEffect(() => {
    optsRef.current = opts;
  });
  const resumeAt = useRef(0);
  const heldNotice = useRef(false);

  useGSAP(
    () => {
      const o = optsRef.current;
      const tl = gsap.timeline({
        paused: true,
        onComplete: () => optsRef.current.onComplete(),
      });
      o.build(tl);
      // pad the timeline to the cue-sheet length so audio and picture end together
      if (tl.duration() < o.duration) tl.set({}, {}, o.duration);
      tlRef.current = tl;

      const render = () => optsRef.current.render?.(tl.time());

      if (o.exportMode) {
        tl.seek(0, true);
        render();
        window.__opening = {
          duration: o.duration,
          ready: false,
          seek: (t: number) => {
            tl.seek(t, true);
            optsRef.current.render?.(t);
          },
        };
        const imgs = Array.from(scope.current?.querySelectorAll("img") ?? []);
        Promise.all([
          document.fonts.ready,
          o.ready?.() ?? Promise.resolve(),
          ...imgs.map((i) => i.decode().catch(() => {})),
        ]).then(() => requestAnimationFrame(() => requestAnimationFrame(() => window.__opening && (window.__opening.ready = true))));
        return () => {
          delete window.__opening;
          tl.kill();
        };
      }

      tl.seek(resumeAt.current, true);
      render();
      const held = o.holdAt != null && !o.holdReleased && resumeAt.current >= o.holdAt - 0.001;
      heldNotice.current = held;
      if (optsRef.current.started && !held) tl.play();
      else if (held && o.holdAt != null) {
        tl.pause(o.holdAt);
        o.onHold?.();
      }
      tl.eventCallback("onUpdate", () => {
        const live = optsRef.current;
        if (live.holdAt == null || live.holdReleased || heldNotice.current) return;
        if (tl.time() < live.holdAt) return;
        heldNotice.current = true;
        tl.pause(live.holdAt);
        live.render?.(live.holdAt);
        live.onHold?.();
      });
      gsap.ticker.add(render);
      return () => {
        resumeAt.current = tl.time();
        gsap.ticker.remove(render);
        tl.kill();
      };
    },
    { scope, dependencies: opts.deps, revertOnUpdate: true },
  );

  useEffect(() => {
    if (opts.exportMode) return;
    const tl = tlRef.current;
    if (!tl) return;
    if (!opts.started) {
      resumeAt.current = 0;
      tl.pause(0);
      return;
    }
    if (opts.holdReleased || opts.holdAt == null) tl.play();
  }, [opts.started, opts.exportMode, opts.holdReleased, opts.holdAt]);

  return tlRef;
}
