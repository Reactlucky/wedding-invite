"use client";

import { useRef, useState } from "react";
import { orderedNames } from "@/lib/defaults";
import { formatDayMonth, formatLongDate, formatTime, mapsDirectionsUrl, mapsEmbedUrl, parseLocal } from "@/lib/format";
import { gsap, useGSAP } from "@/lib/gsap";
import type { InvitationData, Photo } from "@/lib/types";
import { Lightbox } from "../../shared/Gallery";
import type { InvitationProps } from "../../shared/InvitationExperience";
import { useReveal } from "../../shared/useReveal";
import { RsvpStepper } from "../shared/RsvpStepper";
import { ScheduleScroll } from "../shared/ScheduleScroll";
import { ConfettiLoop, Eyebrow, FlipDigit, HashtagCopy, V2Title, useCountdown } from "../shared/primitives";
import { FlatLantern, Plaque, Skyline } from "./art";
import { NikahV2Hero } from "./NikahV2Hero";

const pad = (n: number, l = 2) => String(n).padStart(l, "0");
const ARCH = "rounded-t-[999px]";

function ArchPhoto({ photo, label, onOpen, className = "" }: { photo?: Photo; label: string; onOpen?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={photo ? `Open photo ${label}` : label}
      className={`relative overflow-hidden ${ARCH} rounded-b-md border-[5px] shadow-[0_16px_30px_-16px_rgba(0,0,0,.5)] ${className}`}
      style={{ borderColor: "#efe2cb", outline: "2px solid var(--c-accent)", outlineOffset: "-9px" }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo.src} alt={photo.caption || label} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center" style={{ background: "linear-gradient(170deg, color-mix(in oklab, var(--c-secondary) 70%, white), var(--c-secondary))" }}>
          <span className="font-v2-serif text-4xl text-[#fff8e7]">{label}</span>
        </span>
      )}
    </button>
  );
}

function Countdown({ data }: { data: InvitationData }) {
  const date = parseLocal(data.date);
  const cd = useCountdown(date);
  const d = formatDayMonth(date);
  return (
    <section className="px-4 py-16">
      <div
        data-reveal
        className={`relative mx-auto max-w-xl ${ARCH} rounded-b-3xl border-[3px] px-5 pb-10 pt-16 text-center shadow-[0_30px_60px_-30px_rgba(0,0,0,.6)]`}
        style={{ background: "linear-gradient(180deg, color-mix(in oklab, var(--c-secondary) 85%, white), var(--c-deep))", borderColor: "var(--c-accent)" }}
      >
        <div className={`pointer-events-none absolute inset-2 ${ARCH} rounded-b-2xl border`} style={{ borderColor: "color-mix(in oklab, var(--c-accent) 50%, transparent)" }} />
        <FlatLantern className="mx-auto -mt-6 mb-2 h-14 w-7" />
        <p className="font-v2-sans text-[10px] tracking-[0.35em] uppercase" style={{ color: "var(--c-accent-light)" }}>
          Counting the days to Qubool
        </p>
        <p className="font-v2-serif mt-2 text-xl text-[#fff8e7]">
          {d.weekday}, {d.day} {d.month} {d.year}
        </p>
        {cd?.done ? (
          <p className="font-v2-serif mt-6 text-3xl text-[#fff8e7]">Alhamdulillah, the day is here</p>
        ) : (
          <div className="mt-6 grid grid-cols-4 gap-2" role="timer">
            {cd &&
              (
                [
                  [pad(cd.days, 3), "Days"],
                  [pad(cd.hours), "Hours"],
                  [pad(cd.minutes), "Mins"],
                  [pad(cd.seconds), "Secs"],
                ] as const
              ).map(([v, l]) => (
                <div key={l}>
                  <span className="font-v2-serif block text-[clamp(30px,10vw,54px)] leading-none" style={{ color: "var(--c-accent-light)", perspective: 300 }}>
                    <FlipDigit value={v} />
                  </span>
                  <span className="font-v2-sans mt-1 block text-[9px] tracking-[0.25em] text-white/60 uppercase">{l}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Schedule({ data }: { data: InvitationData }) {
  const [current, setCurrent] = useState(0);
  return (
    <section className="v2-tt relative px-4 pb-20 pt-10 sm:px-8">
      <V2Title eyebrow="The celebrations" title="Wedding Schedule" />
      <div className="sticky top-3 z-20 mt-6 flex justify-center">
        <span className="font-v2-sans flex items-center gap-2 rounded-full px-4 py-2 text-[11px] text-white shadow-lg" style={{ background: "var(--c-deep)" }}>
          <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--c-accent-light)" }} />
          Up next ·<span className="font-semibold" style={{ color: "var(--c-accent-light)" }}>{data.events[current]?.title}</span>
        </span>
      </div>
      <div className="relative mx-auto mt-8 max-w-xl pl-14">
        {/* golden chain with a lantern travelling down it */}
        <div className="tt-track absolute bottom-0 left-4 top-0 w-8" aria-hidden>
          <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2" style={{ background: "repeating-linear-gradient(180deg, var(--c-accent) 0 8px, transparent 8px 11px)" }} />
          <div className="tt-train absolute left-0 top-0 h-16 w-8">
            <FlatLantern className="h-full w-full" />
          </div>
        </div>
        <div className="grid gap-14">
          {data.events.map((ev, i) => {
            const when = parseLocal(ev.date, ev.time);
            return (
              <article key={ev.id} className="tt-stop relative">
                <span className="absolute -left-[44px] top-10 h-3 w-3 rotate-45 border-2 bg-white" style={{ borderColor: "var(--c-accent)" }} />
                <div
                  data-reveal
                  className={`w-max max-w-full ${ARCH} rounded-b-lg border-[3px] px-6 pb-3 pt-6 text-center shadow-[0_12px_26px_-14px_rgba(0,0,0,.55)]`}
                  style={{ background: "var(--c-secondary)", borderColor: "var(--c-accent)" }}
                >
                  <p className="font-v2-serif text-xs font-semibold tracking-[0.3em]" style={{ color: "var(--c-accent-light)" }}>
                    {["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][i] ?? i + 1}
                  </p>
                  <p className="font-v2-serif text-[clamp(20px,6vw,28px)] text-[#fff8e7]">{ev.title}</p>
                  <p className="font-v2-sans text-[11px] text-white/75">{formatLongDate(when)}</p>
                </div>
                <dl data-reveal className="font-v2-sans mt-4 grid gap-2.5 text-sm">
                  <div>
                    <dt className="text-[9px] tracking-[0.25em] uppercase opacity-50">Time</dt>
                    <dd>{formatTime(when)}</dd>
                  </div>
                  {ev.note && (
                    <div>
                      <dt className="text-[9px] tracking-[0.25em] uppercase opacity-50">Note</dt>
                      <dd>{ev.note}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-[9px] tracking-[0.25em] uppercase opacity-50">Venue</dt>
                    <dd>
                      {ev.venue}
                      <span className="block text-xs opacity-60">{ev.address}</span>
                    </dd>
                  </div>
                </dl>
                <a
                  data-reveal
                  href={mapsDirectionsUrl(`${ev.venue}, ${ev.address}`)}
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

function ArcadeGallery({ data }: { data: InvitationData }) {
  const [open, setOpen] = useState<number | null>(null);
  const photos = data.photos;
  const slots = Math.max(5, photos.length);
  const marks = ["♥", "✿", "☾", "✦", "❀"];
  return (
    <section className="relative py-20">
      <V2Title eyebrow="Moments we cherish" title="Through the Arches" />
      <div
        data-reveal
        className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[10vw] pb-6 pt-4"
        style={{ background: "linear-gradient(to bottom, transparent 0 18%, #efe2cb 18% 100%)" }}
      >
        {Array.from({ length: slots }, (_, i) => (
          <div key={i} className="snap-center">
            <ArchPhoto photo={photos[i]} label={marks[i % marks.length]} onOpen={() => photos[i] && setOpen(i)} className="h-[min(56vw,300px)] w-[min(40vw,215px)] shrink-0" />
          </div>
        ))}
      </div>
      <div className="h-1.5" style={{ background: "var(--c-accent)" }} />
      <p className="font-v2-sans mt-4 text-center text-[10px] tracking-[0.3em] uppercase opacity-60">
        {photos.length ? "Swipe through the arches →" : "Add photos in the editor to fill these arches"}
      </p>
      {open !== null && photos[open] && (
        <Lightbox index={open} count={photos.length} onIndex={setOpen} onClose={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[open].src} alt={photos[open].caption || "Photo"} className="max-h-[85dvh] max-w-[92vw] rounded-lg object-contain" />
        </Lightbox>
      )}
    </section>
  );
}

export function NikahV2Invitation({ data }: InvitationProps) {
  const root = useRef<HTMLDivElement>(null);
  const [a, b] = orderedNames(data);
  const p = data.theme.nikah2.palette;
  useReveal(root, [data.events.length, data.photos.length]);

  useGSAP(
    () => {
      gsap.fromTo(".hero-wrap", { opacity: 0 }, { opacity: 1, duration: 1.2 });
      gsap.to(".h-cue", { y: 6, duration: 1, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.to(".route-moon", {
        left: "calc(100% - 1.75rem)",
        ease: "none",
        scrollTrigger: { trigger: ".v2-route", start: "top 75%", end: "center 40%", scrub: 0.6 },
      });
      gsap.to(".sway", { rotation: 4, duration: 2.2, yoyo: true, repeat: -1, ease: "sine.inOut", stagger: 0.5, transformOrigin: "50% 0%" });
    },
    { scope: root },
  );

  const place = `${data.venue}, ${data.address}`;
  return (
    <main ref={root} className="font-v2-sans relative overflow-hidden" style={{ background: "var(--c-base)", color: "var(--c-ink)" }}>
      <section className="hero-wrap relative h-dvh min-h-[620px]">
        <NikahV2Hero
          data={data}
          cue={
            <a href="#couple" className="h-cue absolute bottom-[3.5%] left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1.5 text-xs font-medium shadow-md">
              Scroll to enter ↓
            </a>
          }
        />
        <ConfettiLoop colors={["#e8516f", "#f4a6b8", "#c2185b", p.accent, "#ffffff"]} count={60} />
      </section>

      {/* COUPLE */}
      <section id="couple" className="px-4 pb-16 pt-20 text-center">
        <V2Title eyebrow="The bride & the groom" title="Two souls, one path" />
        <div data-reveal className="mx-auto mt-10 flex max-w-md justify-center gap-4 rounded-t-2xl px-4 pb-0 pt-5" style={{ background: "#efe2cb" }}>
          <ArchPhoto photo={data.photos[0]} label={a.charAt(0)} className="aspect-[3/4] w-1/2" />
          <ArchPhoto photo={data.photos[1]} label={b.charAt(0)} className="aspect-[3/4] w-1/2" />
        </div>
        <div className="mx-auto h-1.5 max-w-md" style={{ background: "var(--c-accent)" }} />
        <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-4">
          {[
            [data.bride, data.brideFamily],
            [data.groom, data.groomFamily],
          ].map(([n, f]) => (
            <div key={n} data-reveal>
              <p className="font-v2-serif text-2xl">{n}</p>
              <p className="mt-1 text-xs opacity-60">{f}</p>
            </div>
          ))}
        </div>
      </section>

      <Countdown data={data} />

      {/* STORY */}
      <section className="v2-route px-6 py-16">
        <V2Title eyebrow="How it was written" title="Our Story" />
        <div data-reveal className="relative mx-auto mt-10 max-w-md">
          <div className="relative mx-3 h-7">
            <div className="absolute inset-x-0 top-1/2 border-t-2 border-dotted" style={{ borderColor: "var(--c-accent)" }} />
            <span className="absolute -left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-45 border-2 bg-white" style={{ borderColor: "var(--c-secondary)" }} />
            <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45" style={{ background: "var(--c-secondary)" }} />
            <svg viewBox="0 0 40 40" className="route-moon absolute left-4 top-1/2 h-7 w-7 -translate-y-1/2" aria-hidden>
              <path d="M24 6a14 14 0 1 0 0 28a11 11 0 1 1 0 -28z" fill="var(--c-accent)" />
            </svg>
          </div>
          <div className="mt-3 flex justify-between text-[9px] font-semibold tracking-[0.2em] uppercase opacity-60">
            <span>Where it began</span>
            <span>{data.city}</span>
          </div>
        </div>
        <p data-reveal className="font-v2-serif mx-auto mt-10 max-w-md text-lg leading-relaxed opacity-85">
          {data.story}
        </p>
        <p data-reveal className="font-v2-serif mx-auto mt-6 max-w-md border-l-2 pl-4 italic opacity-70" style={{ borderColor: "var(--c-accent)" }}>
          {data.message}
        </p>
      </section>

      <Schedule data={data} />
      <ArcadeGallery data={data} />

      {/* VENUE */}
      <section className="px-4 py-20 text-center">
        <V2Title eyebrow="Where we gather" title="The Venue" />
        <div data-reveal className="mt-8">
          <Plaque top="Destination" main={<span className="text-[clamp(20px,6vw,32px)]">{data.venue}</span>} />
          <p className="mt-3 text-sm opacity-70">{data.address}</p>
        </div>
        <a
          data-reveal
          href={mapsDirectionsUrl(place)}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] font-semibold tracking-[0.2em] text-white uppercase"
          style={{ background: "var(--c-deep)" }}
        >
          ➤ Get directions
        </a>
        <div data-reveal="zoom" className={`mx-auto mt-8 max-w-xl overflow-hidden ${ARCH} rounded-b-2xl border-4 shadow-lg`} style={{ borderColor: "#efe2cb" }}>
          <iframe title={`Map of ${data.venue}`} src={mapsEmbedUrl(place)} className="h-80 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      </section>

      {data.hashtag && (
        <section className="px-4 py-14 text-center">
          <Eyebrow>Share the moments</Eyebrow>
          <p data-reveal className="font-v2-serif mt-3 text-[clamp(26px,8vw,44px)]">
            {data.hashtag}
          </p>
          <p data-reveal className="mx-auto mt-2 max-w-xs text-sm opacity-60">
            Tag your photos and duas so we can treasure them forever.
          </p>
          <HashtagCopy tag={data.hashtag} buttonClass="mt-5 rounded-md px-5 py-2.5 text-[11px] font-semibold tracking-[0.2em] text-white uppercase bg-[var(--c-secondary)]" />
        </section>
      )}

      <section className="px-4 py-16">
        <RsvpStepper
          events={data.events}
          rsvpBy={data.rsvpBy}
          eyebrow="Kindly respond"
          title="Will you join us?"
          stepLabels={["Events", "Details", "Duas"]}
          thanksTitle="JazakAllah khair!"
          thanksYes="Your reply is received. We look forward to celebrating with you, in sha Allah."
          thanksNo="You will be missed. Please keep us in your duas."
        />
      </section>

      <footer className="relative overflow-hidden pt-10 text-center">
        <div className="flex justify-center gap-[18vw]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="sway flex flex-col items-center">
              <span className="h-10 w-px" style={{ background: "var(--c-accent)" }} />
              <FlatLantern className="h-14 w-7" />
            </div>
          ))}
        </div>
        <p className="font-arabic mt-6 text-3xl" style={{ color: "var(--c-secondary)" }} dir="rtl" lang="ar">
          جَزَاكُمُ ٱللَّٰهُ خَيْرًا
        </p>
        <p className="font-v2-serif mt-2 text-xl italic">Your presence and prayers are our greatest gift</p>
        <p className="mt-2 text-[10px] tracking-[0.3em] uppercase opacity-60">
          With love, {a} &amp; {b}
        </p>
        <Skyline className="mt-8 h-32 w-full" />
      </footer>
    </main>
  );
}
