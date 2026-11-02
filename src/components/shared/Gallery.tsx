"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import type { Photo, TemplateId } from "@/lib/types";

/* ------------------------------------------------------------ default art */
/* Original illustrated tiles shown until the couple uploads their photos.  */

function NikahArt({ n }: { n: number }) {
  const id = `na${n}`;
  const sky = (
    <defs>
      <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--c-deep)" />
        <stop offset="1" stopColor="var(--c-secondary)" />
      </linearGradient>
      <radialGradient id={`${id}g`} cx=".5" cy=".55" r=".6">
        <stop offset="0" stopColor="var(--c-accent-light)" stopOpacity=".55" />
        <stop offset="1" stopColor="var(--c-accent-light)" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
  const arch = "M60 400 L60 190 C60 120 120 80 150 60 C180 80 240 120 240 190 L240 400 Z";
  const views = [
    <g key="0">
      <path d={arch} fill={`url(#${id}g)`} stroke="var(--c-accent)" strokeWidth="2" />
      <path d="M170 120 a26 26 0 1 0 22 40 a20 20 0 1 1 -22 -40z" fill="var(--c-accent-light)" />
      {[90, 150, 210].map((x, i) => (
        <g key={x} transform={`translate(${x} ${40 + i * 18})`}>
          <line x1="0" y1="-60" x2="0" y2="0" stroke="var(--c-accent)" />
          <path d="M-9 0 h18 l-4 26 h-10 z" fill="var(--c-accent)" opacity=".9" />
          <circle cx="0" cy="13" r="14" fill="var(--c-accent-light)" opacity=".25" />
        </g>
      ))}
    </g>,
    <g key="1">
      <circle cx="150" cy="200" r="120" fill={`url(#${id}g)`} />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x="95" y="145" width="110" height="110" fill="none" stroke="var(--c-accent)" strokeWidth="1.5" transform={`rotate(${i * 11.25} 150 200)`} />
      ))}
      <circle cx="150" cy="200" r="22" fill="var(--c-accent)" />
    </g>,
    <g key="2">
      <path d="M40 400 V300 h40 v-30 c0-50 70-90 70-130 c0 40 70 80 70 130 v30 h40 v100z" fill="var(--c-deep)" stroke="var(--c-accent)" strokeWidth="1.5" />
      <path d="M150 140 v-30" stroke="var(--c-accent)" strokeWidth="2" />
      <path d="M150 92 a10 10 0 1 0 8 15 a8 8 0 1 1 -8 -15z" fill="var(--c-accent-light)" />
      <circle cx="150" cy="260" r="80" fill={`url(#${id}g)`} />
    </g>,
    <g key="3">
      {Array.from({ length: 12 }).map((_, i) => (
        <ellipse key={i} cx="150" cy="200" rx="34" ry="90" fill="none" stroke="var(--c-accent)" strokeWidth="1.2" opacity=".8" transform={`rotate(${i * 15} 150 200)`} />
      ))}
      <circle cx="150" cy="200" r="30" fill="var(--c-accent-light)" opacity=".4" />
    </g>,
  ];
  return (
    <svg viewBox="0 0 300 400" className="h-full w-full" role="img" aria-label="Decorative illustration">
      {sky}
      <rect width="300" height="400" fill={`url(#${id}s)`} />
      {views[n % views.length]}
    </svg>
  );
}

function TrainArt({ n }: { n: number }) {
  const id = `ta${n}`;
  const defs = (
    <defs>
      <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--c-deep)" />
        <stop offset=".55" stopColor="var(--c-base)" />
        <stop offset="1" stopColor="var(--c-accent-light)" />
      </linearGradient>
    </defs>
  );
  const views = [
    <g key="0">
      <circle cx="150" cy="250" r="60" fill="var(--c-accent-light)" opacity=".9" />
      <rect y="250" width="300" height="150" fill="var(--c-deep)" />
      <path d="M150 250 L40 400 M150 250 L260 400" stroke="var(--c-accent)" strokeWidth="3" />
      {Array.from({ length: 9 }).map((_, i) => {
        const y = 255 + i * i * 1.9;
        const w = 6 + i * i * 1.6;
        return <line key={i} x1={150 - w} x2={150 + w} y1={y} y2={y} stroke="var(--c-accent)" strokeWidth={1 + i * 0.4} opacity=".7" />;
      })}
    </g>,
    <g key="1">
      <circle cx="150" cy="190" r="90" fill="var(--c-deep)" stroke="var(--c-accent)" strokeWidth="6" />
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={i} x1="150" y1="112" x2="150" y2="124" stroke="var(--c-accent-light)" strokeWidth="3" transform={`rotate(${i * 30} 150 190)`} />
      ))}
      <line x1="150" y1="190" x2="150" y2="130" stroke="var(--c-ink)" strokeWidth="4" strokeLinecap="round" />
      <line x1="150" y1="190" x2="195" y2="205" stroke="var(--c-ink)" strokeWidth="3" strokeLinecap="round" />
      <path d="M150 100 v-60" stroke="var(--c-accent)" strokeWidth="4" />
    </g>,
    <g key="2">
      <rect y="300" width="300" height="100" fill="var(--c-deep)" />
      <rect x="70" y="150" width="160" height="160" rx="70" fill="var(--c-secondary)" stroke="var(--c-accent)" strokeWidth="3" />
      <circle cx="150" cy="220" r="26" fill="var(--c-accent-light)" />
      <rect x="135" y="80" width="30" height="70" fill="var(--c-deep)" />
      <circle cx="150" cy="60" r="34" fill="var(--c-ink)" opacity=".25" />
      <circle cx="175" cy="35" r="26" fill="var(--c-ink)" opacity=".18" />
    </g>,
    <g key="3">
      <rect x="40" y="120" width="220" height="160" rx="10" fill="var(--c-ink)" opacity=".92" />
      <line x1="190" y1="130" x2="190" y2="270" stroke="var(--c-base)" strokeDasharray="4 5" />
      <text x="60" y="165" fontFamily="monospace" fontSize="14" fill="var(--c-base)">ADMIT TWO</text>
      <text x="60" y="210" fontFamily="serif" fontSize="30" fontStyle="italic" fill="var(--c-secondary)">Forever</text>
      <text x="60" y="250" fontFamily="monospace" fontSize="11" fill="var(--c-base)">PLATFORM 1 · CAR A</text>
    </g>,
  ];
  return (
    <svg viewBox="0 0 300 400" className="h-full w-full" role="img" aria-label="Decorative illustration">
      {defs}
      <rect width="300" height="400" fill={`url(#${id}s)`} />
      {views[n % views.length]}
    </svg>
  );
}

/* ------------------------------------------------------------------ gallery */

type Item = { kind: "photo"; photo: Photo } | { kind: "art"; n: number };

export function Gallery({ photos, template }: { photos: Photo[]; template: TemplateId }) {
  const items: Item[] = photos.length
    ? photos.map((p) => ({ kind: "photo", photo: p }))
    : [0, 1, 2, 3, 4, 5].map((n) => ({ kind: "art", n }));
  const [open, setOpen] = useState<number | null>(null);

  const Art = template === "nikah" ? NikahArt : TrainArt;
  const renderItem = (it: Item, big = false) =>
    it.kind === "photo" ? (
      // user uploads are pre-compressed to WebP client-side, so a plain lazy <img> is optimal here
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={it.photo.src}
        alt={it.photo.caption || "Couple photo"}
        loading={big ? "eager" : "lazy"}
        decoding="async"
        width={it.photo.width}
        height={it.photo.height}
        className={big ? "max-h-[85dvh] max-w-[92vw] rounded-lg object-contain" : "h-auto w-full object-cover transition duration-700 group-hover:scale-105"}
      />
    ) : (
      <div className={big ? "aspect-[3/4] h-[80dvh] max-w-[92vw]" : "aspect-[3/4] w-full"}>
        <Art n={it.n} />
      </div>
    );

  return (
    <>
      {!photos.length && (
        <p data-reveal className="-mt-6 mb-8 text-center text-sm italic text-ink/50">
          Illustrations shown until photos are added in the editor
        </p>
      )}
      <div className="mx-auto max-w-6xl columns-2 gap-3 sm:gap-5 md:columns-3">
        {items.map((it, i) => (
          <button
            key={it.kind === "photo" ? it.photo.id : `art${it.n}`}
            type="button"
            data-reveal="zoom"
            onClick={() => setOpen(i)}
            className="group relative mb-3 block w-full overflow-hidden rounded-xl border border-accent/30 sm:mb-5"
            aria-label={`Open image ${i + 1}`}
          >
            {renderItem(it)}
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent opacity-0 transition group-hover:opacity-100" />
          </button>
        ))}
      </div>
      {open !== null && (
        <Lightbox count={items.length} index={open} onIndex={setOpen} onClose={() => setOpen(null)}>
          {renderItem(items[open], true)}
          {items[open].kind === "photo" && (items[open] as { photo: Photo }).photo.caption && (
            <p className="mt-3 text-center font-serif italic text-ink/80">{(items[open] as { photo: Photo }).photo.caption}</p>
          )}
        </Lightbox>
      )}
    </>
  );
}

function Lightbox({
  index,
  count,
  onIndex,
  onClose,
  children,
}: {
  index: number;
  count: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const go = useCallback((d: number) => onIndex((index + d + count) % count), [index, count, onIndex]);

  useEffect(() => {
    gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.35 });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  useEffect(() => {
    gsap.fromTo(stage.current, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" });
  }, [index]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <div ref={stage} onClick={(e) => e.stopPropagation()} className="flex flex-col items-center">
        {children}
      </div>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-2xl text-white">
        ×
      </button>
      {count > 1 && (
        <>
          <button type="button" aria-label="Previous" onClick={(e) => (e.stopPropagation(), go(-1))} className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white sm:grid">
            ‹
          </button>
          <button type="button" aria-label="Next" onClick={(e) => (e.stopPropagation(), go(1))} className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white sm:grid">
            ›
          </button>
          <p className="absolute bottom-5 font-mono text-xs tracking-widest text-white/60">
            {index + 1} / {count}
          </p>
        </>
      )}
    </div>
  );
}
