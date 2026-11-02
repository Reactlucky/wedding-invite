"use client";

import { useRef } from "react";
import { orderedNames } from "@/lib/defaults";
import { parseLocal } from "@/lib/format";
import { gsap, useGSAP } from "@/lib/gsap";
import { Countdown } from "../shared/Countdown";
import { Gallery } from "../shared/Gallery";
import type { InvitationProps } from "../shared/InvitationExperience";
import { RsvpForm } from "../shared/RsvpForm";
import { EventCards, SectionTitle, VenueMap } from "../shared/Sections";
import { useReveal } from "../shared/useReveal";
import { StationBackdrop } from "./StationBackdrop";
import { TrainTicket } from "./TrainTicket";

const Wheel = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden>
    <circle cx="50" cy="50" r="44" fill="none" stroke="var(--c-accent)" strokeWidth="6" />
    {Array.from({ length: 10 }).map((_, i) => (
      <line key={i} x1="50" y1="50" x2="50" y2="10" stroke="var(--c-accent)" strokeWidth="3" transform={`rotate(${i * 36} 50 50)`} />
    ))}
    <circle cx="50" cy="50" r="9" fill="var(--c-accent-light)" />
  </svg>
);

export function TrainInvitation({ data }: InvitationProps) {
  const root = useRef<HTMLDivElement>(null);
  const [a, b] = orderedNames(data);
  useReveal(root, [data.events.length, data.photos.length]);

  useGSAP(
    () => {
      gsap.fromTo(".hero-ticket", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" });
      gsap.to(".spin", { rotation: 360, duration: 8, repeat: -1, ease: "none" });
      gsap.to(".scroll-cue", { y: 8, duration: 1.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
    },
    { scope: root },
  );

  return (
    <main ref={root} className="relative overflow-hidden bg-deep">
      {/* HERO */}
      <section className="relative grid h-dvh min-h-[620px] place-items-center px-3">
        <StationBackdrop />
        <div className="absolute inset-0 bg-black/40" />
        <div className="hero-ticket relative">
          <p className="mb-6 text-center font-mono text-[10px] tracking-[0.5em] text-accent-light uppercase">Your ticket to our wedding</p>
          <TrainTicket data={data} className="-rotate-2" />
        </div>
        <div className="scroll-cue absolute bottom-6 left-1/2 -translate-x-1/2 text-center font-mono text-[10px] tracking-[0.4em] text-ink/80 uppercase">
          All aboard
          <div className="mx-auto mt-2 h-8 w-px bg-gradient-to-b from-accent to-transparent" />
        </div>
      </section>

      {/* MESSAGE */}
      <section className="relative px-6 py-24 text-center sm:py-32">
        <div data-parallax="0.3" className="pointer-events-none absolute -left-20 top-16 hidden h-64 w-64 opacity-10 md:block">
          <Wheel className="spin h-full w-full" />
        </div>
        <p data-reveal className="font-mono text-[11px] tracking-[0.5em] text-accent-light/80 uppercase">
          Passengers of honour
        </p>
        <h2 data-reveal className="text-gold mt-4 font-script text-6xl sm:text-8xl">
          {a} &amp; {b}
        </h2>
        <div data-reveal="line" className="hairline mx-auto my-10 w-48" />
        <p data-reveal className="mx-auto max-w-2xl font-serif text-2xl leading-relaxed text-ink/90 sm:text-3xl">
          {data.message}
        </p>
        <div className="mx-auto mt-14 grid max-w-3xl gap-6 sm:grid-cols-2">
          {[
            [data.bride, data.brideFamily],
            [data.groom, data.groomFamily],
          ].map(([name, fam]) => (
            <div key={name} data-reveal className="rounded-xl border border-accent/30 bg-black/20 p-6">
              <p className="font-mono text-[10px] tracking-[0.3em] text-accent-light/70 uppercase">Passenger</p>
              <p className="text-gold mt-2 font-script text-5xl">{name}</p>
              <p className="mt-2 font-serif italic text-ink/70">{fam}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COUNTDOWN */}
      <section className="relative overflow-hidden px-4 py-24 text-center">
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, var(--c-deep), var(--c-secondary) 50%, var(--c-deep))" }} />
        <div className="relative">
          <SectionTitle eyebrow="Departure in" title="The Countdown" ornament={<Wheel className="spin h-12 w-12" />} />
          <div data-reveal>
            <Countdown target={parseLocal(data.date)} variant="flip" />
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section className="relative px-4 py-24 sm:px-8">
        <SectionTitle eyebrow="Your itinerary" title="Stops Along the Way" />
        <EventCards events={data.events} variant="ticket" />
      </section>

      {/* MAP */}
      <section className="relative px-4 py-24 sm:px-8">
        <SectionTitle eyebrow="Final destination" title="Getting There" />
        <VenueMap venue={data.venue} address={data.address} date={data.date} />
      </section>

      {/* GALLERY */}
      <section className="relative px-4 py-24 sm:px-8">
        <SectionTitle eyebrow="Travel album" title="Our Journey So Far" />
        <Gallery photos={data.photos} template="train" />
      </section>

      {/* RSVP */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-8">
        <div className="absolute inset-0" style={{ background: "radial-gradient(60% 50% at 50% 40%, var(--c-secondary), transparent)" }} />
        <div className="relative">
          <SectionTitle eyebrow="Kindly reply" title="Reserve Your Seat" ornament={<Wheel className="spin h-10 w-10" />} />
          <RsvpForm events={data.events} rsvpBy={data.rsvpBy} />
        </div>
      </section>

      <footer className="relative px-6 pb-16 pt-10 text-center">
        <div data-reveal="line" className="hairline mx-auto w-48" />
        <p data-reveal className="mt-8 font-mono text-[11px] tracking-[0.4em] text-accent-light/80 uppercase">
          Thank you for travelling with us
        </p>
        <p data-reveal className="text-gold mt-5 font-script text-5xl">
          {a} &amp; {b}
        </p>
        {data.hashtag && (
          <p data-reveal className="mt-3 font-mono text-xs tracking-[0.3em] text-accent-light">
            {data.hashtag}
          </p>
        )}
      </footer>
    </main>
  );
}
