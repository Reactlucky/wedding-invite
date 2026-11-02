"use client";

import type { ReactNode } from "react";
import { calendarUrl, formatLongDate, formatTime, mapsDirectionsUrl, mapsEmbedUrl, parseLocal } from "@/lib/format";
import type { EventItem } from "@/lib/types";

export function SectionTitle({ eyebrow, title, ornament }: { eyebrow: string; title: string; ornament?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-col items-center text-center sm:mb-14">
      {ornament && (
        <div data-reveal className="mb-4 text-accent">
          {ornament}
        </div>
      )}
      <p data-reveal className="font-display text-[11px] tracking-[0.45em] text-accent-light/80 uppercase">
        {eyebrow}
      </p>
      <h2 data-reveal className="text-gold mt-3 font-serif text-4xl font-light italic sm:text-6xl">
        {title}
      </h2>
      <div data-reveal="line" className="hairline mt-6 w-40" />
    </div>
  );
}

const PinIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

export function EventCards({
  events,
  variant,
  icon,
}: {
  events: EventItem[];
  variant: "arch" | "ticket";
  icon?: (i: number) => ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((ev, i) => {
        const start = parseLocal(ev.date, ev.time);
        const place = [ev.venue, ev.address].filter(Boolean).join(", ");
        return (
          <article
            key={ev.id}
            data-reveal
            className={
              variant === "arch"
                ? "group relative flex flex-col items-center overflow-hidden rounded-t-[999px] border border-accent/40 bg-gradient-to-b from-secondary/60 to-deep/90 px-6 pb-8 pt-24 text-center shadow-[0_30px_60px_-30px_rgba(0,0,0,.8)] transition duration-500 hover:-translate-y-1 hover:border-accent"
                : "group relative flex flex-col overflow-hidden rounded-xl border border-accent/40 bg-gradient-to-br from-secondary/70 to-deep/95 p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,.8)] transition duration-500 hover:-translate-y-1 hover:border-accent"
            }
          >
            {variant === "arch" && (
              <div className="pointer-events-none absolute inset-2 rounded-t-[999px] border border-accent/20" />
            )}
            {variant === "ticket" && (
              <>
                <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-deep" />
                <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-deep" />
                <div className="mb-4 flex items-center justify-between font-mono text-[10px] tracking-[0.25em] text-accent-light/70 uppercase">
                  <span>Stop {String(i + 1).padStart(2, "0")}</span>
                  <span>First Class</span>
                </div>
              </>
            )}
            {icon && <div className="mb-4 text-accent">{icon(i)}</div>}
            <h3 className="text-gold font-display text-xl tracking-[0.12em] uppercase">{ev.title}</h3>
            <p className="mt-3 font-serif text-lg text-ink/90">{formatLongDate(start)}</p>
            <p className="font-display text-sm tracking-[0.2em] text-accent-light">{formatTime(start)}</p>
            <div className={variant === "arch" ? "hairline my-5 w-24" : "my-5 border-t border-dashed border-accent/40"} />
            <p className="font-serif text-xl text-ink">{ev.venue}</p>
            <p className="mt-1 flex items-start justify-center gap-1.5 text-sm text-ink/70">
              <PinIcon />
              <span>{ev.address}</span>
            </p>
            {ev.note && <p className="mt-3 font-serif text-base italic text-accent-light/90">{ev.note}</p>}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href={mapsDirectionsUrl(place)}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-accent/60 px-4 py-2 font-display text-[10px] tracking-[0.25em] text-accent-light uppercase transition hover:bg-accent hover:text-deep"
              >
                Directions
              </a>
              <a
                href={calendarUrl(ev.title, start, 3, place, "")}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-ink/20 px-4 py-2 font-display text-[10px] tracking-[0.25em] text-ink/80 uppercase transition hover:border-ink/60"
              >
                Add to calendar
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function VenueMap({ venue, address, date }: { venue: string; address: string; date: string }) {
  const place = [venue, address].filter(Boolean).join(", ");
  return (
    <div className="mx-auto grid max-w-5xl items-stretch gap-6 md:grid-cols-[1fr_1.3fr]">
      <div data-reveal className="glass flex flex-col justify-center rounded-2xl p-8 text-center md:text-left">
        <p className="font-display text-[11px] tracking-[0.4em] text-accent-light/80 uppercase">The Venue</p>
        <h3 className="text-gold mt-3 font-serif text-3xl italic">{venue}</h3>
        <p className="mt-3 text-ink/80">{address}</p>
        <p className="mt-2 text-sm text-ink/60">{formatLongDate(parseLocal(date))}</p>
        <a
          href={mapsDirectionsUrl(place)}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center justify-center gap-2 self-center rounded-full bg-accent px-6 py-3 font-display text-[11px] tracking-[0.3em] text-deep uppercase transition hover:brightness-110 md:self-start"
        >
          <PinIcon /> Get Directions
        </a>
      </div>
      <div data-reveal="zoom" className="overflow-hidden rounded-2xl border border-accent/40 bg-black/30">
        <iframe
          title={`Map of ${venue}`}
          src={mapsEmbedUrl(place)}
          className="h-80 w-full md:h-full md:min-h-[22rem]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ filter: "grayscale(.35) contrast(1.05) sepia(.15)" }}
        />
      </div>
    </div>
  );
}
