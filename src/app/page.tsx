import Link from "next/link";

const templates = [
  {
    href: "/nikah",
    name: "Luxury Nikah",
    blurb: "A mehrab gateway draws itself in gold, then lanterns descend and carved doors swing open into light.",
    palette: ["#03201a", "#0a3b2c", "#c9a24a", "#f1d892"],
    bg: "radial-gradient(90% 70% at 50% 100%, #0f5038, #03201a 70%)",
    accent: "#f1d892",
  },
  {
    href: "/train",
    name: "Royal Train Journey",
    blurb: "A steam locomotive comes out of the sunset fog, and your names flip onto the station's departure board.",
    palette: ["#160a08", "#7a2e1a", "#c8963e", "#ffb35c"],
    bg: "linear-gradient(to bottom, #160a08, #7a2e1a 60%, #ffb35c)",
    accent: "#ffb35c",
  },
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-[#0b0a09] px-5 py-16 text-[#f5efe3] sm:px-10">
      <div className="mx-auto max-w-5xl">
        <p className="font-display text-[11px] tracking-[0.5em] text-[#c9a24a] uppercase">Ever After Studio</p>
        <h1 className="mt-4 font-serif text-5xl font-light italic leading-tight sm:text-7xl">Cinematic wedding invitations</h1>
        <p className="mt-5 max-w-2xl text-lg text-white/60">
          Two original templates with animated openings, an original score, live countdown, events, maps, a gallery and RSVP. Edit
          everything in the studio and export the opening as an MP4.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/editor" className="rounded-full bg-[#c9a24a] px-6 py-3 font-display text-xs tracking-[0.3em] text-black uppercase">
            Open the editor
          </Link>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {templates.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group relative overflow-hidden rounded-3xl border border-white/10 p-8 transition duration-500 hover:-translate-y-1 hover:border-white/30"
              style={{ background: t.bg, minHeight: 360 }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="relative flex h-full min-h-[300px] flex-col justify-end">
                <div className="mb-4 flex gap-2">
                  {t.palette.map((c) => (
                    <span key={c} className="h-4 w-4 rounded-full border border-white/20" style={{ background: c }} />
                  ))}
                </div>
                <h2 className="font-serif text-4xl italic" style={{ color: t.accent }}>
                  {t.name}
                </h2>
                <p className="mt-3 text-white/75">{t.blurb}</p>
                <p className="mt-6 font-display text-[11px] tracking-[0.35em] text-white/80 uppercase">
                  Preview {t.href} <span className="inline-block transition group-hover:translate-x-1">→</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
