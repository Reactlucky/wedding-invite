"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeInvitation } from "@/lib/defaults";
import { compressImage } from "@/lib/image";
import { uid } from "@/lib/random";
import { broadcast, editorHeaders } from "@/lib/sync";
import { THEME_PRESETS } from "@/lib/themes";
import type { EventItem, InvitationData, Palette, Rsvp, TemplateId } from "@/lib/types";
import { Area, Field, Panel, Segmented, Text, inputCls } from "./fields";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
type Device = "mobile" | "desktop";

const DEVICES: Record<Device, { w: number; h: number }> = {
  mobile: { w: 390, h: 844 },
  desktop: { w: 1440, h: 900 },
};

const PALETTE_KEYS: [keyof Palette, string][] = [
  ["deep", "Deep background"],
  ["base", "Base"],
  ["secondary", "Secondary"],
  ["accent", "Accent / metal"],
  ["accentLight", "Highlight"],
  ["ink", "Text"],
];

async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  let res = await fetch(input, { ...init, headers: { ...(init.headers ?? {}), ...editorHeaders() } });
  if (res.status === 401) {
    const token = window.prompt("This studio is protected. Enter the editor token (EDITOR_TOKEN):");
    if (token) {
      try {
        localStorage.setItem("editor-token", token);
      } catch {}
      res = await fetch(input, { ...init, headers: { ...(init.headers ?? {}), "x-editor-token": token } });
    }
  }
  return res;
}

async function upload(file: Blob, name: string): Promise<{ src: string; name: string }> {
  const fd = new FormData();
  fd.append("file", file, name);
  const res = await authedFetch("/api/upload", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Upload failed");
  return json;
}

export function Editor() {
  const [data, setData] = useState<InvitationData | null>(null);
  const [save, setSave] = useState<SaveState>("idle");
  const [template, setTemplate] = useState<TemplateId>("nikah");
  const [device, setDevice] = useState<Device>("mobile");
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [frameKey, setFrameKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<InvitationData | null>(null);

  useEffect(() => {
    fetch("/api/invitation", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const n = normalizeInvitation(d);
        latest.current = n;
        setData(n);
      });
  }, []);

  const persist = useCallback(async () => {
    if (!latest.current) return;
    setSave("saving");
    try {
      const res = await authedFetch("/api/invitation", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(latest.current),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSave("saved");
    } catch {
      setSave("error");
    }
  }, []);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
      await persist();
    }
  }, [persist]);

  const update = useCallback(
    (fn: (d: InvitationData) => InvitationData) => {
      setData((prev) => {
        if (!prev) return prev;
        const next = fn(prev);
        latest.current = next;
        broadcast({ type: "data", data: next }); // instant live preview
        return next;
      });
      setSave("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        persist();
      }, 700);
    },
    [persist],
  );

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (timer.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const set = <K extends keyof InvitationData>(key: K) => (v: InvitationData[K]) => update((d) => ({ ...d, [key]: v }));

  if (!data) {
    return <div className="grid min-h-dvh place-items-center bg-[#0c0c0e] text-white/50">Loading studio…</div>;
  }

  return (
    <div className="flex h-dvh flex-col bg-[#0c0c0e] font-sans text-white" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      {/* top bar */}
      <header className="flex items-center gap-3 border-b border-white/[.07] px-4 py-3">
        <Link href="/" className="font-serif text-lg italic text-amber-200">
          Ever After Studio
        </Link>
        <SaveBadge state={save} />
        <div className="ml-auto flex items-center gap-2">
          <Segmented
            value={template}
            onChange={(t) => {
              setTemplate(t);
              setFrameKey((k) => k + 1);
            }}
            options={[
              ["nikah", "Nikah"],
              ["train", "Train"],
            ]}
          />
        </div>
      </header>

      {/* mobile tab switch */}
      <div className="flex justify-center border-b border-white/[.07] p-2 lg:hidden">
        <Segmented
          value={mobileTab}
          onChange={setMobileTab}
          options={[
            ["edit", "Edit"],
            ["preview", "Preview"],
          ]}
        />
      </div>

      <div className="flex min-h-0 flex-1">
        {/* form */}
        <aside className={`${mobileTab === "edit" ? "block" : "hidden"} w-full overflow-y-auto border-r border-white/[.07] lg:block lg:w-[420px] lg:shrink-0`}>
          <Panel title="Couple" icon="💍" defaultOpen>
            <div className="grid grid-cols-2 gap-3">
              <Text label="Bride" value={data.bride} onChange={set("bride")} />
              <Text label="Groom" value={data.groom} onChange={set("groom")} />
            </div>
            <Text label="Bride's family" value={data.brideFamily} onChange={set("brideFamily")} />
            <Text label="Groom's family" value={data.groomFamily} onChange={set("groomFamily")} />
            <Field label="Name order">
              <Segmented
                value={data.nameOrder}
                onChange={set("nameOrder")}
                options={[
                  ["bride-first", "Bride first"],
                  ["groom-first", "Groom first"],
                ]}
              />
            </Field>
          </Panel>

          <Panel title="Wedding date & location" icon="📍">
            <Text label="Ceremony date & time" type="datetime-local" value={data.date} onChange={set("date")} />
            <Text label="Venue" value={data.venue} onChange={set("venue")} />
            <Text label="Address" value={data.address} onChange={set("address")} hint="Used for Google Maps & directions" />
            <Text label="City" value={data.city} onChange={set("city")} />
            <Area label="Invitation message" value={data.message} onChange={set("message")} rows={4} />
            <div className="grid grid-cols-2 gap-3">
              <Text label="Hashtag" value={data.hashtag} onChange={set("hashtag")} />
              <Text label="RSVP by" type="date" value={data.rsvpBy} onChange={set("rsvpBy")} />
            </div>
          </Panel>

          <Panel title="Event schedule" icon="🗓️">
            <EventsEditor events={data.events} onChange={set("events")} />
          </Panel>

          <Panel title="Photos" icon="🖼️">
            <PhotosEditor data={data} update={update} />
          </Panel>

          <Panel title="Background music" icon="🎵">
            <MusicEditor data={data} update={update} />
          </Panel>

          <Panel title={`Colour theme · ${template === "nikah" ? "Nikah" : "Train"}`} icon="🎨">
            <ThemeEditor data={data} template={template} update={update} />
          </Panel>

          <Panel title="Export opening as MP4" icon="🎬">
            <ExportPanel template={template} flush={flush} />
          </Panel>

          <Panel title="RSVP responses" icon="✉️">
            <RsvpList />
          </Panel>
        </aside>

        {/* preview */}
        <section className={`${mobileTab === "preview" ? "flex" : "hidden"} min-w-0 flex-1 flex-col lg:flex`}>
          <div className="flex flex-wrap items-center gap-2 border-b border-white/[.07] px-4 py-2.5">
            <Segmented
              value={device}
              onChange={setDevice}
              options={[
                ["mobile", "Mobile"],
                ["desktop", "Desktop"],
              ]}
            />
            <button type="button" onClick={() => broadcast({ type: "replay" })} className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-black">
              ▶ Replay opening
            </button>
            <button type="button" onClick={() => broadcast({ type: "show", view: "invitation" })} className="rounded-lg bg-white/[.08] px-3 py-1.5 text-xs">
              Show invitation
            </button>
            <button type="button" onClick={() => setFrameKey((k) => k + 1)} className="rounded-lg bg-white/[.08] px-3 py-1.5 text-xs">
              Reload
            </button>
            <a href={`/${template}`} target="_blank" rel="noreferrer" className="ml-auto text-xs text-amber-200 underline-offset-4 hover:underline">
              Open /{template} ↗
            </a>
          </div>
          <DevicePreview key={`${template}-${frameKey}`} src={`/${template}?preview=1`} device={device} />
        </section>
      </div>
    </div>
  );
}

function SaveBadge({ state }: { state: SaveState }) {
  const map: Record<SaveState, [string, string]> = {
    idle: ["", ""],
    dirty: ["Unsaved changes", "text-white/50"],
    saving: ["Saving…", "text-white/50"],
    saved: ["✓ Saved", "text-emerald-300"],
    error: ["Save failed — retrying on next edit", "text-red-300"],
  };
  const [text, cls] = map[state];
  return <span className={`text-xs ${cls}`} aria-live="polite">{text}</span>;
}

function DevicePreview({ src, device }: { src: string; device: Device }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const dims = DEVICES[device];
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setScale(Math.min((width - 32) / dims.w, (height - 32) / dims.h, 1));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [dims.w, dims.h]);
  return (
    <div ref={box} className="grid min-h-0 flex-1 place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#1b1b20,#0c0c0e)]">
      <div
        className={`overflow-hidden bg-black shadow-2xl ring-1 ring-white/10 ${device === "mobile" ? "rounded-[2.2rem] ring-8 ring-neutral-800" : "rounded-lg"}`}
        style={{ width: dims.w * scale, height: dims.h * scale }}
      >
        <iframe
          title="Invitation preview"
          src={src}
          style={{ width: dims.w, height: dims.h, transform: `scale(${scale})`, transformOrigin: "0 0", border: 0 }}
          allow="autoplay"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ events */

function EventsEditor({ events, onChange }: { events: EventItem[]; onChange: (e: EventItem[]) => void }) {
  const patch = (i: number, p: Partial<EventItem>) => onChange(events.map((e, j) => (j === i ? { ...e, ...p } : e)));
  const move = (i: number, d: number) => {
    const next = [...events];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="grid gap-4">
      {events.map((ev, i) => (
        <div key={ev.id} className="grid gap-3 rounded-xl border border-white/10 bg-white/[.02] p-4">
          <div className="flex items-center gap-2">
            <input value={ev.title} onChange={(e) => patch(i, { title: e.target.value })} className={`${inputCls} font-semibold`} aria-label="Event title" />
            <button type="button" onClick={() => move(i, -1)} className="rounded-md bg-white/[.06] px-2 py-2 text-xs" aria-label="Move up">
              ↑
            </button>
            <button type="button" onClick={() => move(i, 1)} className="rounded-md bg-white/[.06] px-2 py-2 text-xs" aria-label="Move down">
              ↓
            </button>
            <button type="button" onClick={() => onChange(events.filter((_, j) => j !== i))} className="rounded-md bg-red-500/15 px-2 py-2 text-xs text-red-200" aria-label="Remove event">
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Text label="Date" type="date" value={ev.date} onChange={(v) => patch(i, { date: v })} />
            <Text label="Time" type="time" value={ev.time} onChange={(v) => patch(i, { time: v })} />
          </div>
          <Text label="Venue" value={ev.venue} onChange={(v) => patch(i, { venue: v })} />
          <Text label="Address" value={ev.address} onChange={(v) => patch(i, { address: v })} />
          <Text label="Note" value={ev.note ?? ""} onChange={(v) => patch(i, { note: v })} placeholder="Dress code, parking…" />
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([...events, { id: uid("ev"), title: "New Event", date: events.at(-1)?.date ?? "2027-01-01", time: "18:00", venue: "", address: "" }])
        }
        className="rounded-xl border border-dashed border-white/20 py-3 text-sm text-white/70 hover:border-amber-300/60 hover:text-white"
      >
        + Add event
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ photos */

function PhotosEditor({ data, update }: { data: InvitationData; update: (fn: (d: InvitationData) => InvitationData) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    for (let i = 0; i < list.length; i++) {
      setBusy(`Optimising & uploading ${i + 1}/${list.length}…`);
      try {
        const { blob, width, height } = await compressImage(list[i]);
        const ext = blob.type === "image/webp" ? "webp" : "jpg";
        const { src } = await upload(blob, `photo.${ext}`);
        update((d) => ({ ...d, photos: [...d.photos, { id: uid("ph"), src, width, height, caption: "" }] }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      }
    }
    setBusy(null);
  }

  const photos = data.photos;
  const setPhotos = (p: typeof photos) => update((d) => ({ ...d, photos: p }));
  return (
    <div className="grid gap-3">
      <label className="grid cursor-pointer place-items-center rounded-xl border border-dashed border-white/20 px-4 py-6 text-center text-sm text-white/70 hover:border-amber-300/60">
        <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />
        {busy ?? "Click to add photos (auto-resized to WebP)"}
      </label>
      {error && <p className="text-xs text-red-300">{error}</p>}
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <div key={p.id} className="group relative overflow-hidden rounded-lg border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt="" className="aspect-square w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/70 p-1 text-xs opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
              <button type="button" aria-label="Move left" onClick={() => i > 0 && setPhotos(photos.map((x, j) => (j === i - 1 ? photos[i] : j === i ? photos[i - 1] : x)))}>
                ◀
              </button>
              <button type="button" aria-label="Remove photo" className="text-red-300" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>
                ✕
              </button>
              <button
                type="button"
                aria-label="Move right"
                onClick={() => i < photos.length - 1 && setPhotos(photos.map((x, j) => (j === i + 1 ? photos[i] : j === i ? photos[i + 1] : x)))}
              >
                ▶
              </button>
            </div>
          </div>
        ))}
      </div>
      {photos.length > 0 && (
        <div className="grid gap-2">
          {photos.map((p, i) => (
            <input
              key={p.id}
              value={p.caption ?? ""}
              placeholder={`Caption for photo ${i + 1} (optional)`}
              onChange={(e) => setPhotos(photos.map((x) => (x.id === p.id ? { ...x, caption: e.target.value } : x)))}
              className={inputCls}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- music */

function MusicEditor({ data, update }: { data: InvitationData; update: (fn: (d: InvitationData) => InvitationData) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const music = data.music;
  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { src, name } = await upload(file, file.name);
      update((d) => ({ ...d, music: { ...d.music, src, name } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
    setBusy(false);
  }
  return (
    <div className="grid gap-4">
      <Segmented
        value={music.src ? "custom" : "score"}
        onChange={(v) => v === "score" && update((d) => ({ ...d, music: { ...d.music, src: null, name: undefined } }))}
        options={[
          ["score", "Original score"],
          ["custom", "My own track"],
        ]}
      />
      {!music.src && (
        <p className="text-xs leading-relaxed text-white/50">
          Each template has an original generative score, synthesised in the browser and synced to the opening (gong when the doors open,
          whistle as the train approaches). It&apos;s used in the MP4 export as well.
        </p>
      )}
      <label className="grid cursor-pointer place-items-center rounded-xl border border-dashed border-white/20 px-4 py-5 text-center text-sm text-white/70 hover:border-amber-300/60">
        <input type="file" accept="audio/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        {busy ? "Uploading…" : music.src ? `♪ ${music.name ?? "Custom track"} — click to replace` : "Upload MP3 / M4A / WAV (20MB max)"}
      </label>
      {error && <p className="text-xs text-red-300">{error}</p>}
      {music.src && <audio src={music.src} controls className="w-full" />}
      <Field label={`Volume · ${Math.round(music.volume * 100)}%`}>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={music.volume}
          onChange={(e) => update((d) => ({ ...d, music: { ...d.music, volume: Number(e.target.value) } }))}
          className="accent-amber-300"
        />
      </Field>
      <p className="text-xs text-white/40">The opening&apos;s sound effects play on top of your track. Only upload music you have the rights to use.</p>
    </div>
  );
}

/* ------------------------------------------------------------------- theme */

function ThemeEditor({ data, template, update }: { data: InvitationData; template: TemplateId; update: (fn: (d: InvitationData) => InvitationData) => void }) {
  const current = data.theme[template];
  const setTheme = (preset: string, palette: Palette) => update((d) => ({ ...d, theme: { ...d.theme, [template]: { preset, palette } } }));
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-2">
        {THEME_PRESETS[template].map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setTheme(p.id, p.palette)}
            className={`rounded-xl border p-3 text-left transition ${current.preset === p.id ? "border-amber-300" : "border-white/10 hover:border-white/30"}`}
            style={{ background: `linear-gradient(135deg, ${p.palette.deep}, ${p.palette.base})` }}
          >
            <div className="flex gap-1">
              {[p.palette.secondary, p.palette.accent, p.palette.accentLight, p.palette.ink].map((c) => (
                <span key={c} className="h-4 w-4 rounded-full border border-white/20" style={{ background: c }} />
              ))}
            </div>
            <p className="mt-2 text-xs font-medium" style={{ color: p.palette.accentLight }}>
              {p.name}
            </p>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {PALETTE_KEYS.map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.03] p-2">
            <input
              type="color"
              value={current.palette[key]}
              onChange={(e) => setTheme("custom", { ...current.palette, [key]: e.target.value })}
              className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
            />
            <span className="text-xs text-white/70">{label}</span>
          </label>
        ))}
      </div>
      <p className="text-xs text-white/40">Switch between Nikah and Train at the top to theme each template.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ export */

interface Job {
  id: string;
  status: "queued" | "rendering" | "encoding" | "done" | "error";
  progress: number;
  error?: string;
  template: TemplateId;
  format: string;
}

function ExportPanel({ template, flush }: { template: TemplateId; flush: () => Promise<void> }) {
  const [format, setFormat] = useState<"portrait" | "landscape" | "square">("portrait");
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!job || job.status === "done" || job.status === "error") return;
    const id = setInterval(async () => {
      const res = await fetch(`/api/export/${job.id}`, { cache: "no-store" });
      if (res.ok) setJob(await res.json());
      else {
        setError("Export job was lost (server restarted?)");
        setJob(null);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [job]);

  async function start() {
    setError(null);
    await flush();
    const res = await authedFetch("/api/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ template, format }),
    });
    const json = await res.json();
    if (!res.ok) setError(json.error || "Export failed to start");
    else setJob(json);
  }

  const running = job && job.status !== "done" && job.status !== "error";
  return (
    <div className="grid gap-4">
      <p className="text-xs leading-relaxed text-white/50">
        Renders the {template === "nikah" ? "Nikah" : "Train"} opening frame by frame in headless Chrome at 30fps with the soundtrack, encoded as H.264 MP4. Takes about 1–3 minutes.
      </p>
      <Segmented
        value={format}
        onChange={setFormat}
        options={[
          ["portrait", "9:16 Story"],
          ["square", "1:1"],
          ["landscape", "16:9"],
        ]}
      />
      <button
        type="button"
        disabled={!!running}
        onClick={start}
        className="rounded-xl bg-amber-300 py-3 text-sm font-semibold text-black transition hover:bg-amber-200 disabled:opacity-50"
      >
        {running ? "Rendering…" : "Export MP4"}
      </button>
      {job && (
        <div className="grid gap-2">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-amber-300 transition-all" style={{ width: `${Math.round(job.progress * 100)}%` }} />
          </div>
          <p className="text-xs text-white/60">
            {job.status === "queued" && "Waiting for the renderer…"}
            {job.status === "rendering" && `Rendering frames · ${Math.round(job.progress * 100)}%`}
            {job.status === "encoding" && "Encoding MP4…"}
            {job.status === "error" && <span className="text-red-300">Failed: {job.error}</span>}
            {job.status === "done" && (
              <a href={`/api/export/${job.id}/file`} className="font-semibold text-amber-200 underline">
                ⬇ Download {job.template}-opening-{job.format}.mp4
              </a>
            )}
          </p>
        </div>
      )}
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------- rsvps */

function RsvpList() {
  const [list, setList] = useState<Rsvp[] | null>(null);
  const load = useCallback(async () => {
    const res = await authedFetch("/api/rsvp", { cache: "no-store" });
    if (res.ok) setList(await res.json());
  }, []);
  useEffect(() => {
    let alive = true;
    authedFetch("/api/rsvp", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => alive && j && setList(j));
    return () => {
      alive = false;
    };
  }, []);
  if (!list) return <p className="text-xs text-white/50">Loading…</p>;
  const yes = list.filter((r) => r.attending === "yes");
  const guests = yes.reduce((s, r) => s + r.guests, 0);
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Attending", yes.length],
          ["Guests", guests],
          ["Declined", list.filter((r) => r.attending === "no").length],
        ].map(([l, n]) => (
          <div key={l} className="rounded-lg bg-white/[.05] p-3">
            <p className="text-xl font-semibold">{n}</p>
            <p className="text-[10px] tracking-wide text-white/50 uppercase">{l}</p>
          </div>
        ))}
      </div>
      <button type="button" onClick={load} className="justify-self-start text-xs text-amber-200">
        ↻ Refresh
      </button>
      {list.length === 0 && <p className="text-xs text-white/40">No responses yet.</p>}
      {list.map((r) => (
        <div key={r.id} className="rounded-lg border border-white/10 p-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">{r.name}</span>
            <span className={r.attending === "yes" ? "text-emerald-300" : r.attending === "no" ? "text-red-300" : "text-amber-200"}>
              {r.attending === "yes" ? `Yes · ${r.guests}` : r.attending === "no" ? "No" : `Maybe · ${r.guests}`}
            </span>
          </div>
          {r.events.length > 0 && <p className="mt-1 text-xs text-white/50">{r.events.join(", ")}</p>}
          {r.message && <p className="mt-1 text-xs italic text-white/70">“{r.message}”</p>}
          {r.phone && <p className="mt-1 text-xs text-white/40">{r.phone}</p>}
        </div>
      ))}
    </div>
  );
}
