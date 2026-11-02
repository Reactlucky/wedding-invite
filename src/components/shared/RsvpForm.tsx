"use client";

import { useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import type { EventItem } from "@/lib/types";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "done"; attending: string } | { kind: "error"; message: string };

const field =
  "w-full rounded-lg border border-accent/30 bg-black/25 px-4 py-3 text-ink placeholder:text-ink/40 outline-none transition focus:border-accent focus:bg-black/40";

export function RsvpForm({ events, rsvpBy }: { events: EventItem[]; rsvpBy?: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [attending, setAttending] = useState<"yes" | "no" | "maybe" | "">("");
  const thanks = useRef<HTMLDivElement>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!attending) {
      setStatus({ kind: "error", message: "Please let us know if you can attend." });
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          phone: fd.get("phone"),
          guests: fd.get("guests"),
          message: fd.get("message"),
          events: fd.getAll("events"),
          attending,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      setStatus({ kind: "done", attending });
      requestAnimationFrame(() =>
        gsap.fromTo(thanks.current, { opacity: 0, y: 20, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "power3.out" }),
      );
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Could not send RSVP" });
    }
  }

  if (status.kind === "done") {
    return (
      <div ref={thanks} className="glass mx-auto max-w-xl rounded-2xl p-10 text-center">
        <p className="text-gold font-script text-5xl">Thank you</p>
        <p className="mt-4 font-serif text-xl text-ink/90">
          {status.attending === "no"
            ? "We will miss you dearly, and we are grateful for your prayers."
            : "Your reply has been received. We can't wait to celebrate with you."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} data-reveal className="glass mx-auto grid max-w-xl gap-5 rounded-2xl p-6 sm:p-10">
      {rsvpBy && (
        <p className="text-center font-display text-[11px] tracking-[0.3em] text-accent-light/80 uppercase">
          Kindly respond by {new Date(rsvpBy).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}
      <label className="grid gap-2">
        <span className="font-display text-[11px] tracking-[0.25em] text-ink/70 uppercase">Full name</span>
        <input name="name" required maxLength={120} autoComplete="name" className={field} placeholder="Your name" />
      </label>
      <label className="grid gap-2">
        <span className="font-display text-[11px] tracking-[0.25em] text-ink/70 uppercase">Phone (optional)</span>
        <input name="phone" type="tel" maxLength={40} autoComplete="tel" className={field} placeholder="+91 …" />
      </label>
      <fieldset className="grid gap-2">
        <legend className="mb-2 font-display text-[11px] tracking-[0.25em] text-ink/70 uppercase">Will you attend?</legend>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["yes", "Joyfully accept"],
              ["maybe", "Maybe"],
              ["no", "Regretfully decline"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setAttending(v)}
              aria-pressed={attending === v}
              className={`rounded-lg border px-2 py-3 text-sm transition ${
                attending === v ? "border-accent bg-accent text-deep" : "border-accent/30 bg-black/20 text-ink/85 hover:border-accent/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      {attending !== "no" && (
        <>
          <label className="grid gap-2">
            <span className="font-display text-[11px] tracking-[0.25em] text-ink/70 uppercase">Number of guests</span>
            <select name="guests" defaultValue="1" className={field}>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n} className="bg-neutral-900">
                  {n}
                </option>
              ))}
            </select>
          </label>
          {events.length > 0 && (
            <fieldset className="grid gap-2">
              <legend className="mb-2 font-display text-[11px] tracking-[0.25em] text-ink/70 uppercase">Attending</legend>
              {events.map((ev) => (
                <label key={ev.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-accent/20 bg-black/20 px-4 py-3">
                  <input type="checkbox" name="events" value={ev.title} defaultChecked className="h-4 w-4 accent-[var(--c-accent)]" />
                  <span>{ev.title}</span>
                </label>
              ))}
            </fieldset>
          )}
        </>
      )}
      <label className="grid gap-2">
        <span className="font-display text-[11px] tracking-[0.25em] text-ink/70 uppercase">Message for the couple</span>
        <textarea name="message" rows={3} maxLength={1000} className={field} placeholder="Your wishes and duas…" />
      </label>
      {status.kind === "error" && (
        <p role="alert" className="text-center text-sm text-red-300">
          {status.message}
        </p>
      )}
      <button
        type="submit"
        disabled={status.kind === "sending"}
        className="mt-2 rounded-full bg-gradient-to-r from-accent via-accent-light to-accent px-8 py-4 font-display text-xs tracking-[0.35em] text-deep uppercase shadow-lg transition hover:brightness-110 disabled:opacity-60"
      >
        {status.kind === "sending" ? "Sending…" : "Send RSVP"}
      </button>
    </form>
  );
}
