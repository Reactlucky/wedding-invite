# Ever After Studio — cinematic wedding invitations

Two original, fully animated invitation templates with an editor and MP4 export.

| Route | What it is |
|---|---|
| `/` | Template picker |
| `/nikah` | **Luxury Nikah**: an emerald-and-gold mehrab gateway draws itself in gold, then lanterns descend, the Bismillah reveals right-to-left, carved doors swing open in 3D, the camera flies through the light and the couple's names are revealed |
| `/train` | **Royal Train Journey**: a Three.js sunset station in fog. A steam locomotive (with your monogram) arrives toward the camera and the steam engulfs the screen. Names flip onto a split-flap departure board, then a dramatic date reveal and a stamped boarding ticket |
| `/editor` | Studio: names, date, venue, events, photos, music, colour theme, live preview, MP4 export, RSVP inbox |

URL flags: `?view=invitation` skips straight to the invitation, and `?preview=1` is used by the editor iframe. `?export=1` is the deterministic render mode used by the exporter.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
```

MP4 export needs **Google Chrome/Chromium** and **ffmpeg** on the server. Both are auto-detected; override them with `CHROME_PATH` / `FFMPEG_PATH`. Exporting uses the GPU by default. Set `EXPORT_SOFTWARE_GL=1` on GPU-less servers to force SwiftShader (slower).

Set `EDITOR_TOKEN=…` in production to protect saving, uploads, export and the RSVP list. The editor will prompt for it.

## Architecture

```
src/
  app/                       routes + API (invitation, upload, media, rsvp, export)
  lib/
    cues.ts                  cue sheet (seconds) shared by animation and audio
    audio/score.ts           original generative score + SFX, pure TS DSP (runs in browser worker and Node)
    audio/engine.ts          Web Audio playback (looping bed + synced SFX, mute, custom tracks)
    sync.ts                  data loading + BroadcastChannel live preview
    themes.ts / defaults.ts  palettes and the default invitation
  components/
    shared/
      InvitationExperience   gate → opening → invitation; skip, mute, replay
      useCinematicTimeline   one GSAP master timeline per opening; exposes window.__opening.seek(t) in export mode
      particles.ts           deterministic star / gold-dust / burst particles
      Countdown, Sections (events, map), Gallery (+lightbox), RsvpForm, useReveal (ScrollTrigger)
    nikah/                   SVG mehrab, doors, lanterns, girih patterns, opening, invitation
    train/                   TrainScene.ts (Three.js), split-flap board, ticket, opening, invitation
    editor/                  studio UI
  server/
    store.ts                 file-backed storage in .data/ (swap for a DB + object storage)
    exporter.ts              headless Chrome frame capture → ffmpeg H.264/AAC
```

**Why the export is frame-exact:** nothing in an opening uses its own clock. GSAP tweens, canvas particles, Three.js (train position, wheel rotation, steam puffs, camera shake), split-flap letters and lantern sway are all functions of the master timeline's time. The exporter loads `/<template>?export=1` at a phone-sized viewport with 2× pixel density, then seeks every 1/30s and screenshots. It pipes the frames into ffmpeg together with the score, rendered by the same DSP code in Node.

**Music:** each template ships an original synthesized score (a Hijaz-mode oud, ney and daf for Nikah, and a strings-and-piano bed for Train). Sound effects are placed on the cue sheet: a chime, the door gong, a whoosh and a shimmer for Nikah; chuffs, the whistle, brakes, flaps, a boom and a bell for Train. An uploaded track replaces the score, and the sound effects still play on top.

**Images:** photos are resized and re-encoded to WebP in the browser before upload, then served with immutable caching and lazy-loaded.

## Production notes

- `.data/` (invitation JSON, uploads, RSVPs, exports) must be on persistent disk. On serverless hosts, replace `server/store.ts` with a database and object storage, and run the exporter on a worker with Chrome and ffmpeg.
- It's single-invitation for now. For multi-tenant use, key `store.ts` by a slug and add `/[slug]/nikah`-style routes.
- Only upload music you have the rights to use.
