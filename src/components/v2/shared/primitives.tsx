"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { ConfettiField } from "./confetti";

/* ------------------------------------------------------------------ text */

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`font-v2-sans text-[10px] font-medium tracking-[0.32em] uppercase opacity-70 ${className}`}>{children}</p>;
}

export function V2Title({ eyebrow, title, className = "" }: { eyebrow: string; title: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <Eyebrow>
        <span data-reveal className="inline-block">
          {eyebrow}
        </span>
      </Eyebrow>
      <h2 data-reveal className="font-v2-serif mt-3 text-[2rem] leading-tight sm:text-5xl" style={{ color: "var(--c-ink)" }}>
        {title}
      </h2>
      <svg data-reveal viewBox="0 0 120 10" className="mt-3 h-2.5 w-24" aria-hidden>
        <path d="M2 5h40M78 5h40" stroke="var(--c-secondary)" strokeWidth="1.5" />
        <path d="M46 5h28" stroke="var(--c-secondary)" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="60" cy="5" r="3" fill="var(--c-accent)" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------- LED */

/** Amber dot-matrix text on a dark panel. `marquee` scrolls continuously (CSS). */
export function Led({ text, marquee = false, className = "", style }: { text: string; marquee?: boolean; className?: string; style?: CSSProperties }) {
  if (!marquee) {
    return (
      <span className={`led ${className}`} style={style}>
        {text}
      </span>
    );
  }
  return (
    <span className={`relative block overflow-hidden whitespace-nowrap ${className}`} style={style}>
      <span className="led-marquee led inline-block">
        <span className="pr-8">{text}</span>
        <span className="pr-8">{text}</span>
      </span>
    </span>
  );
}

/* ------------------------------------------------------------- countdown */

function subscribeClock(cb: () => void) {
  const id = setInterval(cb, 1000);
  return () => clearInterval(id);
}
const clockSnapshot = () => Math.floor(Date.now() / 1000) * 1000;

export function useCountdown(target: Date) {
  const now = useSyncExternalStore(subscribeClock, clockSnapshot, () => null);
  if (now === null) return null;
  const ms = Math.max(0, target.getTime() - now);
  return {
    done: ms === 0,
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor(ms / 3_600_000) % 24,
    minutes: Math.floor(ms / 60_000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
  };
}

/** Digit that flips when its value changes. */
export function FlipDigit({ value, className = "" }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value && ref.current) {
      gsap.fromTo(ref.current, { rotateX: -80, opacity: 0.3 }, { rotateX: 0, opacity: 1, duration: 0.45, ease: "power3.out" });
    }
    prev.current = value;
  }, [value]);
  return (
    <span ref={ref} className={`inline-block tabular-nums ${className}`} style={{ transformOrigin: "50% 50%" }}>
      {value}
    </span>
  );
}

/* -------------------------------------------------------------- confetti */

/** Looping confetti canvas for heroes (respects reduced motion). */
export function ConfettiLoop({ colors, count = 90, className = "" }: { colors: string[]; count?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = colors.join(",");
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const field = new ConfettiField(el, key.split(","), count, 33);
    const ro = new ResizeObserver(() => field.resize());
    ro.observe(el);
    const start = performance.now();
    const tick = () => field.draw((performance.now() - start) / 1000 + 4, true, 0.8);
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
    };
  }, [key, count]);
  return <canvas ref={ref} className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden />;
}

/* --------------------------------------------------------------- hashtag */

export function HashtagCopy({ tag, buttonClass }: { tag: string; buttonClass: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(tag);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = tag;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className={buttonClass}
    >
      {copied ? "✓ Copied" : "⧉ Copy hashtag"}
    </button>
  );
}

/** Short station-style code for an event title, e.g. "Mehndi Night" → "MHND". */
export function eventCode(title: string) {
  const words = title.toUpperCase().replace(/[^A-Z ]/g, "").split(/\s+/).filter(Boolean);
  let code = "";
  for (const w of words) {
    code += w[0] + w.slice(1).replace(/[AEIOU]/g, "");
    if (code.length >= 4) break;
  }
  return code.slice(0, 4) || "STOP";
}
