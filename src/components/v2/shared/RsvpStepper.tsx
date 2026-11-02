"use client";

import { useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import type { EventItem } from "@/lib/types";
import { formatLongDate, parseLocal } from "@/lib/format";

const field =
  "w-full rounded-xl border bg-white/70 px-4 py-3 text-[15px] outline-none transition focus:bg-white font-v2-sans";

interface Props {
  events: EventItem[];
  rsvpBy?: string;
  title: string;
  eyebrow: string;
  stepLabels: [string, string, string];
  thanksTitle: string;
  thanksYes: string;
  thanksNo: string;
}

/** Three-step RSVP: which events → guest details → wishes & a song request. */
export function RsvpStepper({ events, rsvpBy, title, eyebrow, stepLabels, thanksTitle, thanksYes, thanksNo }: Props) {
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [attending, setAttending] = useState<"yes" | "no" | "maybe">("yes");
  const [guests, setGuests] = useState(1);
  const [wishes, setWishes] = useState("");
  const [song, setSong] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  const go = (n: number) => {
    setError(null);
    setStep(n);
    requestAnimationFrame(() => gsap.fromTo(panel.current, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.45, ease: "power3.out" }));
  };

  async function submit() {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setStatus("sending");
    try {
      const message = [wishes.trim(), song.trim() && `Song request: ${song.trim()}`].filter(Boolean).join("\n");
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, phone, attending, guests, events: attending === "no" ? [] : chosen, message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not send");
      setStatus("done");
      requestAnimationFrame(() => gsap.fromTo(panel.current, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.6)" }));
    } catch (e) {
      setStatus("idle");
      setError(e instanceof Error ? e.message : "Could not send");
    }
  }

  const border = { borderColor: "color-mix(in oklab, var(--c-ink) 18%, transparent)" };
  const primary =
    "w-full rounded-lg py-3.5 font-v2-sans text-xs font-semibold tracking-[0.25em] uppercase text-white transition hover:brightness-110 disabled:opacity-50";

  return (
    <div
      data-reveal
      className="mx-auto w-full max-w-md rounded-[22px] border border-dashed bg-white/55 p-5 shadow-[0_20px_50px_-30px_rgba(0,0,0,.4)] backdrop-blur sm:p-7"
      style={{ ...border, color: "var(--c-ink)" }}
    >
      <p className="font-v2-sans text-center text-[10px] tracking-[0.32em] uppercase opacity-60">{eyebrow}</p>
      <h3 className="font-v2-serif mt-2 text-center text-3xl">{title}</h3>
      {status !== "done" && (
        <ol className="font-v2-sans mt-4 flex justify-center gap-3 text-[10px] font-semibold tracking-[0.2em] uppercase">
          {stepLabels.map((l, i) => (
            <li key={l} style={{ color: i <= step ? "var(--c-secondary)" : undefined, opacity: i <= step ? 1 : 0.4 }}>
              {i > 0 && <span className="mr-3 opacity-40">/</span>}
              {l}
            </li>
          ))}
        </ol>
      )}

      <div ref={panel} className="mt-5">
        {status === "done" ? (
          <div className="py-6 text-center">
            <p className="font-v2-serif text-4xl" style={{ color: "var(--c-secondary)" }}>
              {thanksTitle}
            </p>
            <p className="font-v2-sans mt-3 opacity-80">{attending === "no" ? thanksNo : thanksYes}</p>
          </div>
        ) : step === 0 ? (
          <div className="grid gap-3">
            <div className="flex items-baseline justify-between">
              <p className="font-v2-sans text-sm font-medium">Which celebrations will you attend?</p>
              <button
                type="button"
                className="font-v2-sans text-xs underline underline-offset-4"
                style={{ color: "var(--c-secondary)" }}
                onClick={() => setChosen(chosen.length === events.length ? [] : events.map((e) => e.title))}
              >
                {chosen.length === events.length ? "Clear" : "Select all"}
              </button>
            </div>
            {events.map((ev) => {
              const on = chosen.includes(ev.title);
              return (
                <label key={ev.id} className="flex cursor-pointer items-center gap-3 rounded-xl border bg-white/70 px-4 py-3 transition" style={on ? { borderColor: "var(--c-secondary)" } : border}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => setChosen(on ? chosen.filter((c) => c !== ev.title) : [...chosen, ev.title])}
                    className="h-4 w-4"
                    style={{ accentColor: "var(--c-secondary)" }}
                  />
                  <span className="font-v2-sans">
                    <span className="block text-xs font-semibold tracking-[0.12em] uppercase">{ev.title}</span>
                    <span className="block text-[11px] opacity-60">
                      {formatLongDate(parseLocal(ev.date, ev.time))} · {ev.venue}
                    </span>
                  </span>
                </label>
              );
            })}
            <button type="button" className={`${primary} mt-2`} style={{ background: "var(--c-secondary)" }} onClick={() => go(1)}>
              Next: your details
            </button>
          </div>
        ) : step === 1 ? (
          <div className="grid gap-3">
            <input className={field} style={border} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120} />
            <input className={field} style={border} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" autoComplete="tel" maxLength={40} />
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["yes", "Joyfully yes"],
                  ["maybe", "Maybe"],
                  ["no", "Can't make it"],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAttending(v)}
                  aria-pressed={attending === v}
                  className="font-v2-sans rounded-xl border px-2 py-3 text-sm transition"
                  style={attending === v ? { background: "var(--c-secondary)", color: "white", borderColor: "var(--c-secondary)" } : { ...border, background: "rgba(255,255,255,.7)" }}
                >
                  {l}
                </button>
              ))}
            </div>
            {attending !== "no" && (
              <div className="font-v2-sans flex items-center justify-between rounded-xl border bg-white/70 px-4 py-2.5" style={border}>
                <span className="text-sm">Guests (including you)</span>
                <span className="flex items-center gap-3">
                  <button type="button" aria-label="Fewer guests" className="h-8 w-8 rounded-full border" style={border} onClick={() => setGuests(Math.max(1, guests - 1))}>
                    −
                  </button>
                  <span className="w-4 text-center font-semibold tabular-nums">{guests}</span>
                  <button type="button" aria-label="More guests" className="h-8 w-8 rounded-full border" style={border} onClick={() => setGuests(Math.min(10, guests + 1))}>
                    +
                  </button>
                </span>
              </div>
            )}
            {error && <p className="font-v2-sans text-sm text-red-700">{error}</p>}
            <div className="mt-2 grid grid-cols-[auto_1fr] gap-2">
              <button type="button" className="font-v2-sans rounded-lg border px-4 text-sm" style={border} onClick={() => go(0)}>
                Back
              </button>
              <button type="button" className={primary} style={{ background: "var(--c-secondary)" }} onClick={() => (name.trim() ? go(2) : setError("Please enter your name."))}>
                Next: wishes
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            <textarea className={field} style={border} rows={3} placeholder="A note or dua for the couple" value={wishes} onChange={(e) => setWishes(e.target.value)} maxLength={800} />
            <input className={field} style={border} placeholder="🎵 Request a song for the dance floor" value={song} onChange={(e) => setSong(e.target.value)} maxLength={120} />
            {error && <p className="font-v2-sans text-sm text-red-700">{error}</p>}
            <div className="mt-2 grid grid-cols-[auto_1fr] gap-2">
              <button type="button" className="font-v2-sans rounded-lg border px-4 text-sm" style={border} onClick={() => go(1)}>
                Back
              </button>
              <button type="button" className={primary} disabled={status === "sending"} style={{ background: "var(--c-secondary)" }} onClick={submit}>
                {status === "sending" ? "Sending…" : "Confirm RSVP"}
              </button>
            </div>
          </div>
        )}
      </div>
      {rsvpBy && status !== "done" && (
        <p className="font-v2-sans mt-4 text-center text-[11px] opacity-50">
          Kindly reply by {new Date(rsvpBy).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}
    </div>
  );
}
