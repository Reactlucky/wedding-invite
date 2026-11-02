import { orderedNames } from "@/lib/defaults";
import { parseLocal } from "@/lib/format";
import type { InvitationData } from "@/lib/types";
import { Led } from "../shared/primitives";
import { Coach, HeroLandscape, Locomotive, YellowSign } from "./art";

export function shortDate(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()} ${d.getFullYear()}`;
}

/** Hero composition: the finale of the opening and the top of the invitation. Parts carry h-* classes for animation. */
export function TrainV2Hero({ data, cue }: { data: InvitationData; cue?: React.ReactNode }) {
  const [a, b] = orderedNames(data);
  const date = parseLocal(data.date);
  return (
    <div className="absolute inset-0" style={{ color: "var(--c-ink)" }}>
      <HeroLandscape>
        <div className="h-train absolute bottom-[12.2%] left-[3%] flex" style={{ height: "min(15dvh, 30vw)" }}>
          <Locomotive label={`${a} & ${b}`.toUpperCase()} className="h-full w-auto" style={{ aspectRatio: "400 / 120" }} />
          <Coach number="A1" board={`${a} ♥ ${b}`.toUpperCase()} uid="hero-c" className="h-full w-auto" style={{ aspectRatio: "400 / 120" }} />
        </div>
      </HeroLandscape>
      <div className="absolute inset-x-0 top-[9%] flex flex-col items-center px-4 text-center">
        <svg className="h-emblem h-9 w-12" viewBox="0 0 48 36" aria-hidden>
          <circle cx="18" cy="20" r="11" fill="none" stroke="var(--c-secondary)" strokeWidth="2" />
          <circle cx="30" cy="20" r="11" fill="none" stroke="var(--c-accent)" strokeWidth="2" />
          <path d="M24 3 l3 4 -3 3 -3 -3z" fill="var(--c-secondary)" />
        </svg>
        <p className="h-eyebrow font-v2-sans mt-3 text-[10px] font-medium tracking-[0.34em] uppercase opacity-70">Together with their families</p>
        <div className="h-sign mt-4">
          <YellowSign
            top="The wedding of"
            main={
              <>
                {a} <span style={{ color: "var(--c-secondary)" }}>♥</span> {b}
              </>
            }
          />
        </div>
        <p className="h-request font-v2-sans mt-5 text-[11px] font-medium tracking-[0.3em] uppercase opacity-80">
          Request the honour
          <br />
          of your presence
        </p>
        <div className="h-date led-panel mt-4 rounded-lg px-4 py-1.5 text-[clamp(13px,3.6vw,17px)]">
          <Led text={shortDate(date)} />
        </div>
      </div>
      {cue}
    </div>
  );
}
