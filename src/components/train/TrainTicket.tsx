import { orderedNames } from "@/lib/defaults";
import { formatDayMonth, formatTime, parseLocal } from "@/lib/format";
import type { InvitationData } from "@/lib/types";

/** Vintage first-class boarding ticket with the couple's details. */
export function TrainTicket({ data, className = "" }: { data: InvitationData; className?: string }) {
  const [a, b] = orderedNames(data);
  const date = parseLocal(data.date);
  const d = formatDayMonth(date);
  return (
    <div className={`tk relative mx-auto w-[min(92vw,560px)] ${className}`}>
      <div
        className="relative flex overflow-hidden rounded-2xl text-[#2a1a10] shadow-[0_40px_80px_-20px_rgba(0,0,0,.8)]"
        style={{
          background:
            "linear-gradient(135deg, #fbf2dc 0%, #f3e3bd 55%, #e9d3a1 100%)",
        }}
      >
        {/* guilloche-like texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[.13]"
          style={{ backgroundImage: "repeating-radial-gradient(circle at 30% 50%, transparent 0 6px, #7a4a1c 6px 7px)" }}
        />
        <div className="relative flex-1 p-4 sm:p-6">
          <div className="flex items-center justify-between border-b border-dashed border-[#7a4a1c]/50 pb-2 font-mono text-[9px] tracking-[0.2em] uppercase sm:text-[11px]">
            <span>The Royal Express</span>
            <span>First Class</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[9px] tracking-[0.15em] text-[#6b4523] uppercase sm:text-[11px]">
            <div>
              From
              <p className="font-display text-sm tracking-[0.1em] text-[#2a1a10] sm:text-lg">Two Hearts</p>
            </div>
            <div>
              To
              <p className="font-display text-sm tracking-[0.1em] text-[#2a1a10] sm:text-lg">Forever</p>
            </div>
          </div>
          <p className="tk-names mt-2 font-script text-[2.1rem] leading-none sm:text-5xl" style={{ color: "var(--c-secondary)" }}>
            {a} <span className="font-serif text-2xl italic">&amp;</span> {b}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[8px] tracking-[0.15em] text-[#6b4523] uppercase sm:text-[10px]">
            <div>
              Date
              <p className="font-display text-xs tracking-normal text-[#2a1a10] sm:text-base">
                {d.day} {d.month.slice(0, 3)} {d.year}
              </p>
            </div>
            <div>
              Departs
              <p className="font-display text-xs tracking-normal text-[#2a1a10] sm:text-base">{formatTime(date)}</p>
            </div>
            <div>
              Platform
              <p className="font-display text-xs tracking-normal text-[#2a1a10] sm:text-base">1</p>
            </div>
          </div>
          <p className="mt-2 truncate font-serif text-xs italic text-[#6b4523] sm:text-sm">
            {data.venue}
            {data.city ? `, ${data.city}` : ""}
          </p>
        </div>
        {/* stub */}
        <div className="relative flex w-[24%] flex-col items-center justify-center border-l-2 border-dashed border-[#7a4a1c]/50 p-2 text-center">
          <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-black/80" />
          <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-black/80" />
          <p className="font-mono text-[8px] tracking-[0.25em] text-[#6b4523] uppercase sm:text-[10px]">Admit</p>
          <p className="font-display text-2xl sm:text-4xl">2</p>
          <p className="mt-1 font-mono text-[8px] tracking-[0.2em] text-[#6b4523] uppercase sm:text-[10px]">Car A · Seat ♥</p>
          <div className="mt-2 h-6 w-full opacity-70" style={{ background: "repeating-linear-gradient(90deg, #2a1a10 0 2px, transparent 2px 4px, #2a1a10 4px 5px, transparent 5px 8px)" }} />
        </div>
      </div>
      <div
        className="tk-stamp pointer-events-none absolute -bottom-7 right-[20%] grid h-20 w-20 place-items-center rounded-full border-[3px] text-center font-display text-[10px] leading-tight tracking-[0.2em] uppercase sm:h-28 sm:w-28"
        style={{ borderColor: "#9b1c1c", color: "#9b1c1c", transform: "rotate(-14deg)", mixBlendMode: "multiply" }}
      >
        <span>
          ★ Boarding ★
          <br />
          <span className="text-sm sm:text-base">Confirmed</span>
          <br />
          {d.day}.{String(date.getMonth() + 1).padStart(2, "0")}.{d.year.slice(2)}
        </span>
      </div>
    </div>
  );
}
