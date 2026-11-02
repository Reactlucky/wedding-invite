/* Original flat illustrations for the Nikah v2 template.
 * --c-secondary = emerald (arches, doors, plaque), --c-accent = gold trim,
 * --c-base = cream page, --c-ink = text. */

import type { CSSProperties, ReactNode } from "react";

const SAND = "#efe2cb";
const SAND_DARK = "#dcc7a5";
const SAND_SHADE = "#cdb48d";

/** Marigold toran garland across the top edge (tiles horizontally). */
export function Garland({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} aria-hidden width="100%" height="100%" preserveAspectRatio="none">
      <defs>
        <pattern id="toran" width="120" height="90" patternUnits="userSpaceOnUse">
          <path d="M0 8 Q60 40 120 8" fill="none" stroke="#6b8f3a" strokeWidth="2" />
          {Array.from({ length: 9 }).map((_, i) => {
            const x = 6 + i * 13.5;
            const y = 8 + Math.sin((x / 120) * Math.PI) * 30;
            return <circle key={i} cx={x} cy={y} r="6" fill={i % 2 ? "#f6a21a" : "#f2c230"} stroke="#d97a0c" strokeWidth="1" />;
          })}
          {/* hanging strands */}
          {[0, 120].map((x) => (
            <g key={x}>
              {Array.from({ length: 5 }).map((_, k) => (
                <circle key={k} cx={x} cy={14 + k * 12} r="5.5" fill={k % 2 ? "#f6a21a" : "#e8512c"} stroke="#c2410c" strokeWidth=".8" />
              ))}
              <path d={`M${x} 74 l-5 10 h10z`} fill="#4f7a2b" />
            </g>
          ))}
          <path d="M44 34 q6 10 0 18 q-6-8 0-18z M76 34 q6 10 0 18 q-6-8 0-18z" fill="#5d8a32" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#toran)" />
    </svg>
  );
}

/** Flat brass lantern. `swingClass` lets the opening sway it from its chain. */
export function FlatLantern({ className = "", style, glow = true }: { className?: string; style?: CSSProperties; glow?: boolean }) {
  return (
    <svg viewBox="0 0 40 90" className={className} style={style} aria-hidden overflow="visible">
      {glow && <circle cx="20" cy="56" r="26" fill="#ffd98a" opacity=".35" />}
      <path d="M20 0 V18" stroke="var(--c-accent)" strokeWidth="1.5" />
      <path d="M12 30 Q12 20 20 17 Q28 20 28 30 Z" fill="var(--c-accent)" />
      <rect x="10" y="30" width="20" height="3" rx="1" fill="color-mix(in oklab, var(--c-accent) 70%, black)" />
      <path d="M11 33 H29 L31 54 L26 72 H14 L9 54 Z" fill="#ffe9b0" />
      <path d="M11 33 H29 L31 54 L26 72 H14 L9 54 Z M20 33 V72 M9 54 H31" fill="none" stroke="var(--c-accent)" strokeWidth="1.6" />
      <path d="M14 72 H26 L22 80 H18 Z" fill="var(--c-accent)" />
      <circle cx="20" cy="84" r="2" fill="var(--c-accent)" />
    </svg>
  );
}

/** One bay of the arcade: pillars, pointed arch, jaali screen and a hanging lantern. */
export function ArchBay({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 200 300" preserveAspectRatio="none" className={className} style={style} aria-hidden overflow="visible">
      <defs>
        <linearGradient id="bay-in" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="color-mix(in oklab, var(--c-secondary) 80%, black)" />
          <stop offset="1" stopColor="var(--c-secondary)" />
        </linearGradient>
        <pattern id="jaali" width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M6 0 L12 6 L6 12 L0 6 Z" fill="none" stroke={SAND_DARK} strokeWidth="1.6" />
        </pattern>
      </defs>
      <rect width="200" height="300" fill={SAND} />
      <path d="M32 300 V140 Q32 70 100 44 Q168 70 168 140 V300 Z" fill="url(#bay-in)" />
      <path d="M32 300 V140 Q32 70 100 44 Q168 70 168 140 V300" fill="none" stroke="var(--c-accent)" strokeWidth="3" />
      <path d="M22 300 V138 Q22 62 100 32 Q178 62 178 138 V300" fill="none" stroke={SAND_DARK} strokeWidth="4" />
      <rect x="32" y="232" width="136" height="68" fill="url(#jaali)" />
      <rect x="32" y="232" width="136" height="68" fill={SAND} opacity=".25" />
      <rect x="32" y="228" width="136" height="5" fill="var(--c-accent)" />
      <circle cx="100" cy="20" r="7" fill="none" stroke="var(--c-accent)" strokeWidth="2" />
      {/* pillars */}
      {[0, 186].map((x) => (
        <g key={x}>
          <rect x={x} y="40" width="14" height="260" fill={SAND_SHADE} />
          <rect x={x - 3} y="36" width="20" height="8" rx="2" fill="var(--c-accent)" />
        </g>
      ))}
    </svg>
  );
}

/** The grand gateway with dome; doors carry n2-door-l / n2-door-r classes. */
export function GrandGate({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 320 420" preserveAspectRatio="none" className={className} style={style} aria-hidden overflow="visible">
      <defs>
        <radialGradient id="gate-light" cx=".5" cy=".7" r=".7">
          <stop offset="0" stopColor="#fffdf3" />
          <stop offset=".5" stopColor="#ffeab0" />
          <stop offset="1" stopColor="#f2c46b" />
        </radialGradient>
        <clipPath id="gate-door-clip">
          <path d="M80 420 V230 Q80 150 160 118 Q240 150 240 230 V420 Z" />
        </clipPath>
      </defs>
      {/* dome + finial */}
      <path d="M96 128 Q96 46 160 30 Q224 46 224 128 Z" fill="color-mix(in oklab, var(--c-secondary) 88%, white)" />
      <path d="M160 30 V8" stroke="var(--c-accent)" strokeWidth="3" />
      <path d="M166 2 a8 8 0 1 0 0 14 a6.5 6.5 0 1 1 0 -14z" fill="var(--c-accent)" />
      <rect x="86" y="124" width="148" height="10" fill="var(--c-accent)" />
      {/* facade */}
      <rect x="20" y="132" width="280" height="288" fill={SAND} />
      <rect x="20" y="132" width="280" height="14" fill={SAND_DARK} />
      {Array.from({ length: 10 }).map((_, i) => (
        <path key={i} d={`M${30 + i * 28} 132 l7 -10 l7 10z`} fill={SAND_DARK} />
      ))}
      <path d="M62 420 V226 Q62 132 160 98 Q258 132 258 226 V420" fill="none" stroke={SAND_DARK} strokeWidth="6" />
      {/* light behind the doors */}
      <path className="n2-door-glow" d="M80 420 V230 Q80 150 160 118 Q240 150 240 230 V420 Z" fill="url(#gate-light)" opacity="0" />
      <g clipPath="url(#gate-door-clip)">
        <g className="n2-door-l">
          <rect x="80" y="110" width="80" height="310" fill="var(--c-secondary)" />
          <rect x="92" y="250" width="56" height="70" rx="3" fill="none" stroke="var(--c-accent)" strokeWidth="2" />
          <rect x="92" y="334" width="56" height="70" rx="3" fill="none" stroke="var(--c-accent)" strokeWidth="2" />
          <path d="M120 180 l14 14 -14 14 -14 -14z" fill="none" stroke="var(--c-accent)" strokeWidth="2" />
          <circle cx="150" cy="300" r="4" fill="var(--c-accent)" />
        </g>
        <g className="n2-door-r">
          <rect x="160" y="110" width="80" height="310" fill="var(--c-secondary)" />
          <rect x="172" y="250" width="56" height="70" rx="3" fill="none" stroke="var(--c-accent)" strokeWidth="2" />
          <rect x="172" y="334" width="56" height="70" rx="3" fill="none" stroke="var(--c-accent)" strokeWidth="2" />
          <path d="M200 180 l14 14 -14 14 -14 -14z" fill="none" stroke="var(--c-accent)" strokeWidth="2" />
          <circle cx="170" cy="300" r="4" fill="var(--c-accent)" />
          <rect x="159" y="110" width="2" height="310" fill="color-mix(in oklab, var(--c-accent) 70%, black)" />
        </g>
      </g>
      <path d="M80 420 V230 Q80 150 160 118 Q240 150 240 230 V420" fill="none" stroke="var(--c-accent)" strokeWidth="4" />
      {/* side niches */}
      {[34, 262].map((x) => (
        <path key={x} d={`M${x} 330 V280 Q${x} 258 ${x + 12} 250 Q${x + 24} 258 ${x + 24} 280 V330 Z`} fill="color-mix(in oklab, var(--c-secondary) 75%, black)" />
      ))}
    </svg>
  );
}

/** Courtyard: garland, banner text, arcade strip slot, tiled floor. */
export function CourtyardScene({ banner, arcade, overlay }: { banner: ReactNode; arcade?: ReactNode; overlay?: ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(to bottom, color-mix(in oklab, var(--c-base) 92%, #f7d9a8) 0%, var(--c-base) 40%, color-mix(in oklab, var(--c-base) 80%, #f3c98f) 78%)" }}>
      <div className="absolute left-1/2 top-[30%] h-[60vmax] w-[60vmax] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,232,180,.7), transparent 60%)" }} />
      <Garland className="absolute inset-x-0 top-0 h-[90px]" />
      {[
        { left: "9%", chain: "22dvh", w: "clamp(26px,7vw,46px)", cls: "" },
        { left: "24%", chain: "10dvh", w: "clamp(20px,5vw,34px)", cls: "hidden sm:block" },
        { left: "76%", chain: "13dvh", w: "clamp(20px,5vw,34px)", cls: "hidden sm:block" },
        { left: "91%", chain: "27dvh", w: "clamp(26px,7vw,46px)", cls: "" },
      ].map((l, i) => (
        <div key={i} className={`cy-lantern absolute top-[40px] ${l.cls}`} style={{ left: l.left, width: l.w, transformOrigin: "50% 0%" }}>
          <div className="mx-auto w-px" style={{ height: l.chain, background: "var(--c-accent)" }} />
          <FlatLantern className="-mt-[18%] w-full" />
        </div>
      ))}
      <div className="absolute inset-x-0 top-[15%] px-[16%] text-center sm:px-5">{banner}</div>
      {arcade}
      {/* floor with geometric tiles */}
      <div className="absolute inset-x-0 bottom-0 h-[18%]" style={{ background: "linear-gradient(to bottom, #d8c3a1, #cbb38c)" }}>
        <div className="h-[6px]" style={{ background: "var(--c-accent)" }} />
        <div
          className="absolute inset-0 top-[6px] opacity-60"
          style={{
            background:
              "conic-gradient(from 45deg at 50% 50%, #e9dcc3 0 25%, transparent 0 50%, #e9dcc3 0 75%, transparent 0) 0 0/38px 38px",
          }}
        />
      </div>
      {overlay}
    </div>
  );
}

/** Emerald plaque with gold border, hung from two cords. */
export function Plaque({ top, main, arabic, className = "" }: { top: string; main: ReactNode; arabic?: string; className?: string }) {
  return (
    <div className={`relative mx-auto w-max max-w-[92vw] ${className}`}>
      {/* cords meeting at a hook */}
      <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="mx-auto block h-[clamp(20px,3.6vh,34px)] w-[64%]" aria-hidden>
        <path d="M6 24 L50 3 L94 24" fill="none" stroke="color-mix(in oklab, var(--c-accent) 70%, black)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2" style={{ borderColor: "var(--c-accent)" }} />
      <div
        className="relative rounded-t-[999px] rounded-b-xl border-[3px] px-[clamp(22px,8vw,48px)] pb-4 pt-6 text-center shadow-[0_18px_36px_-14px_rgba(0,0,0,.5)]"
        style={{ background: "linear-gradient(180deg, color-mix(in oklab, var(--c-secondary) 85%, white), var(--c-secondary))", borderColor: "var(--c-accent)" }}
      >
        <div className="pointer-events-none absolute inset-1.5 rounded-t-[999px] rounded-b-lg border" style={{ borderColor: "color-mix(in oklab, var(--c-accent) 60%, transparent)" }} />
        {arabic && (
          <p className="font-arabic text-[clamp(20px,6vw,30px)] leading-none" style={{ color: "var(--c-accent-light)" }} dir="rtl" lang="ar">
            {arabic}
          </p>
        )}
        <p className="font-v2-sans mt-2 text-[clamp(9px,2.6vw,12px)] font-medium tracking-[0.32em] uppercase" style={{ color: "color-mix(in oklab, var(--c-accent-light) 85%, white)" }}>
          {top}
        </p>
        <p className="font-v2-serif mt-1 text-[clamp(24px,7.4vw,42px)] leading-tight" style={{ color: "#fff8e7" }}>
          {main}
        </p>
      </div>
    </div>
  );
}

/** Domes & minarets skyline for the hero bottom. */
export function Skyline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1000 260" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden>
      <g fill="#e2c49c" opacity=".7">
        <path d="M0 260 V190 H90 V150 Q130 100 170 150 V190 H260 V260Z" />
        <rect x="300" y="120" width="16" height="140" />
        <path d="M296 120 Q308 92 320 120Z" />
        <path d="M680 260 V180 Q740 110 800 180 V260Z" />
        <rect x="860" y="110" width="16" height="150" />
        <path d="M856 110 Q868 80 880 110Z" />
      </g>
      <g fill="#d3ad7f">
        <path d="M340 260 V170 H400 V140 Q500 30 600 140 V170 H660 V260Z" />
        <path d="M500 40 V18" stroke="#c99a3d" strokeWidth="4" />
        <path d="M505 6 a8 8 0 1 0 0 14 a6.5 6.5 0 1 1 0 -14z" fill="var(--c-accent)" />
        <rect x="360" y="90" width="18" height="170" />
        <path d="M355 90 Q369 56 383 90Z" />
        <rect x="622" y="90" width="18" height="170" />
        <path d="M617 90 Q631 56 645 90Z" />
        {[420, 470, 530, 580].map((x) => (
          <path key={x} d={`M${x} 260 V215 Q${x + 15} 196 ${x + 30} 215 V260Z`} fill="#c09468" />
        ))}
      </g>
      <rect y="250" width="1000" height="10" fill="var(--c-accent)" opacity=".5" />
    </svg>
  );
}
