import { orderedNames } from "@/lib/defaults";
import { formatDayMonth, formatTime, parseLocal } from "@/lib/format";
import type { InvitationData } from "@/lib/types";
import { Garland, Plaque, Skyline } from "./art";

/** Hero composition shared by the opening finale and the invitation top (h-* classes animate). */
export function NikahV2Hero({ data, cue }: { data: InvitationData; cue?: React.ReactNode }) {
  const [a, b] = orderedNames(data);
  const date = parseLocal(data.date);
  const d = formatDayMonth(date);
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ color: "var(--c-ink)", background: "linear-gradient(to bottom, var(--c-base) 0%, var(--c-base) 45%, color-mix(in oklab, var(--c-base) 75%, #f2c79a) 100%)" }}>
      <div className="absolute left-1/2 top-[78%] h-[50vmin] w-[50vmin] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,230,180,.85), transparent 65%)" }} />
      <Garland className="absolute inset-x-0 top-0 h-[90px]" />
      <Skyline className="h-skyline absolute inset-x-0 bottom-0 h-[26%] w-full" />
      <div className="absolute inset-x-0 top-[12%] flex flex-col items-center px-4 text-center">
        <svg viewBox="0 0 40 40" className="h-emblem h-9 w-9" aria-hidden>
          <path d="M24 6a14 14 0 1 0 0 28a11 11 0 1 1 0 -28z" fill="var(--c-accent)" />
          <path d="M31 13l1.4 3 3.3.3-2.5 2.2.8 3.2-3-1.7-3 1.7.8-3.2-2.5-2.2 3.3-.3z" fill="var(--c-accent)" />
        </svg>
        <p className="h-eyebrow font-v2-sans mt-3 text-[10px] font-medium tracking-[0.34em] uppercase opacity-70">With the blessings of Allah &amp; our families</p>
        <div className="h-sign mt-4" style={{ transformOrigin: "50% 0%" }}>
          <Plaque
            arabic="نِكَاح"
            top="The Nikah of"
            main={
              <>
                {a} <span style={{ color: "var(--c-accent-light)" }}>&amp;</span> {b}
              </>
            }
          />
        </div>
        <p className="h-request font-v2-sans mt-6 text-[11px] font-medium tracking-[0.3em] uppercase opacity-80">
          Request the honour
          <br />
          of your presence
        </p>
        <div className="h-date font-v2-serif mt-4 rounded-full border-2 px-5 py-1.5 text-[clamp(15px,4.2vw,20px)]" style={{ borderColor: "var(--c-accent)", color: "var(--c-secondary)" }}>
          {d.weekday}, {d.day} {d.month} {d.year} · {formatTime(date)}
        </div>
      </div>
      {cue}
    </div>
  );
}
