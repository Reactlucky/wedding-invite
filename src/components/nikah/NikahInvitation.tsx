"use client";

import { useId, useRef } from "react";
import { orderedNames } from "@/lib/defaults";
import { gsap, useGSAP } from "@/lib/gsap";
import { parseLocal } from "@/lib/format";
import { Countdown } from "../shared/Countdown";
import { Gallery } from "../shared/Gallery";
import type { InvitationProps } from "../shared/InvitationExperience";
import { RsvpForm } from "../shared/RsvpForm";
import { EventCards, SectionTitle, VenueMap } from "../shared/Sections";
import { useReveal } from "../shared/useReveal";
import { NikahNames } from "./NikahNames";
import { Crescent, Divider, Lantern, PatternBackdrop, StarRosette } from "./ornaments";

const eventIcons = [
  <Lantern key="l" className="h-14 w-6" />,
  <Crescent key="c" className="h-12 w-12" />,
  <StarRosette key="s" className="h-11 w-11" />,
];

export function NikahInvitation({ data }: InvitationProps) {
  const uid = useId().replace(/:/g, "");
  const root = useRef<HTMLDivElement>(null);
  const [a, b] = orderedNames(data);
  useReveal(root, [data.events.length, data.photos.length]);

  // hero entrance continues the opening's final frame, then idles
  useGSAP(
    () => {
      gsap.fromTo(".hero-names", { opacity: 0 }, { opacity: 1, duration: 1.4, ease: "power1.out" });
      gsap.to(".hero-lantern", { rotation: 3, duration: 2.6, yoyo: true, repeat: -1, ease: "sine.inOut", stagger: 0.4, transformOrigin: "50% 0%" });
      gsap.to(".scroll-cue", { y: 8, duration: 1.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
    },
    { scope: root },
  );

  return (
    <main ref={root} className="relative overflow-hidden bg-deep">
      {/* HERO */}
      <section className="relative h-dvh min-h-[640px]">
        <div className="absolute inset-0" style={{ background: "radial-gradient(80% 60% at 50% 45%, var(--c-base) 0%, var(--c-deep) 75%)" }} />
        <PatternBackdrop id={`${uid}-hero`} className="absolute inset-0" opacity={0.1} size={72} />
        {[6, 90].map((l, i) => (
          <div key={l} className="hero-lantern pointer-events-none absolute top-0 hidden w-16 md:block" style={{ left: `${l}%` }}>
            <div className="mx-auto h-[14vh] w-[2px] bg-accent" />
            <Lantern className="-mt-[2px] block w-full" />
            <span className="sr-only">{i}</span>
          </div>
        ))}
        <div className="hero-names absolute inset-0">
          <NikahNames data={data} uid={`${uid}-hero-nn`} />
        </div>
        <div className="scroll-cue absolute bottom-6 left-1/2 -translate-x-1/2 text-center font-display text-[10px] tracking-[0.4em] text-accent-light/70 uppercase">
          Scroll
          <div className="mx-auto mt-2 h-8 w-px bg-gradient-to-b from-accent to-transparent" />
        </div>
      </section>

      {/* BISMILLAH & MESSAGE */}
      <section className="relative px-6 py-24 text-center sm:py-32">
        <div data-parallax="0.25" className="pointer-events-none absolute -right-24 top-10 hidden h-72 w-72 opacity-15 md:block">
          <StarRosette className="h-full w-full" />
        </div>
        <p data-reveal className="text-gold font-arabic text-3xl leading-loose sm:text-5xl" dir="rtl" lang="ar">
          بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </p>
        <p data-reveal className="mt-2 font-display text-[10px] tracking-[0.4em] text-ink/60 uppercase">
          In the name of Allah, the Most Gracious, the Most Merciful
        </p>
        <Divider className="my-10" />
        <p data-reveal className="mx-auto max-w-2xl font-serif text-2xl leading-relaxed text-ink/90 sm:text-3xl">
          {data.message}
        </p>
        <div className="mx-auto mt-14 grid max-w-3xl gap-10 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div data-reveal>
            <p className="text-gold font-script text-5xl">{data.bride}</p>
            <p className="mt-2 font-serif italic text-ink/70">{data.brideFamily}</p>
          </div>
          <span data-reveal className="font-serif text-4xl italic text-accent">
            &amp;
          </span>
          <div data-reveal>
            <p className="text-gold font-script text-5xl">{data.groom}</p>
            <p className="mt-2 font-serif italic text-ink/70">{data.groomFamily}</p>
          </div>
        </div>
      </section>

      {/* COUNTDOWN */}
      <section className="relative overflow-hidden px-4 py-24 text-center">
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, var(--c-deep), var(--c-secondary) 50%, var(--c-deep))" }} />
        <PatternBackdrop id={`${uid}-cd`} className="absolute inset-0" opacity={0.08} size={56} />
        <div className="relative">
          <SectionTitle eyebrow="Counting the moments" title="Until We Say Qubool" ornament={<Crescent className="h-12 w-12" />} />
          <div data-reveal>
            <Countdown target={parseLocal(data.date)} variant="arch" />
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section className="relative px-4 py-24 sm:px-8">
        <SectionTitle eyebrow="Celebrations" title="The Wedding Events" ornament={<StarRosette className="h-10 w-10" />} />
        <EventCards events={data.events} variant="arch" icon={(i) => eventIcons[i % eventIcons.length]} />
      </section>

      {/* MAP */}
      <section className="relative px-4 py-24 sm:px-8">
        <SectionTitle eyebrow="Find your way" title="Venue & Directions" />
        <VenueMap venue={data.venue} address={data.address} date={data.date} />
      </section>

      {/* GALLERY */}
      <section className="relative px-4 py-24 sm:px-8">
        <SectionTitle eyebrow="Moments" title="Our Story in Frames" ornament={<StarRosette className="h-10 w-10" />} />
        <Gallery photos={data.photos} template="nikah" />
      </section>

      {/* RSVP */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-8">
        <div className="absolute inset-0" style={{ background: "radial-gradient(60% 50% at 50% 40%, var(--c-secondary), transparent)" }} />
        <div className="relative">
          <SectionTitle eyebrow="Kindly reply" title="RSVP" ornament={<Lantern className="h-16 w-7" />} />
          <RsvpForm events={data.events} rsvpBy={data.rsvpBy} />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative px-6 pb-16 pt-10 text-center">
        <Divider />
        <p data-reveal className="text-gold mt-8 font-arabic text-2xl" dir="rtl" lang="ar">
          جَزَاكُمُ ٱللَّٰهُ خَيْرًا
        </p>
        <p data-reveal className="mt-4 font-serif text-xl italic text-ink/80">
          Your presence and prayers are the greatest gift.
        </p>
        <p data-reveal className="text-gold mt-6 font-script text-5xl">
          {a} &amp; {b}
        </p>
        {data.hashtag && (
          <p data-reveal className="mt-3 font-display text-xs tracking-[0.3em] text-accent-light">
            {data.hashtag}
          </p>
        )}
      </footer>
    </main>
  );
}
