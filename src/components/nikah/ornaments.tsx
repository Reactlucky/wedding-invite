/* Original Islamic-inspired ornament set for the Nikah template.
 * All colours come from CSS variables so every palette re-skins the art. */

import type { CSSProperties } from "react";

/** 8-point star girih tile, used as an SVG <pattern>. */
export function GirihPattern({ id, size = 80, stroke = "var(--c-accent)", width = 1, opacity = 1 }: { id: string; size?: number; stroke?: string; width?: number; opacity?: number }) {
  const s = size;
  const h = s / 2;
  const q = s * 0.225;
  return (
    <pattern id={id} width={s} height={s} patternUnits="userSpaceOnUse">
      <g fill="none" stroke={stroke} strokeWidth={width} opacity={opacity}>
        <rect x={h - q} y={h - q} width={q * 2} height={q * 2} />
        <rect x={h - q} y={h - q} width={q * 2} height={q * 2} transform={`rotate(45 ${h} ${h})`} />
        <circle cx={h} cy={h} r={q * 0.45} />
        <path d={`M0 ${h}H${h - q * 1.41} M${h + q * 1.41} ${h}H${s} M${h} 0V${h - q * 1.41} M${h} ${h + q * 1.41}V${s}`} />
        <path d={`M0 0L${h - q} ${h - q} M${s} 0L${h + q} ${h - q} M0 ${s}L${h - q} ${h + q} M${s} ${s}L${h + q} ${h + q}`} />
        <rect x={-q * 0.7} y={-q * 0.7} width={q * 1.4} height={q * 1.4} transform="rotate(45 0 0)" />
        <rect x={s - q * 0.7} y={-q * 0.7} width={q * 1.4} height={q * 1.4} transform={`rotate(45 ${s} 0)`} />
        <rect x={-q * 0.7} y={s - q * 0.7} width={q * 1.4} height={q * 1.4} transform={`rotate(45 0 ${s})`} />
        <rect x={s - q * 0.7} y={s - q * 0.7} width={q * 1.4} height={q * 1.4} transform={`rotate(45 ${s} ${s})`} />
      </g>
    </pattern>
  );
}

/** Full-bleed tiled pattern background as a positioned SVG. */
export function PatternBackdrop({ id, className, style, size = 80, opacity = 0.18 }: { id: string; className?: string; style?: CSSProperties; size?: number; opacity?: number }) {
  return (
    <svg className={className} style={style} aria-hidden width="100%" height="100%">
      <defs>
        <GirihPattern id={id} size={size} opacity={opacity} />
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export function Crescent({ className, style, glow = true }: { className?: string; style?: CSSProperties; glow?: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className={className} style={style} aria-hidden>
      <defs>
        <radialGradient id="cres-glow" cx=".45" cy=".5" r=".5">
          <stop offset="0" stopColor="var(--c-accent-light)" stopOpacity=".55" />
          <stop offset="1" stopColor="var(--c-accent-light)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cres-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff8e1" />
          <stop offset=".5" stopColor="var(--c-accent-light)" />
          <stop offset="1" stopColor="var(--c-accent)" />
        </linearGradient>
      </defs>
      {glow && <circle cx="56" cy="60" r="58" fill="url(#cres-glow)" />}
      <path d="M70 18a46 46 0 1 0 0 84a42 42 0 1 1 0-84z" fill="url(#cres-fill)" />
      <path d="M92 44l3.2 7.4 8 .7-6.1 5.3 1.9 7.9-7-4.2-7 4.2 1.9-7.9-6.1-5.3 8-.7z" fill="var(--c-accent-light)" />
    </svg>
  );
}

/** Eight-point star rosette, used for dividers and medallions. */
export function StarRosette({ className, style, filled = false }: { className?: string; style?: CSSProperties; filled?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <g fill={filled ? "var(--c-accent)" : "none"} stroke="var(--c-accent)" strokeWidth="2">
        <rect x="22" y="22" width="56" height="56" />
        <rect x="22" y="22" width="56" height="56" transform="rotate(45 50 50)" />
      </g>
      <circle cx="50" cy="50" r="14" fill="none" stroke="var(--c-accent-light)" strokeWidth="2" />
      <circle cx="50" cy="50" r="5" fill="var(--c-accent-light)" />
    </svg>
  );
}

export function Divider({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className ?? ""}`} aria-hidden>
      <span className="hairline w-16 sm:w-28" />
      <StarRosette className="h-6 w-6" />
      <span className="hairline w-16 sm:w-28" />
    </div>
  );
}

/** Moroccan-style pierced brass lantern. `glowClass` is animated (flicker) by the opening. */
export function Lantern({ className, style, glowClass = "" }: { className?: string; style?: CSSProperties; glowClass?: string }) {
  return (
    <svg viewBox="0 0 80 200" className={className} style={style} aria-hidden overflow="visible">
      <defs>
        <radialGradient id="lan-glow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff3c4" stopOpacity=".95" />
          <stop offset=".35" stopColor="var(--c-accent-light)" stopOpacity=".55" />
          <stop offset="1" stopColor="var(--c-accent)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lan-metal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="color-mix(in oklab, var(--c-accent) 55%, black)" />
          <stop offset=".45" stopColor="var(--c-accent-light)" />
          <stop offset="1" stopColor="color-mix(in oklab, var(--c-accent) 50%, black)" />
        </linearGradient>
        <pattern id="lan-pierce" width="8" height="10" patternUnits="userSpaceOnUse">
          <path d="M4 1 L7 5 L4 9 L1 5 Z" fill="#fff4cf" />
        </pattern>
      </defs>
      <circle className={glowClass} cx="40" cy="128" r="70" fill="url(#lan-glow)" />
      <circle cx="40" cy="6" r="5" fill="none" stroke="url(#lan-metal)" strokeWidth="2.5" />
      <path d="M40 11 V40" stroke="url(#lan-metal)" strokeWidth="1.5" />
      <path d="M22 70 C22 52 32 44 40 38 C48 44 58 52 58 70 Z" fill="url(#lan-metal)" />
      <path d="M38 38 h4 l-2 -8z" fill="var(--c-accent-light)" />
      <rect x="18" y="70" width="44" height="6" rx="2" fill="url(#lan-metal)" />
      <path d="M20 76 L60 76 L64 120 L56 160 L24 160 L16 120 Z" fill="#3a2508" />
      <path d="M20 76 L60 76 L64 120 L56 160 L24 160 L16 120 Z" fill="url(#lan-pierce)" opacity=".95" />
      <path className={glowClass} d="M20 76 L60 76 L64 120 L56 160 L24 160 L16 120 Z" fill="#fff1b8" opacity=".35" />
      <path d="M20 76 L60 76 L64 120 L56 160 L24 160 L16 120 Z" fill="none" stroke="url(#lan-metal)" strokeWidth="2" />
      <path d="M40 76 V160 M16 120 H64" stroke="url(#lan-metal)" strokeWidth="1.5" />
      <path d="M24 160 L56 160 L48 172 L32 172 Z" fill="url(#lan-metal)" />
      <path d="M36 172 L44 172 L40 192 Z" fill="url(#lan-metal)" />
      <circle cx="40" cy="194" r="2.5" fill="var(--c-accent-light)" />
    </svg>
  );
}

/* ----------------------------------------------------------------- mehrab */

export const MEHRAB = {
  w: 600,
  h: 900,
  outerArch: "M80 900 L80 450 C80 300 200 215 300 170 C400 215 520 300 520 450 L520 900",
  innerArch: "M130 900 L130 470 C130 340 230 270 300 230 C370 270 470 340 470 470 L470 900",
  /** doorway box inside the SVG, used to place the HTML doors */
  door: { x: 130, y: 230, w: 340, h: 670 },
};

/** Clip path for the doorway in objectBoundingBox units (matches MEHRAB.innerArch). */
export const DOOR_CLIP = "M0 1 L0 .358 C0 .164 .294 .06 .5 0 C.706 .06 1 .164 1 .358 L1 1 Z";

/**
 * Gateway architecture. Elements carry classes the opening animates:
 *  .m-outline  stroke draws (pathLength=1)
 *  .m-fill     solid fills fade in
 *  .m-pattern  girih panels fade in
 *  .m-beads    bead moulding
 *  .m-callig   calligraphy band
 */
export function Mehrab({ uid }: { uid: string }) {
  const p = `${uid}-`;
  const { outerArch, innerArch } = MEHRAB;
  const merlons = Array.from({ length: 13 }, (_, i) => 30 + i * 41.5);
  return (
    <svg viewBox="0 0 600 900" className="h-full w-full overflow-visible" aria-hidden>
      <defs>
        <GirihPattern id={`${p}girih`} size={46} width={1.2} />
        <GirihPattern id={`${p}girih-fine`} size={28} width={0.8} opacity={0.7} />
        <linearGradient id={`${p}wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--c-secondary)" />
          <stop offset="1" stopColor="var(--c-deep)" />
        </linearGradient>
        <linearGradient id={`${p}gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--c-accent-light)" />
          <stop offset=".5" stopColor="var(--c-accent)" />
          <stop offset="1" stopColor="color-mix(in oklab, var(--c-accent) 60%, black)" />
        </linearGradient>
        <clipPath id={`${p}band`}>
          <path d={`${outerArch} Z`} />
        </clipPath>
        <mask id={`${p}band-mask`}>
          <path d={`${outerArch} Z`} fill="white" />
          <path d={`${innerArch} Z`} fill="black" />
        </mask>
        <mask id={`${p}spandrel-mask`}>
          <rect x="30" y="150" width="540" height="750" fill="white" />
          <path d={`${outerArch} Z`} fill="black" />
        </mask>
      </defs>

      {/* crenellated cresting */}
      <g className="m-fill" opacity="0">
        {merlons.map((x) => (
          <path key={x} d={`M${x} 112 v-14 l10 -14 l10 14 v14z`} fill={`url(#${p}gold)`} opacity=".9" />
        ))}
      </g>

      {/* frame wall */}
      <rect className="m-fill" opacity="0" x="30" y="110" width="540" height="790" fill={`url(#${p}wall)`} />
      <rect className="m-pattern" opacity="0" x="30" y="150" width="540" height="750" fill={`url(#${p}girih-fine)`} mask={`url(#${p}spandrel-mask)`} />

      {/* calligraphy band */}
      <rect className="m-fill" opacity="0" x="30" y="112" width="540" height="40" fill="var(--c-deep)" />
      <text
        className="m-callig"
        x="300"
        y="142"
        textAnchor="middle"
        fontSize="26"
        fill={`url(#${p}gold)`}
        style={{ fontFamily: "var(--font-amiri)" }}
        direction="rtl"
      >
        بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
      </text>

      {/* arch band with girih */}
      <rect className="m-fill" opacity="0" x="60" y="150" width="480" height="750" fill="var(--c-deep)" mask={`url(#${p}band-mask)`} />
      <rect className="m-pattern" opacity="0" x="60" y="150" width="480" height="750" fill={`url(#${p}girih)`} mask={`url(#${p}band-mask)`} />

      {/* rosettes in the spandrels */}
      {[118, 482].map((cx) => (
        <g key={cx} className="m-fill" opacity="0" transform={`translate(${cx} 215)`}>
          <circle r="30" fill="var(--c-deep)" stroke={`url(#${p}gold)`} strokeWidth="2" />
          <rect x="-17" y="-17" width="34" height="34" fill="none" stroke="var(--c-accent)" strokeWidth="1.5" />
          <rect x="-17" y="-17" width="34" height="34" fill="none" stroke="var(--c-accent)" strokeWidth="1.5" transform="rotate(45)" />
          <circle r="6" fill="var(--c-accent-light)" />
        </g>
      ))}

      {/* drawn outlines */}
      <g fill="none" stroke={`url(#${p}gold)`} strokeLinecap="round">
        <rect className="m-outline" pathLength={1} x="30" y="110" width="540" height="790" strokeWidth="3" strokeDasharray="1" strokeDashoffset="1" />
        <rect className="m-outline" pathLength={1} x="42" y="156" width="516" height="744" strokeWidth="1.2" strokeDasharray="1" strokeDashoffset="1" />
        <path className="m-outline" pathLength={1} d={outerArch} strokeWidth="4" strokeDasharray="1" strokeDashoffset="1" />
        <path className="m-outline" pathLength={1} d={innerArch} strokeWidth="3" strokeDasharray="1" strokeDashoffset="1" />
        <path className="m-outline" pathLength={1} d="M30 152 H570" strokeWidth="1.5" strokeDasharray="1" strokeDashoffset="1" />
      </g>

      {/* bead moulding just inside the doorway */}
      <path
        className="m-beads"
        opacity="0"
        d="M140 900 L140 470 C140 345 236 278 300 241 C364 278 460 345 460 470 L460 900"
        fill="none"
        stroke="var(--c-accent-light)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="0 13"
      />

      {/* columns */}
      {[80, 520].map((x) => (
        <g key={x} className="m-fill" opacity="0">
          <rect x={x - 9} y="455" width="18" height="430" fill={`url(#${p}gold)`} />
          <path d={`M${x - 9} 470 L${x + 9} 500 M${x - 9} 530 L${x + 9} 560 M${x - 9} 590 L${x + 9} 620 M${x - 9} 650 L${x + 9} 680 M${x - 9} 710 L${x + 9} 740 M${x - 9} 770 L${x + 9} 800 M${x - 9} 830 L${x + 9} 860`} stroke="var(--c-deep)" strokeWidth="2" opacity=".5" />
          <rect x={x - 16} y="440" width="32" height="16" rx="3" fill={`url(#${p}gold)`} />
          <rect x={x - 16} y="878" width="32" height="14" rx="3" fill={`url(#${p}gold)`} />
        </g>
      ))}

      {/* finial with crescent above the apex */}
      <g className="m-fill" opacity="0">
        <path d="M300 84 v-30" stroke={`url(#${p}gold)`} strokeWidth="3" />
        <circle cx="300" cy="62" r="6" fill={`url(#${p}gold)`} />
        <path d="M304 18a16 16 0 1 0 0 30a12.5 12.5 0 1 1 0-30z" fill="var(--c-accent-light)" />
      </g>

      {/* plinth */}
      <rect className="m-fill" opacity="0" x="20" y="890" width="560" height="10" fill={`url(#${p}gold)`} />
    </svg>
  );
}

/** One carved door leaf (the pair is mirrored with CSS). */
export function DoorLeaf({ uid, side }: { uid: string; side: "left" | "right" }) {
  const p = `${uid}-${side}-`;
  const studs: [number, number][] = [];
  for (let y = 330; y <= 630; y += 30) for (const x of [18, 152]) studs.push([x, y]);
  return (
    <svg viewBox="0 0 170 670" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`${p}wood`} x1={side === "left" ? "0" : "1"} y1="0" x2={side === "left" ? "1" : "0"} y2="0">
          <stop offset="0" stopColor="var(--c-deep)" />
          <stop offset=".6" stopColor="var(--c-secondary)" />
          <stop offset="1" stopColor="color-mix(in oklab, var(--c-secondary) 70%, black)" />
        </linearGradient>
        <linearGradient id={`${p}gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--c-accent-light)" />
          <stop offset=".55" stopColor="var(--c-accent)" />
          <stop offset="1" stopColor="color-mix(in oklab, var(--c-accent) 55%, black)" />
        </linearGradient>
        <GirihPattern id={`${p}lattice`} size={34} width={1.4} stroke={`url(#${p}gold)`} />
      </defs>
      <rect width="170" height="670" fill={`url(#${p}wood)`} />
      <rect x="8" y="8" width="154" height="654" fill="none" stroke={`url(#${p}gold)`} strokeWidth="3" />
      {/* top medallion panel */}
      <rect x="22" y="130" width="126" height="170" fill="var(--c-deep)" stroke={`url(#${p}gold)`} strokeWidth="2" />
      <g transform="translate(85 215)">
        <rect x="-42" y="-42" width="84" height="84" fill="none" stroke={`url(#${p}gold)`} strokeWidth="2.5" />
        <rect x="-42" y="-42" width="84" height="84" fill="none" stroke={`url(#${p}gold)`} strokeWidth="2.5" transform="rotate(45)" />
        <circle r="24" fill="none" stroke="var(--c-accent-light)" strokeWidth="1.5" />
        <circle r="9" fill={`url(#${p}gold)`} />
      </g>
      {/* lattice panel */}
      <rect x="22" y="318" width="126" height="230" fill="var(--c-deep)" />
      <rect x="22" y="318" width="126" height="230" fill={`url(#${p}lattice)`} />
      <rect x="22" y="318" width="126" height="230" fill="none" stroke={`url(#${p}gold)`} strokeWidth="2" />
      {/* lower panel */}
      <rect x="22" y="566" width="126" height="84" fill="var(--c-deep)" stroke={`url(#${p}gold)`} strokeWidth="2" />
      <path d="M40 608 h90 M85 580 v56" stroke={`url(#${p}gold)`} strokeWidth="1.5" />
      {/* studs */}
      {studs.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3.2" fill={`url(#${p}gold)`} />
      ))}
      {/* ring knocker near the meeting edge */}
      <g transform={`translate(${side === "left" ? 150 : 20} 430)`}>
        <circle r="7" fill={`url(#${p}gold)`} />
        <circle cy="18" r="15" fill="none" stroke={`url(#${p}gold)`} strokeWidth="4" />
      </g>
      {/* meeting stile */}
      <rect x={side === "left" ? 164 : 0} y="0" width="6" height="670" fill={`url(#${p}gold)`} />
    </svg>
  );
}
