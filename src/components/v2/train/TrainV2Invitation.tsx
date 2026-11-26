"use client";

import { useRef, useState } from "react";
import { orderedNames } from "@/lib/defaults";
import { formatLongDate, formatTime, mapsDirectionsUrl, mapsEmbedUrl, parseLocal } from "@/lib/format";
import { gsap, useGSAP } from "@/lib/gsap";
import type { InvitationData, Photo } from "@/lib/types";
import { Lightbox } from "../../shared/Gallery";
import type { InvitationProps } from "../../shared/InvitationExperience";
import { useReveal } from "../../shared/useReveal";
import { RsvpStepper } from "../shared/RsvpStepper";
import { ScheduleScroll } from "../shared/ScheduleScroll";
import { ConfettiLoop, Eyebrow, FlipDigit, HashtagCopy, Led, V2Title, eventCode, useCountdown } from "../shared/primitives";
import { Coach, Locomotive, YellowSign } from "./art";
import { TrainV2Hero, shortDate } from "./TrainV2Hero";

const pad = (n: number, l = 2) => String(n).padStart(l, "0");

/* ------------------------------------------------------------ helpers */

function PhotoOrArt({ photo, label, className = "" }: { photo?: Photo; label: string; className?: string }) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo.src} alt={photo.caption || label} loading="lazy" decoding="async" className={`h-full w-full object-cover ${className}`} />;
  }
  return (
    <div
      className={`grid h-full w-full place-items-center ${className}`}
      style={{ background: "linear-gradient(160deg, color-mix(in oklab, var(--c-accent) 55%, white), color-mix(in oklab, var(--c-secondary) 35%, #f3d6b4))" }}
    >
      <span className="font-v2-serif text-4xl text-white drop-shadow">{label}</span>
    </div>
  );
}

/** A coach drawn in HTML so its windows can hold real photos. */
function PhotoCoach({ photos, labels, board, number, onOpen }: { photos: (Photo | undefined)[]; labels: string[]; board: string; number: string; onOpen?: (i: number) => void }) {
  return (
    <div className="relative w-[min(88vw,420px)] shrink-0">
      <div className="h-3 rounded-t-[14px] bg-[#9b9a97]" />
      <div className="relative rounded-b-md px-3 pb-4 pt-2.5" style={{ background: "var(--c-secondary)" }}>
        <div className="flex items-center justify-between">
          <span className="font-v2-sans rounded-sm px-2 py-0.5 text-[9px] font-bold tracking-[0.12em] text-[#3a2a22] uppercase" style={{ background: "var(--c-accent)" }}>
            {board}
          </span>
          <span className="font-v2-sans rounded-sm bg-white px-1.5 text-[9px] font-bold text-[#2b2a29]">{number}</span>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-3">
          {photos.map((p, i) => (
            <button
              type="button"
              key={i}
              onClick={() => onOpen?.(i)}
              className="aspect-[4/5] overflow-hidden rounded-[12px] border-[3px] border-[#ede6d6] bg-[#26313c] shadow-inner"
              aria-label={`Open photo ${labels[i]}`}
            >
              <PhotoOrArt photo={p} label={labels[i]} />
            </button>
          ))}
        </div>
        <div className="mx-auto mt-3 grid h-3 w-3 place-items-center rounded-full bg-white">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--c-secondary)" }} />
        </div>
      </div>
      <div className="flex justify-between px-8">
        {[0, 1].map((k) => (
          <div key={k} className="flex gap-2">
            <span className="h-6 w-6 -translate-y-1.5 rounded-full border-[3px] border-[#6d6a66] bg-[#2b2a29]" />
            <span className="h-6 w-6 -translate-y-1.5 rounded-full border-[3px] border-[#6d6a66] bg-[#2b2a29]" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ sections */

function DepartureBoard({ data, name }: { data: InvitationData; name: string }) {
  const date = parseLocal(data.date);
  const cd = useCountdown(date);
  const cells: [string, string][] = cd
    ? [
        [pad(cd.days, 3), "Days"],
        [pad(cd.hours), "Hours"],
        [pad(cd.minutes), "Mins"],
        [pad(cd.seconds), "Secs"],
      ]
    : [];
  return (
    <section className="relative px-4 py-14" style={{ background: "var(--c-deep)" }}>
      <div data-reveal className="mx-auto max-w-xl">
        <p className="font-v2-sans text-center text-[10px] tracking-[0.35em] uppercase" style={{ color: "var(--c-accent-light)" }}>
          Departures · प्रस्थान
        </p>
        <div className="led-panel mt-4 rounded-xl border border-white/10 p-4">
          <div className="font-v2-sans grid grid-cols-[auto_1fr_auto] gap-x-5 text-[9px] tracking-[0.2em] text-white/40 uppercase">
            <span>Train</span>
            <span>Name</span>
            <span>PF</span>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] gap-x-5 text-[clamp(14px,4.4vw,20px)]">
            <Led text="1402" />
            <Led text={name} />
            <Led text="1" />
          </div>
          <div className="mt-3 flex items-end justify-between border-t border-white/10 pt-3">
            <span className="font-v2-sans text-[9px] tracking-[0.2em] text-white/40 uppercase">Departs</span>
            <Led text={`${shortDate(date)}  ${pad(date.getHours())}:${pad(date.getMinutes())}`} className="text-[clamp(13px,4vw,18px)]" />
          </div>
        </div>
        <p className="font-v2-sans mt-6 text-center text-sm text-white/80">Departure in</p>
        {cd?.done ? (
          <p className="font-v2-serif mt-3 text-center text-3xl text-white">The journey has begun</p>
        ) : (
          <div className="mt-3 grid grid-cols-4 gap-2" role="timer">
            {cells.map(([v, l]) => (
              <div key={l} className="text-center">
                <span className="led block text-[clamp(30px,10vw,52px)] leading-none" style={{ perspective: 300 }}>
                  <FlipDigit value={v} />
                </span>
                <span className="font-v2-sans mt-1 block text-[9px] tracking-[0.25em] text-white/45 uppercase">{l}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function RouteStory({ data }: { data: InvitationData }) {
  return (
    <section className="v2-route relative px-6 py-20">
      <V2Title eyebrow="The route we took" title="Our Story" />
      <div data-reveal className="relative mx-auto mt-10 max-w-md">
        <div className="relative mx-3 h-4">
          <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed" style={{ borderColor: "color-mix(in oklab, var(--c-secondary) 55%, transparent)" }} />
          <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-[3px] bg-white" style={{ borderColor: "var(--c-ink)" }} />
          <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-4 border-white shadow" style={{ background: "var(--c-accent)" }} />
          <span className="route-train absolute left-0 top-1/2 h-3 w-10 -translate-y-1/2 rounded-full shadow" style={{ background: "var(--c-secondary)" }} />
        </div>
        <div className="font-v2-sans mt-3 flex justify-between text-[9px] font-semibold tracking-[0.2em] uppercase opacity-60">
          <span>Where it began</span>
          <span>{data.city} Jn.</span>
        </div>
      </div>
      <p data-reveal className="font-v2-serif mx-auto mt-10 max-w-md text-lg leading-relaxed opacity-85">
        {data.story}
      </p>
      <p data-reveal className="font-v2-serif mx-auto mt-6 max-w-md border-l-2 pl-4 italic opacity-70" style={{ borderColor: "var(--c-accent)" }}>
        {data.message}
      </p>
    </section>
  );
}

function Timetable({ data }: { data: InvitationData }) {
  const [current, setCurrent] = useState(0);
  return (
    <section className="v2-tt relative px-4 pb-20 pt-6 sm:px-8">
      <V2Title eyebrow="Every stop on the route" title="Celebration Schedule" />
      <div className="sticky top-3 z-20 mt-6 flex justify-center">
        <span className="font-v2-sans flex items-center gap-2 rounded-full bg-[#141110] px-4 py-2 text-[11px] text-white shadow-lg">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Running on time ·
          <Led text={data.events[current]?.title.toUpperCase() ?? ""} className="text-[11px]" />
        </span>
      </div>
      <div className="relative mx-auto mt-8 max-w-xl pl-12">
        {/* vertical track */}
        <div className="tt-track absolute bottom-0 left-2 top-0 w-7" aria-hidden>
          <div className="absolute inset-y-0 left-0 right-0" style={{ background: "repeating-linear-gradient(180deg, #8b6e5a 0 4px, transparent 4px 14px)" }} />
          <div className="absolute inset-y-0 left-[5px] w-[3px] bg-[#8d8a86]" />
          <div className="absolute inset-y-0 right-[5px] w-[3px] bg-[#8d8a86]" />
          <div className="tt-train absolute left-1/2 top-0 h-14 w-5 -translate-x-1/2 rounded-md shadow-md" style={{ background: "var(--c-secondary)" }}>
            <span className="absolute inset-x-1 top-2 h-2 rounded-sm bg-[#26313c]" />
            <span className="absolute inset-x-1 top-6 h-2 rounded-sm bg-[#26313c]" />
            <span className="absolute inset-x-1 bottom-2 h-1 rounded-sm" style={{ background: "var(--c-accent)" }} />
          </div>
        </div>
        <div className="grid gap-14">
          {data.events.map((ev, i) => {
            const when = parseLocal(ev.date, ev.time);
            return (
              <article key={ev.id} className="tt-stop relative" data-index={i}>
                <span className="absolute -left-[42px] top-6 h-4 w-4 rounded-full border-[3px] bg-white" style={{ borderColor: "var(--c-secondary)" }} />
                <div data-reveal className="w-max max-w-full rounded-md border-[3px] border-[#3a2a22] px-4 py-2 text-center shadow-[0_10px_24px_-12px_rgba(0,0,0,.5)]" style={{ background: "var(--c-accent)" }}>
                  <p className="font-v2-sans text-[10px] font-bold tracking-[0.35em] text-[#3a2a22]">{eventCode(ev.title)}</p>
                  <p className="font-v2-sans text-[clamp(17px,5vw,24px)] font-bold tracking-[0.04em] text-[#2b1f1a] uppercase">{ev.title}</p>
                  <p className="font-v2-sans text-[11px] font-medium text-[#3a2a22]">{formatLongDate(when)}</p>
                </div>
                <dl data-reveal className="font-v2-sans mt-4 grid gap-2.5 text-sm">
                  {ev.time && (
                    <div>
                      <dt className="text-[9px] tracking-[0.25em] uppercase opacity-50">🕰 Timings</dt>
                      <dd>{formatTime(when)}</dd>
                    </div>
                  )}
                  {ev.note && (
                    <div>
                      <dt className="text-[9px] tracking-[0.25em] uppercase opacity-50">👗 Notes</dt>
                      <dd>{ev.note}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-[9px] tracking-[0.25em] uppercase opacity-50">📍 Venue</dt>
                    <dd>
                      {ev.venue}
                      {ev.address && <span className="block text-xs opacity-60">{ev.address}</span>}
                    </dd>
                  </div>
                </dl>
                <a
                  data-reveal
                  href={mapsDirectionsUrl([ev.venue, ev.address].filter(Boolean).join(", "))}
                  target="_blank"
                  rel="noreferrer"
                  className="font-v2-sans mt-3 inline-block text-xs font-semibold underline underline-offset-4"
                  style={{ color: "var(--c-secondary)" }}
                >
                  Directions →
                </a>
              </article>
            );
          })}
        </div>
      </div>
      <ScheduleScroll count={data.events.length} onStop={setCurrent} />
    </section>
  );
}

function WindowGallery({ data }: { data: InvitationData }) {
  const [open, setOpen] = useState<number | null>(null);
  const [a, b] = orderedNames(data);
  const photos = data.photos;
  const slots = Math.max(6, photos.length + (photos.length % 2));
  const pairs = Array.from({ length: slots / 2 }, (_, i) => [photos[i * 2], photos[i * 2 + 1]]);
  const labels = ["♥", "✿", "☀", "♪", "✦", "☾"];
  return (
    <section className="relative py-20">
      <V2Title eyebrow="Views from our window" title="Travel Diary" />
      <div className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-1 overflow-x-auto px-[6vw] pb-2" data-reveal>
        {pairs.map((pair, i) => (
          <div key={i} className="snap-center">
            <PhotoCoach
              photos={pair}
              labels={[labels[(i * 2) % 6], labels[(i * 2 + 1) % 6]]}
              board={`${a} ♥ ${b}`}
              number={`S${i + 1}`}
              onOpen={(k) => photos[i * 2 + k] && setOpen(i * 2 + k)}
            />
          </div>
        ))}
      </div>
      <div className="mx-auto mt-1 h-2 w-full" style={{ background: "repeating-linear-gradient(90deg, #8b6e5a 0 6px, transparent 6px 16px)" }} />
      {photos.length > 0 && (
        <p className="font-v2-sans mt-4 text-center text-[10px] tracking-[0.3em] uppercase opacity-60">Swipe through the coaches →</p>
      )}
      {open !== null && photos[open] && (
        <Lightbox index={open} count={photos.length} onIndex={setOpen} onClose={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[open].src} alt={photos[open].caption || "Photo"} className="max-h-[85dvh] max-w-[92vw] rounded-lg object-contain" />
        </Lightbox>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ page */

export function TrainV2Invitation({ data }: InvitationProps) {
  const root = useRef<HTMLDivElement>(null);
  const [a, b] = orderedNames(data);
  const p = data.theme.train2.palette;
  useReveal(root, [data.events.length, data.photos.length]);

  useGSAP(
    () => {
      gsap.fromTo(".hero-wrap", { opacity: 0 }, { opacity: 1, duration: 1.2 });
      gsap.to(".h-cue", { y: 6, duration: 1, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.to(".route-train", {
        left: "calc(100% - 2.5rem)",
        ease: "none",
        scrollTrigger: { trigger: ".v2-route", start: "top 75%", end: "center 40%", scrub: 0.6 },
      });
    },
    { scope: root },
  );

  const place = `${data.venue}, ${data.address}`;
  return (
    <main ref={root} className="font-v2-sans relative overflow-hidden" style={{ background: "var(--c-base)", color: "var(--c-ink)" }}>
      {/* HERO */}
      <section className="hero-wrap relative h-dvh min-h-[620px]">
        <TrainV2Hero
          data={data}
          cue={
            <a href="#board" className="h-cue absolute bottom-[3.5%] left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1.5 text-xs font-medium shadow-md">
              Scroll to board ↓
            </a>
          }
        />
        <ConfettiLoop colors={[p.secondary, p.accent, "#ff8c1a", "#ffd166", "#f4a6b8"]} count={70} />
      </section>

      {/* CO-PASSENGERS */}
      <section id="board" className="relative px-4 pb-16 pt-20 text-center">
        <V2Title eyebrow="Co-passengers" title="Two hearts, one ticket" />
        <div data-reveal className="mt-10 flex justify-center">
          <PhotoCoach photos={[data.photos[0], data.photos[1]]} labels={[a.charAt(0), b.charAt(0)]} board={`1402 · ${a} ♥ ${b}`} number="A1" />
        </div>
        <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-4">
          {(data.nameOrder === "groom-first"
            ? [
                [data.groom, data.groomFamily],
                [data.bride, data.brideFamily],
              ]
            : [
                [data.bride, data.brideFamily],
                [data.groom, data.groomFamily],
              ]
          ).map(([n, f]) => (
            <div key={n} data-reveal>
              <p className="font-v2-serif text-2xl">{n}</p>
              {f && <p className="mt-1 text-xs opacity-60">{f}</p>}
            </div>
          ))}
        </div>
      </section>

      <DepartureBoard data={data} name={`${a.slice(0, 6).trim()}-${b.slice(0, 6).trim()} EXP`.toUpperCase()} />
      <RouteStory data={data} />
      <Timetable data={data} />
      <WindowGallery data={data} />

      {/* LAST STOP */}
      <section className="relative px-4 py-20 text-center">
        <V2Title eyebrow="Final destination" title="The Venue" />
        <div data-reveal className="mt-10">
          <YellowSign top="Last stop" main={<span className="text-[clamp(18px,5.6vw,30px)]">{data.venue}</span>} />
          <p className="mt-1 text-sm opacity-70">{data.address}</p>
        </div>
        <a
          data-reveal
          href={mapsDirectionsUrl(place)}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2b1f1a] px-5 py-2.5 text-[11px] font-semibold tracking-[0.2em] text-white uppercase"
        >
          ➤ Get directions
        </a>
        <div data-reveal="zoom" className="mx-auto mt-8 max-w-xl overflow-hidden rounded-2xl border-4 border-white shadow-lg">
          <iframe title={`Map of ${data.venue}`} src={mapsEmbedUrl(place)} className="h-72 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      </section>

      {/* HASHTAG */}
      {data.hashtag && (
        <section className="px-4 py-16 text-center">
          <Eyebrow>Share the moments</Eyebrow>
          <p data-reveal className="font-v2-serif mt-3 text-[clamp(26px,8vw,44px)]">
            {data.hashtag}
          </p>
          <p data-reveal className="mx-auto mt-2 max-w-xs text-sm opacity-60">
            Tag your photos so we can relive every moment of the journey.
          </p>
          <HashtagCopy
            tag={data.hashtag}
            buttonClass="mt-5 rounded-md px-5 py-2.5 text-[11px] font-semibold tracking-[0.2em] text-white uppercase bg-[color-mix(in_oklab,var(--c-secondary)_45%,#a8794f)]"
          />
        </section>
      )}

      {/* RSVP */}
      <section className="px-4 py-16">
        <RsvpStepper
          events={data.events}
          rsvpBy={data.rsvpBy}
          eyebrow="Reservation counter"
          title="Confirm your berth"
          stepLabels={["Events", "Details", "Wishes"]}
          thanksTitle="Berth confirmed!"
          thanksYes="Your seat is reserved. See you on the platform!"
          thanksNo="We'll miss you on board, and we're grateful for your love and prayers."
        />
      </section>

      {/* FOOTER */}
      <footer className="relative overflow-hidden pb-12 pt-10 text-center">
        <p className="font-v2-hindi text-3xl font-semibold" style={{ color: "var(--c-ink)" }}>
          फिर मिलेंगे
        </p>
        <p className="font-v2-serif mt-2 text-xl italic">Until we meet on the platform</p>
        <p className="mt-2 text-[10px] tracking-[0.3em] uppercase opacity-60">
          With love, {a} &amp; {b}
        </p>
        <div className="relative mt-8 h-24 border-b-4 border-[#8d847b]">
          <div className="absolute bottom-0 flex h-20" style={{ animation: "v2-train-cross 14s linear infinite" }}>
            <Locomotive label={`${a} & ${b}`.toUpperCase()} className="h-full w-auto" style={{ aspectRatio: "400 / 120" }} />
            <Coach number="S1" board={`${a} ♥ ${b}`.toUpperCase()} uid="ft1" className="h-full w-auto" style={{ aspectRatio: "400 / 120" }} />
            <Coach number="S2" board={`${a} ♥ ${b}`.toUpperCase()} uid="ft2" className="h-full w-auto" style={{ aspectRatio: "400 / 120" }} />
          </div>
        </div>
        <p className="mt-6 text-sm italic opacity-70">We can&apos;t wait to celebrate with you</p>
      </footer>
    </main>
  );
}
