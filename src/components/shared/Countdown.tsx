"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { gsap } from "@/lib/gsap";

function subscribeClock(cb: () => void) {
  const id = setInterval(cb, 1000);
  return () => clearInterval(id);
}
const clockSnapshot = () => Math.floor(Date.now() / 1000) * 1000;

function diff(target: number, now: number) {
  const ms = Math.max(0, target - now);
  return {
    done: ms === 0,
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor(ms / 3_600_000) % 24,
    minutes: Math.floor(ms / 60_000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
  };
}

function Unit({ value, label, variant }: { value: number; label: string; variant: "arch" | "flip" }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value && ref.current) {
      gsap.fromTo(
        ref.current,
        variant === "flip" ? { rotateX: -90, opacity: 0.2 } : { y: -14, opacity: 0, filter: "blur(4px)" },
        { rotateX: 0, y: 0, opacity: 1, filter: "blur(0px)", duration: 0.55, ease: "power3.out" },
      );
    }
    prev.current = value;
  }, [value, variant]);

  const text = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={
          variant === "arch"
            ? "relative grid h-20 w-16 place-items-center rounded-t-full border border-accent/50 bg-deep/60 sm:h-28 sm:w-24"
            : "relative grid h-20 w-16 place-items-center rounded-md border border-accent/40 bg-black/50 shadow-[inset_0_-1px_0_rgba(255,255,255,.06)] sm:h-28 sm:w-24"
        }
        style={{ perspective: 400 }}
      >
        {variant === "flip" && <span className="absolute inset-x-0 top-1/2 h-px bg-black/60" />}
        <span ref={ref} className="text-gold block pt-2 font-display text-3xl tabular-nums sm:text-5xl" style={{ transformOrigin: "50% 50%" }}>
          {text}
        </span>
      </div>
      <span className="font-display text-[10px] tracking-[0.35em] text-ink/70 uppercase">{label}</span>
    </div>
  );
}

export function Countdown({ target, variant = "arch" }: { target: Date; variant?: "arch" | "flip" }) {
  // ticking clock as an external store; null on the server avoids hydration mismatch
  const now = useSyncExternalStore(subscribeClock, clockSnapshot, () => null);
  if (now === null) return <div className="h-28" />;
  const d = diff(target.getTime(), now);
  if (d.done) {
    return <p className="text-gold font-script text-5xl">The celebration has begun</p>;
  }
  return (
    <div className="flex items-start justify-center gap-3 sm:gap-6" role="timer" aria-live="off">
      <Unit value={d.days} label="Days" variant={variant} />
      <Unit value={d.hours} label="Hours" variant={variant} />
      <Unit value={d.minutes} label="Minutes" variant={variant} />
      <Unit value={d.seconds} label="Seconds" variant={variant} />
    </div>
  );
}
