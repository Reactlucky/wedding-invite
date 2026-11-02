import { orderedNames } from "@/lib/defaults";
import { formatDayMonth, formatTime, parseLocal } from "@/lib/format";
import type { InvitationData } from "@/lib/types";
import { Crescent, StarRosette } from "./ornaments";

function Letters({ text }: { text: string }) {
  return (
    <>
      {Array.from(text).map((c, i) => (
        <span key={i} className="ch text-gold inline-block" style={{ whiteSpace: "pre" }}>
          {c}
        </span>
      ))}
    </>
  );
}

/**
 * The couple's names inside an arch frame. Used as the finale of the opening
 * (animated via the nn-* classes) and as the hero of the invitation page.
 */
export function NikahNames({ data, uid }: { data: InvitationData; uid: string }) {
  const [a, b] = orderedNames(data);
  const date = parseLocal(data.date);
  const d = formatDayMonth(date);
  return (
    <div className="relative flex h-full w-full items-center justify-center px-4">
      <div
        className="relative flex flex-col items-center justify-center text-center"
        style={{ width: "min(92vw, 60dvh)", aspectRatio: "2 / 3", maxHeight: "94dvh" }}
      >
        <svg viewBox="0 0 400 600" preserveAspectRatio="none" className="nn-frame absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <linearGradient id={`${uid}-fg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--c-accent-light)" />
              <stop offset="1" stopColor="var(--c-accent)" />
            </linearGradient>
            <radialGradient id={`${uid}-fill`} cx=".5" cy=".42" r=".6">
              <stop offset="0" stopColor="var(--c-secondary)" stopOpacity=".85" />
              <stop offset="1" stopColor="var(--c-deep)" stopOpacity=".2" />
            </radialGradient>
          </defs>
          <path d="M14 600 L14 210 C14 115 125 52 200 14 C275 52 386 115 386 210 L386 600 Z" fill={`url(#${uid}-fill)`} />
          <g fill="none" stroke={`url(#${uid}-fg)`}>
            <path pathLength={1} strokeDasharray="1" d="M14 600 L14 210 C14 115 125 52 200 14 C275 52 386 115 386 210 L386 600" strokeWidth="2" />
            <path pathLength={1} strokeDasharray="1" d="M28 600 L28 216 C28 128 132 70 200 34 C268 70 372 128 372 216 L372 600" strokeWidth="1" />
            <path pathLength={1} strokeDasharray="1" d="M28 560 H372" strokeWidth="1" />
          </g>
        </svg>

        <div className="relative z-10 flex flex-col items-center px-6 pt-[14%]">
          <Crescent className="nn-crescent mb-1 h-12 w-12 sm:h-14 sm:w-14" />
          <p className="nn-dua text-gold font-arabic text-2xl leading-relaxed sm:text-3xl" dir="rtl" lang="ar">
            بَارَكَ ٱللَّٰهُ لَكُمَا
          </p>
          <p className="nn-eyebrow mt-2 font-display text-[9px] tracking-[0.42em] text-ink/80 uppercase sm:text-[11px]">
            The Nikah of
          </p>
          <h1 className="mt-2 flex flex-col items-center">
            <span className="nn-name1 font-script leading-[1.05]" style={{ fontSize: "clamp(2.9rem, min(13vw, 8.5dvh), 6.2rem)" }}>
              <Letters text={a} />
            </span>
            <span className="my-1 flex items-center gap-3">
              <span className="nn-line hairline w-10 sm:w-16" />
              <span className="nn-amp font-serif text-2xl italic text-accent-light sm:text-3xl">&amp;</span>
              <span className="nn-line hairline w-10 sm:w-16" />
            </span>
            <span className="nn-name2 font-script leading-[1.05]" style={{ fontSize: "clamp(2.9rem, min(13vw, 8.5dvh), 6.2rem)" }}>
              <Letters text={b} />
            </span>
          </h1>
          <StarRosette className="nn-divider mt-3 h-7 w-7" />
          <div className="nn-date mt-3 font-display text-ink">
            <p className="text-[10px] tracking-[0.4em] text-accent-light uppercase sm:text-xs">{d.weekday}</p>
            <p className="mt-1 text-lg tracking-[0.18em] sm:text-2xl">
              {d.day} {d.month} {d.year}
            </p>
            <p className="mt-1 text-[10px] tracking-[0.35em] text-ink/70 uppercase sm:text-xs">{formatTime(date)}</p>
          </div>
          <p className="nn-venue mt-3 max-w-[16rem] font-serif text-base italic text-ink/80 sm:text-lg">
            {data.venue}
            {data.city ? `, ${data.city}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
