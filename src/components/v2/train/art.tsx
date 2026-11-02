/* Original flat illustrations for the Train v2 template. Colours come from the
 * palette CSS variables: --c-secondary = coach livery, --c-accent = sign yellow,
 * --c-accent-light = LED amber, --c-deep = dark boards, --c-base = page. */

import type { CSSProperties, ReactNode } from "react";
import { Led } from "../shared/primitives";

const WINDOW = "#26313c";
const ROOF = "#9b9a97";
const UNDER = "#3a3836";
/** Wheel size in the 400×120 car artwork (the opening uses this to roll them at the right speed). */
export const WHEEL_R = 12.5;
const WHEEL_CY = 107;

const wheelStyle: CSSProperties = { transform: "rotate(var(--wheel, 0deg))", transformBox: "fill-box", transformOrigin: "center" };

function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g style={wheelStyle}>
      <circle cx={cx} cy={cy} r={r} fill="#2b2a29" />
      <circle cx={cx} cy={cy} r={r * 0.72} fill="none" stroke="#6d6a66" strokeWidth="1.4" />
      <path d={`M${cx - r * 0.7} ${cy}H${cx + r * 0.7}M${cx} ${cy - r * 0.7}V${cy + r * 0.7}`} stroke="#8a8681" strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r={r * 0.22} fill="#b9b4ad" />
    </g>
  );
}

function Bogie({ x, wheels }: { x: number; wheels: number }) {
  const gap = 27;
  const xs = Array.from({ length: wheels }, (_, i) => x + (i - (wheels - 1) / 2) * gap);
  return (
    <g>
      <rect x={xs[0] - 16} y="95" width={xs[xs.length - 1] - xs[0] + 32} height="8" rx="2" fill={UNDER} />
      {xs.map((wx) => (
        <Wheel key={wx} cx={wx} cy={WHEEL_CY} r={WHEEL_R} />
      ))}
    </g>
  );
}

/** Electric locomotive, nose facing left (direction of travel). */
export function Locomotive({ label, number = "1402", className, style }: { label: string; number?: string; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 400 120" className={className} style={style} aria-hidden overflow="visible">
      {/* pantograph */}
      <path d="M232 15 L256 3 L280 15 M244 3 H292" stroke="#5c5a57" strokeWidth="2" fill="none" />
      <rect x="226" y="13" width="60" height="3" fill="#5c5a57" />
      <rect x="26" y="14" width="370" height="7" rx="3" fill={ROOF} />
      {/* body */}
      <path d="M4 94 V48 Q6 26 30 21 H398 V94 Z" fill="#f2ecdf" stroke="#d7cdb9" strokeWidth="1" />
      {/* windscreen + cab windows */}
      <path d="M12 50 Q15 33 31 30 H58 V54 H12 Z" fill={WINDOW} />
      <path d="M20 34 L30 52" stroke="#fff" strokeOpacity=".25" strokeWidth="3" />
      <rect x="68" y="30" width="24" height="22" rx="3" fill={WINDOW} />
      <rect x="102" y="28" width="22" height="62" rx="2" fill="none" stroke="#c9bfab" strokeWidth="1.5" />
      <rect x="108" y="34" width="10" height="14" rx="1.5" fill={WINDOW} />
      {/* livery stripes */}
      <rect x="4" y="60" width="394" height="7" fill="var(--c-secondary)" />
      <rect x="4" y="67" width="394" height="4" fill="#e98b2a" />
      {/* vents */}
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={318 + i * 9} y="28" width="5" height="22" rx="1" fill="#d8cfbd" />
      ))}
      <text x="220" y="50" textAnchor="middle" fontSize="12.5" fontWeight="700" letterSpacing="1.2" fill="#3a2a22" style={{ fontFamily: "var(--font-outfit)" }}>
        {label}
      </text>
      <rect x="20" y="76" width="26" height="9" rx="1.5" fill="#fff" stroke="#c9bfab" />
      <text x="33" y="83" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#3a2a22" style={{ fontFamily: "var(--font-outfit)" }}>
        {number}
      </text>
      {/* headlight */}
      <circle cx="9" cy="78" r="9" fill="#fff4c2" opacity=".35" />
      <circle cx="9" cy="78" r="4" fill="#fffbe6" />
      <rect x="0" y="86" width="10" height="6" fill={UNDER} />
      <rect x="4" y="94" width="394" height="6" fill={UNDER} />
      <Bogie x={78} wheels={3} />
      <Bogie x={322} wheels={3} />
    </svg>
  );
}

/** Passenger coach. `door` adds the openable glowing door on the left end. */
export function Coach({
  number,
  board,
  door = false,
  className,
  style,
  uid = "c",
}: {
  number: string;
  board: string;
  door?: boolean;
  className?: string;
  style?: CSSProperties;
  uid?: string;
}) {
  const dark = "color-mix(in oklab, var(--c-secondary) 78%, black)";
  return (
    <svg viewBox="0 0 400 120" className={className} style={style} aria-hidden overflow="visible">
      <defs>
        <radialGradient id={`${uid}-glow`} cx=".5" cy=".55" r=".6">
          <stop offset="0" stopColor="#fffdf2" />
          <stop offset=".5" stopColor="#ffe7a6" />
          <stop offset="1" stopColor="var(--c-accent-light)" />
        </radialGradient>
        <clipPath id={`${uid}-doorclip`}>
          <rect x="10" y="26" width="26" height="64" />
        </clipPath>
      </defs>
      {/* gangway connector to the next car */}
      <rect x="-6" y="34" width="10" height="52" fill="#4a4846" />
      <path d="M4 22 Q6 11 20 10 H380 Q394 11 396 22 Z" fill={ROOF} />
      <rect x="20" y="12" width="360" height="2" fill="#fff" opacity=".35" />
      <rect x="2" y="21" width="396" height="73" rx="4" fill="var(--c-secondary)" />
      <rect x="2" y="78" width="396" height="2" fill="#fff" opacity=".35" />
      {/* doors */}
      {[10, 364].map((x) => (
        <g key={x}>
          {x === 10 && door && <rect className="v2-door-glow" x="10" y="26" width="26" height="64" fill={`url(#${uid}-glow)`} opacity="0" />}
          <g clipPath={x === 10 && door ? `url(#${uid}-doorclip)` : undefined}>
            <g className={x === 10 && door ? "v2-door-leaf" : undefined}>
              <rect x={x} y="26" width="26" height="64" rx="1.5" fill={dark} />
              <rect x={x + 5} y="32" width="16" height="20" rx="2" fill={WINDOW} />
              <rect x={x + 19} y="60" width="2" height="12" rx="1" fill="#e9e2d2" />
            </g>
          </g>
          <rect x={x} y="26" width="26" height="64" rx="1.5" fill="none" stroke={dark} strokeWidth="1.5" />
        </g>
      ))}
      {/* windows with bars */}
      {[50, 112, 174, 236, 298].map((x) => (
        <g key={x}>
          <rect x={x} y="34" width="52" height="30" rx="7" fill={WINDOW} stroke="#e9e2d2" strokeWidth="2" />
          {[41, 47, 53, 59].map((y) => (
            <line key={y} x1={x + 4} x2={x + 48} y1={y} y2={y} stroke="#cfd5da" strokeWidth="1.3" opacity=".75" />
          ))}
          <path d={`M${x + 8} 36 L${x + 20} 62`} stroke="#fff" strokeOpacity=".12" strokeWidth="5" />
        </g>
      ))}
      {/* number + destination board */}
      <rect x="340" y="23" width="20" height="9" rx="1.5" fill="#fff" />
      <text x="350" y="30" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#2b2a29" style={{ fontFamily: "var(--font-outfit)" }}>
        {number}
      </text>
      <rect x="226" y="23" width="106" height="9" rx="1.5" fill="var(--c-accent)" />
      <text x="279" y="30" textAnchor="middle" fontSize="5.6" fontWeight="700" letterSpacing=".6" fill="#3a2a22" style={{ fontFamily: "var(--font-outfit)" }}>
        {board}
      </text>
      <circle cx="200" cy="86" r="4" fill="#fff" />
      <circle cx="200" cy="86" r="2" fill="var(--c-secondary)" />
      <rect x="2" y="94" width="396" height="6" fill={UNDER} />
      <Bogie x={70} wheels={2} />
      <Bogie x={330} wheels={2} />
    </svg>
  );
}

/* ------------------------------------------------------------- station */

export function StationLedBoard({ trainNo, name, marquee, manual = false }: { trainNo: string; name: string; marquee: string; manual?: boolean }) {
  return (
    <div className="relative mx-auto w-[min(92vw,520px)]">
      <div className="absolute -top-[6vh] left-[18%] h-[6vh] w-[3px] bg-[#3b2a24]" />
      <div className="absolute -top-[6vh] right-[18%] h-[6vh] w-[3px] bg-[#3b2a24]" />
      <div className="led-panel overflow-hidden rounded-lg border-[3px] border-[#2a201c] px-3 py-2 shadow-[0_10px_25px_-10px_rgba(0,0,0,.6)]">
        <div className="flex justify-between text-[clamp(11px,3.3vw,16px)]">
          <Led text={trainNo} />
          <Led text={name} />
          <Led text="PF 1" />
        </div>
        <div className="mt-1 text-[clamp(10px,2.9vw,14px)]">
          {manual ? (
            <span className="relative block overflow-hidden whitespace-nowrap">
              <span className="v2-marquee led inline-block">
                <span className="pr-8">{marquee}</span>
                <span className="pr-8">{marquee}</span>
              </span>
            </span>
          ) : (
            <Led text={marquee} marquee />
          )}
        </div>
      </div>
    </div>
  );
}

/** The platform scene minus the train. `trainSlot` renders between pillars and the platform edge. */
export function StationScene({
  city,
  board,
  announcement,
  trainSlot,
  overlay,
}: {
  city: string;
  board: ReactNode;
  announcement: ReactNode;
  trainSlot?: ReactNode;
  overlay?: ReactNode;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(to bottom, #f7efe2 0%, #f6e2c8 55%, #f3d6b4 68%)" }}>
      {/* warm light on the back wall */}
      <div className="st-sunglow absolute left-[70%] top-[52%] h-[40vmax] w-[40vmax] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,226,170,.85), transparent 65%)" }} />
      {/* roof */}
      <div className="absolute inset-x-0 top-0 h-[7%]" style={{ background: "repeating-linear-gradient(90deg, #3b2620 0 14px, #33201b 14px 16px)" }} />
      <div className="absolute inset-x-0 top-[7%] h-[6px] bg-[#2a1914]" />

      <div className="absolute inset-x-0 top-[13%] flex flex-col items-center px-4">
        {board}
        <div className="mt-[4.5vh] text-center">{announcement}</div>
      </div>

      {/* canopy beam, pillars, city nameboard */}
      <div className="absolute inset-x-0 top-[37.5%] h-[2.4%] bg-[#3b2620]" />
      {[6, 34, 66, 94].map((x) => (
        <div key={x} className="absolute top-[37.5%] h-[31.5%] w-[1.6%] min-w-[6px] -translate-x-1/2 bg-[#4a3029]" style={{ left: `${x}%` }} />
      ))}
      <div className="absolute left-1/2 top-[39.9%] -translate-x-1/2">
        <div className="mx-auto flex w-max justify-between gap-[clamp(60px,18vw,120px)]">
          <span className="h-[1.4vh] w-[3px] bg-[#3b2a24]" />
          <span className="h-[1.4vh] w-[3px] bg-[#3b2a24]" />
        </div>
        <div
          className="rounded-md border-2 border-[#3a2a22] px-[clamp(14px,5vw,28px)] py-1 text-center shadow-[0_6px_14px_-6px_rgba(0,0,0,.5)]"
          style={{ background: "var(--c-accent)" }}
        >
          <p className="font-v2-sans text-[clamp(8px,2.2vw,11px)] font-semibold tracking-[0.25em] text-[#3a2a22] uppercase">Welcome to</p>
          <p className="font-v2-sans whitespace-nowrap text-[clamp(15px,4.6vw,24px)] font-bold tracking-[0.08em] text-[#2b1f1a] uppercase">{city} Jn.</p>
        </div>
      </div>

      {trainSlot}

      {/* platform */}
      <div className="absolute inset-x-0 bottom-0 h-[32%]">
        <div className="h-[12%] bg-gradient-to-b from-[#8c9096] to-[#6c7076]" />
        <div className="h-[5%]" style={{ background: "radial-gradient(circle, #b8930c 1.2px, transparent 1.6px) 0 0/7px 7px, var(--c-accent)" }} />
        <div className="h-[83%] bg-gradient-to-b from-[#dcd9d3] to-[#bcb8b1]" />
      </div>
      {overlay}
    </div>
  );
}

/* ----------------------------------------------------------------- hero */

export function YellowSign({ top, main, className = "" }: { top: string; main: ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto w-max max-w-[92vw] ${className}`}>
      <div
        className="relative z-10 rounded-md border-[3px] border-[#3a2a22] px-[clamp(16px,6vw,40px)] py-2 text-center shadow-[0_14px_30px_-12px_rgba(0,0,0,.55)]"
        style={{ background: "linear-gradient(180deg, color-mix(in oklab, var(--c-accent) 85%, white), var(--c-accent))" }}
      >
        <p className="font-v2-sans text-[clamp(10px,2.8vw,13px)] font-semibold tracking-[0.3em] text-[#3a2a22] uppercase">{top}</p>
        <p className="font-v2-sans text-[clamp(20px,6.4vw,38px)] leading-tight font-bold tracking-[0.04em] text-[#2b1f1a] uppercase">{main}</p>
      </div>
      <div className="mx-[14%] flex justify-between">
        <span className="h-[clamp(28px,6vh,56px)] w-[6px] bg-[#3a2a22]" />
        <span className="h-[clamp(28px,6vh,56px)] w-[6px] bg-[#3a2a22]" />
      </div>
    </div>
  );
}

/** Background for the hero: sunset haze, hills, overhead wires, track. */
export function HeroLandscape({ children }: { children?: ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(to bottom, var(--c-base) 0%, color-mix(in oklab, var(--c-base) 75%, #f2c79a) 60%, color-mix(in oklab, var(--c-base) 55%, #e9b383) 78%)" }}>
      <div className="absolute left-1/2 top-[66%] h-[30vmin] w-[30vmin] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,236,200,.9), rgba(255,210,150,.4) 50%, transparent 70%)" }} />
      <svg viewBox="0 0 1000 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-[13%] h-[32%] w-full" aria-hidden>
        <path d="M0 230 Q120 150 240 200 T480 180 T740 190 T1000 170 V300 H0Z" fill="#d9b393" opacity=".55" />
        <path d="M0 255 Q160 205 330 240 T660 225 T1000 235 V300 H0Z" fill="#c99a78" opacity=".6" />
        {/* overhead wires */}
        {[80, 330, 580, 830].map((x) => (
          <g key={x} stroke="#5a4036" strokeWidth="3">
            <line x1={x} y1="120" x2={x} y2="300" />
            <line x1={x - 30} y1="132" x2={x + 30} y2="132" />
          </g>
        ))}
        <path d="M0 140 Q205 155 415 140 T830 140 T1000 140" stroke="#5a4036" strokeWidth="1.4" fill="none" />
        <path d="M0 148 Q205 165 415 148 T830 148 T1000 148" stroke="#5a4036" strokeWidth="1" fill="none" opacity=".7" />
      </svg>
      {/* track bed */}
      <div className="absolute inset-x-0 bottom-0 h-[13%] bg-[#8d847b]" />
      <div className="absolute inset-x-0 bottom-[11%] h-[2.2%]" style={{ background: "repeating-linear-gradient(90deg, #5b4a3d 0 10px, transparent 10px 26px)" }} />
      <div className="absolute inset-x-0 bottom-[12.4%] h-[3px] bg-[#c8c3bc]" />
      {children}
    </div>
  );
}
