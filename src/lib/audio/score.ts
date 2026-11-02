/**
 * Original generative score for both templates.
 *
 * Everything is synthesised sample-by-sample in plain TypeScript (no Web Audio
 * nodes), so it runs identically in the browser (live playback) and in Node
 * (MP4 export). Each template produces:
 *   - bed: a seamlessly looping music bed (LOOP_SECONDS long)
 *   - sfx: sound design locked to the opening's cue sheet
 */
import { NIKAH2_CUES, NIKAH_CUES, TRAIN2_CUES, TRAIN_CUES } from "../cues";
import { mulberry32 } from "../random";
import type { TemplateId } from "../types";

export const SAMPLE_RATE = 44100;
export const LOOP_SECONDS = 32;

export interface StereoBuffer {
  sampleRate: number;
  left: Float32Array;
  right: Float32Array;
}

const SR = SAMPLE_RATE;
const TAU = Math.PI * 2;
const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);

function alloc(seconds: number): StereoBuffer {
  const n = Math.ceil(seconds * SR);
  return { sampleRate: SR, left: new Float32Array(n), right: new Float32Array(n) };
}

function panGains(pan: number): [number, number] {
  const p = (pan + 1) * 0.25 * Math.PI; // -1..1 → 0..π/2
  return [Math.cos(p), Math.sin(p)];
}

function write(buf: StereoBuffer, i: number, v: number, gl: number, gr: number) {
  if (i < 0 || i >= buf.left.length) return;
  buf.left[i] += v * gl;
  buf.right[i] += v * gr;
}

/* ------------------------------------------------------------------ voices */

/** Karplus-Strong plucked string (oud / qanun / harp). */
function pluck(
  buf: StereoBuffer,
  start: number,
  freq: number,
  dur: number,
  amp: number,
  pan: number,
  rng: () => number,
  brightness = 0.5,
  decay = 0.996,
) {
  const period = Math.max(2, Math.round(SR / freq));
  const ring = new Float32Array(period);
  let lp = 0;
  for (let i = 0; i < period; i++) {
    const w = rng() * 2 - 1;
    lp = lp + (w - lp) * (0.25 + brightness * 0.7);
    ring[i] = lp;
  }
  const [gl, gr] = panGains(pan);
  const s0 = Math.floor(start * SR);
  const n = Math.floor(dur * SR);
  for (let i = 0; i < n; i++) {
    const k = i % period;
    const next = ring[(k + 1) % period];
    const out = ring[k];
    ring[k] = decay * (out * (0.5 + brightness * 0.3) + next * (0.5 - brightness * 0.3));
    const atk = i < 60 ? i / 60 : 1;
    const rel = i > n - 2000 ? (n - i) / 2000 : 1;
    write(buf, s0 + i, out * amp * atk * rel, gl, gr);
  }
}

interface ToneOpts {
  attack?: number;
  release?: number;
  harmonics?: number[];
  vibrato?: number;
  vibratoRate?: number;
  /** exponential decay rate per second (0 = sustained) */
  decay?: number;
  glide?: number;
}

/** Additive sine tone with envelope, vibrato and optional pitch glide. */
function tone(buf: StereoBuffer, start: number, freq: number, dur: number, amp: number, pan: number, o: ToneOpts = {}) {
  const { attack = 0.01, release = 0.2, harmonics = [1], vibrato = 0, vibratoRate = 5, decay = 0, glide = 0 } = o;
  const [gl, gr] = panGains(pan);
  const s0 = Math.floor(start * SR);
  const n = Math.floor(dur * SR);
  const phases = new Float64Array(harmonics.length);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(1, t / attack) * Math.min(1, (dur - t) / release) * (decay ? Math.exp(-decay * t) : 1);
    const f = freq * (1 + glide * Math.exp(-t * 6)) * (1 + vibrato * Math.sin(TAU * vibratoRate * t) * Math.min(1, t / 0.6));
    let v = 0;
    for (let h = 0; h < harmonics.length; h++) {
      phases[h] += (TAU * f * (h + 1)) / SR;
      v += Math.sin(phases[h]) * harmonics[h];
    }
    write(buf, s0 + i, v * amp * env, gl, gr);
  }
}

/** Two detuned saws through a one-pole low-pass — warm string/brass pad. */
function pad(buf: StereoBuffer, start: number, freq: number, dur: number, amp: number, pan: number, cutoff = 900) {
  const [gl, gr] = panGains(pan);
  const s0 = Math.floor(start * SR);
  const n = Math.floor(dur * SR);
  const a = 1 - Math.exp((-TAU * cutoff) / SR);
  let p1 = 0,
    p2 = 0.37,
    lp1 = 0,
    lp2 = 0;
  const attack = Math.min(1.6, dur * 0.4);
  const release = Math.min(2.2, dur * 0.45);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    p1 = (p1 + (freq * 1.0035) / SR) % 1;
    p2 = (p2 + (freq * 0.9965) / SR) % 1;
    const raw = (p1 * 2 - 1 + (p2 * 2 - 1)) * 0.5;
    lp1 += (raw - lp1) * a;
    lp2 += (lp1 - lp2) * a;
    const env = Math.min(1, t / attack) * Math.min(1, (dur - t) / release);
    const swell = 0.85 + 0.15 * Math.sin(TAU * 0.18 * t);
    write(buf, s0 + i, lp2 * amp * env * swell, gl, gr);
  }
}

interface NoiseOpts {
  attack?: number;
  release?: number;
  /** low-pass cutoff start/end (Hz) */
  lpFrom?: number;
  lpTo?: number;
  /** high-pass cutoff (Hz) */
  hp?: number;
  shape?: (t: number) => number;
}

function noise(buf: StereoBuffer, start: number, dur: number, amp: number, pan: number, rng: () => number, o: NoiseOpts = {}) {
  const { attack = 0.005, release = 0.05, lpFrom = 4000, lpTo = lpFrom, hp = 0, shape } = o;
  const [gl, gr] = panGains(pan);
  const s0 = Math.floor(start * SR);
  const n = Math.floor(dur * SR);
  const hpA = hp ? 1 - Math.exp((-TAU * hp) / SR) : 0;
  let lp = 0,
    lp2 = 0,
    hpLp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const k = n > 1 ? i / (n - 1) : 0;
    const cut = lpFrom + (lpTo - lpFrom) * k;
    const a = 1 - Math.exp((-TAU * cut) / SR);
    lp += (rng() * 2 - 1 - lp) * a;
    lp2 += (lp - lp2) * a;
    let v = lp2;
    if (hpA) {
      hpLp += (v - hpLp) * hpA;
      v -= hpLp;
    }
    const env = Math.min(1, t / attack) * Math.min(1, Math.max(0, (dur - t) / release)) * (shape ? shape(k) : 1);
    write(buf, s0 + i, v * amp * env, gl, gr);
  }
}

/* --------------------------------------------------------------- processing */

/** Schroeder reverb: 4 parallel damped combs + 2 allpasses per channel. */
function reverb(buf: StereoBuffer, wet: number, size = 1) {
  const n = buf.left.length;
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) mono[i] = (buf.left[i] + buf.right[i]) * 0.5;
  const run = (offset: number) => {
    const out = new Float32Array(n);
    for (const d0 of [1557, 1617, 1491, 1422]) {
      const d = Math.round((d0 + offset) * size);
      const line = new Float32Array(d);
      let idx = 0,
        filt = 0;
      for (let i = 0; i < n; i++) {
        const y = line[idx];
        filt = y * 0.75 + filt * 0.25;
        line[idx] = mono[i] + filt * 0.85;
        idx = (idx + 1) % d;
        out[i] += y * 0.25;
      }
    }
    for (const d0 of [556, 225]) {
      const d = d0 + offset;
      const line = new Float32Array(d);
      let idx = 0;
      for (let i = 0; i < n; i++) {
        const b = line[idx];
        const x = out[i];
        const y = -x * 0.5 + b;
        line[idx] = x + b * 0.5;
        idx = (idx + 1) % d;
        out[i] = y;
      }
    }
    return out;
  };
  const l = run(0);
  const r = run(23);
  for (let i = 0; i < n; i++) {
    buf.left[i] += l[i] * wet;
    buf.right[i] += r[i] * wet;
  }
}

/** Fold everything past `seconds` back onto the start so the buffer loops seamlessly. */
function wrap(buf: StereoBuffer, seconds: number): StereoBuffer {
  const n = Math.floor(seconds * SR);
  const out = alloc(seconds);
  for (let i = 0; i < buf.left.length; i++) {
    out.left[i % n] += buf.left[i];
    out.right[i % n] += buf.right[i];
  }
  return out;
}

function normalize(buf: StereoBuffer, peak = 0.88) {
  let m = 1e-6;
  for (let i = 0; i < buf.left.length; i++) m = Math.max(m, Math.abs(buf.left[i]), Math.abs(buf.right[i]));
  const g = peak / m;
  for (let i = 0; i < buf.left.length; i++) {
    buf.left[i] *= g;
    buf.right[i] *= g;
  }
}

function softClip(buf: StereoBuffer) {
  for (let i = 0; i < buf.left.length; i++) {
    buf.left[i] = Math.tanh(buf.left[i]);
    buf.right[i] = Math.tanh(buf.right[i]);
  }
}

/* -------------------------------------------------------------------- nikah */

const HIJAZ = [0, 1, 4, 5, 7, 8, 10, 12, 13, 16, 17, 19];

function nikahBed(): StereoBuffer {
  const L = LOOP_SECONDS;
  const buf = alloc(L + 6);
  const rng = mulberry32(7);
  const beat = 0.8; // 75 bpm

  // Drone on D with a slow, loop-aligned swell
  for (const [f, a, p] of [
    [mtof(38), 0.11, -0.2],
    [mtof(45), 0.07, 0.25],
    [mtof(50), 0.03, 0],
  ] as const) {
    const [gl, gr] = panGains(p);
    let ph = 0;
    for (let i = 0; i < L * SR; i++) {
      const t = i / SR;
      ph += (TAU * f) / SR;
      const swell = 0.7 + 0.3 * Math.sin((TAU * t) / 16);
      const v = (Math.sin(ph) + 0.35 * Math.sin(ph * 2) + 0.12 * Math.sin(ph * 3)) * a * swell;
      write(buf, i, v, gl, gr);
    }
  }

  // Oud-like melody: phrase-based walk through Hijaz on D3, with tremolo on long notes
  const root = 50;
  const phrases = [
    [0, 1, 4, 5, 4, 1, 0, -1],
    [4, 5, 7, 8, 7, 5, 4, 1],
    [7, 8, 10, 12, 10, 8, 7, 5],
    [4, 5, 4, 1, 0, 1, 0, -1],
  ];
  let t = 0;
  for (let rep = 0; rep < 2; rep++) {
    for (const phrase of phrases) {
      for (let k = 0; k < phrase.length; k++) {
        const degree = phrase[k];
        if (degree < 0) {
          t += beat;
          continue;
        }
        // phrases are written as semitone offsets that all belong to Hijaz on D
        const midi = root + 12 + degree;
        const f = mtof(midi);
        const long = k === phrase.length - 2;
        if (long) {
          for (let r = 0; r < 6; r++) pluck(buf, t + r * 0.11, f, 0.6, 0.11 * (1 - r * 0.08), -0.15, rng, 0.45);
        } else {
          pluck(buf, t, f, 2.2, 0.2, -0.15, rng, 0.45);
          if (rng() < 0.35) pluck(buf, t + beat / 2, mtof(midi - 12), 1.6, 0.09, -0.3, rng, 0.35);
        }
        // occasional qanun sparkle an octave up
        if (rng() < 0.22) pluck(buf, t + beat * 0.5, mtof(midi + 12), 1.4, 0.06, 0.45, rng, 0.85, 0.997);
        t += beat;
      }
    }
  }

  // Ney-like breathy long tones
  const neyNotes = [62, 69, 67, 66];
  neyNotes.forEach((m, i) => {
    tone(buf, i * 8 + 0.5, mtof(m), 6.5, 0.035, 0.3, {
      attack: 1.2,
      release: 2,
      harmonics: [1, 0.25, 0.08],
      vibrato: 0.006,
      vibratoRate: 4.6,
    });
    noise(buf, i * 8 + 0.5, 6.5, 0.012, 0.3, rng, { attack: 1.2, release: 2, lpFrom: 2400, hp: 900 });
  });

  // Soft daf (frame drum): low thump + slap, 4-beat cycle
  for (let b = 0; b < L / beat; b++) {
    const bt = b * beat;
    const pos = b % 4;
    if (pos === 0 || pos === 2) {
      tone(buf, bt, 70, 0.5, pos === 0 ? 0.16 : 0.1, 0, { attack: 0.002, release: 0.1, decay: 9, glide: 0.6 });
      noise(buf, bt, 0.12, 0.05, 0, rng, { lpFrom: 900, release: 0.1 });
    } else if (pos === 3) {
      noise(buf, bt + beat / 2, 0.08, 0.035, 0.2, rng, { lpFrom: 5000, hp: 1500, release: 0.07 });
    }
  }

  reverb(buf, 0.38, 1.1);
  const out = wrap(buf, L);
  normalize(out, 0.7);
  return out;
}

function nikahSfx(): StereoBuffer {
  const C = NIKAH_CUES;
  const buf = alloc(C.duration + 4);
  const rng = mulberry32(11);

  // Low atmospheric swell under the sky reveal
  noise(buf, 0, 4.5, 0.12, 0, rng, { attack: 2.5, release: 2, lpFrom: 300, lpTo: 600 });

  // Magical chime when the crescent appears
  [74, 79, 81, 86].forEach((m, i) =>
    tone(buf, C.skyIn + 0.6 + i * 0.16, mtof(m), 3, 0.05, -0.4 + i * 0.25, { attack: 0.004, release: 1.2, decay: 1.4, harmonics: [1, 0, 0.3] }),
  );

  // Door rumble + great gong when the golden doors open
  noise(buf, C.doorsOpen - 0.1, 1.9, 0.22, 0, rng, { attack: 0.3, release: 0.8, lpFrom: 180, lpTo: 120 });
  [55, 82.5, 110.7, 148.3, 196.9, 262.1, 331.4].forEach((f, i) =>
    tone(buf, C.doorsOpen, f, 6.5, 0.16 / (1 + i * 0.6), (i % 2 ? 0.2 : -0.2), {
      attack: 0.006,
      release: 2.5,
      decay: 0.5 + i * 0.15,
      glide: -0.015,
    }),
  );

  // Whoosh through the doorway, peaking at the flash
  noise(buf, C.flythrough, C.flash - C.flythrough + 0.8, 0.3, 0, rng, {
    attack: 0.05,
    release: 0.7,
    lpFrom: 300,
    lpTo: 6000,
    shape: (k) => Math.pow(k, 2.2),
  });

  // Shimmer glissando into the names
  for (let i = 0; i < 14; i++) {
    const m = 62 + 12 + HIJAZ[i % HIJAZ.length] + (i >= HIJAZ.length ? 12 : 0);
    tone(buf, C.flash - 0.15 + i * 0.055, mtof(m), 2.6, 0.045, -0.6 + (i / 14) * 1.2, {
      attack: 0.003,
      release: 1.2,
      decay: 1.5,
      harmonics: [1, 0, 0.25],
    });
  }
  // A warm resolving chord under the names
  [50, 57, 62, 66].forEach((m, i) => pad(buf, C.names, mtof(m), 5, 0.05, -0.3 + i * 0.2, 1200));

  // Bell as the date appears
  tone(buf, C.date, mtof(86), 3.5, 0.06, 0.2, { attack: 0.003, release: 1.5, decay: 1.1, harmonics: [1, 0, 0.4, 0, 0.15] });

  reverb(buf, 0.45, 1.2);
  softClip(buf);
  return buf;
}

/* -------------------------------------------------------------------- train */

function trainBed(): StereoBuffer {
  const L = LOOP_SECONDS;
  const buf = alloc(L + 6);
  const rng = mulberry32(21);
  // D – Bm – G – A, 8 seconds each
  const chords = [
    [50, 54, 57, 62],
    [47, 54, 59, 62],
    [43, 55, 59, 62],
    [45, 52, 57, 61],
  ];
  chords.forEach((c, i) => {
    const t0 = i * 8;
    c.forEach((m, v) => pad(buf, t0, mtof(m), 9.5, v === 0 ? 0.11 : 0.07, -0.5 + v * 0.33, 800 + v * 150));
    pad(buf, t0, mtof(c[0] - 12), 9.5, 0.08, 0, 300);
    // piano-ish arpeggio
    const arp = [c[1] + 12, c[2] + 12, c[3] + 12, c[2] + 12];
    for (let k = 0; k < 16; k++) {
      const m = arp[k % arp.length] + (k >= 8 && k % 4 === 2 ? 12 : 0);
      tone(buf, t0 + k * 0.5, mtof(m), 2.2, 0.05, (k % 2 ? 0.35 : -0.35), {
        attack: 0.004,
        release: 0.8,
        decay: 2.2,
        harmonics: [1, 0.4, 0.15, 0.06],
      });
    }
  });
  // a gentle melodic line on top, second half only
  const melody = [74, 76, 78, 81, 79, 78, 76, 74];
  melody.forEach((m, i) =>
    tone(buf, 16 + i * 2, mtof(m), 2.4, 0.04, 0.1, { attack: 0.3, release: 0.9, vibrato: 0.005, harmonics: [1, 0.3, 0.1] }),
  );
  void rng;
  reverb(buf, 0.32, 1.25);
  const out = wrap(buf, L);
  normalize(out, 0.7);
  return out;
}

function trainSfx(): StereoBuffer {
  const C = TRAIN_CUES;
  const buf = alloc(C.duration + 4);
  const rng = mulberry32(31);

  // Evening wind across the platform
  noise(buf, 0, C.duration, 0.07, 0, rng, { attack: 1.5, release: 2, lpFrom: 500, lpTo: 700 });

  // Locomotive chuffs and rail clatter, louder as it approaches
  const span = C.approachEnd - C.approachStart;
  let tt = C.approachStart;
  let k = 0;
  while (tt < C.approachEnd + 0.6) {
    const p = Math.min(1, (tt - C.approachStart) / span);
    const g = 0.04 + 0.5 * p * p;
    const accent = k % 4 === 0 ? 1.25 : 1;
    noise(buf, tt, 0.16, g * accent, (p - 0.5) * 0.4, rng, { attack: 0.01, release: 0.14, lpFrom: 900 + p * 1600, hp: 120 });
    if (k % 3 === 1) {
      noise(buf, tt + 0.06, 0.03, g * 0.6, 0.3, rng, { lpFrom: 6000, hp: 2000, release: 0.03 });
      noise(buf, tt + 0.16, 0.03, g * 0.5, -0.3, rng, { lpFrom: 6000, hp: 2000, release: 0.03 });
    }
    tt += 0.3 - p * 0.04;
    k++;
  }
  // Low engine rumble
  noise(buf, C.approachStart, span + 1.4, 0.25, 0, rng, {
    attack: 3,
    release: 1.2,
    lpFrom: 90,
    lpTo: 220,
    shape: (x) => x * x,
  });

  // Steam whistle: a breathy three-note chord with a pitch scoop
  const whistle = (t0: number, dur: number, amp: number) => {
    [466.2, 587.3, 698.5].forEach((f, i) =>
      tone(buf, t0, f, dur, amp, -0.2 + i * 0.2, { attack: 0.12, release: 0.35, glide: -0.04, vibrato: 0.004, vibratoRate: 6, harmonics: [1, 0.3, 0.12] }),
    );
    noise(buf, t0, dur, amp * 0.6, 0, rng, { attack: 0.08, release: 0.3, lpFrom: 3000, hp: 800 });
  };
  whistle(C.whistle, 1.7, 0.07);
  whistle(C.whistle + 2.4, 0.55, 0.1);

  // Steam blast / brakes as the engine engulfs the camera
  noise(buf, C.steamEngulf - 0.3, 2.6, 0.32, 0, rng, { attack: 0.25, release: 1.6, lpFrom: 7000, lpTo: 2500, hp: 500 });
  tone(buf, C.steamEngulf, 2100, 1.6, 0.02, 0, { attack: 0.2, release: 0.9, glide: 0.05 });

  // Split-flap departure board clatter, settling
  const flapRng = mulberry32(5);
  for (let t = C.flaps; t < C.flaps + 1.8; ) {
    const p = (t - C.flaps) / 1.8;
    noise(buf, t, 0.012, 0.18 * (1 - p * 0.7), flapRng() * 1.4 - 0.7, rng, { lpFrom: 7000, hp: 1800, release: 0.01 });
    t += 0.018 + p * p * 0.12 + flapRng() * 0.02;
  }

  // Cinematic boom on the date reveal
  tone(buf, C.dateReveal, 55, 3.5, 0.45, 0, { attack: 0.004, release: 1.5, decay: 1.2, glide: 0.8 });
  noise(buf, C.dateReveal, 1.2, 0.3, 0, rng, { attack: 0.002, release: 1, lpFrom: 1600, lpTo: 200 });
  [62, 66, 69, 74].forEach((m, i) => pad(buf, C.dateReveal, mtof(m), 3.5, 0.05, -0.4 + i * 0.27, 1500));

  // Station bell when the ticket lands
  [1318.5, 2637].forEach((f, i) => tone(buf, C.ticket + 0.35, f, 2.2, i ? 0.03 : 0.06, 0.3, { attack: 0.002, release: 1, decay: 2 }));

  reverb(buf, 0.3, 1.4);
  softClip(buf);
  return buf;
}

/* ----------------------------------------------------------------------- v2 */

/** Reedy double-reed lead (shehnai-like): bright harmonics, vibrato, meend glide from the previous note. */
function reed(buf: StereoBuffer, start: number, freq: number, dur: number, amp: number, pan: number, from = freq) {
  const [gl, gr] = panGains(pan);
  const s0 = Math.floor(start * SR);
  const n = Math.floor(dur * SR);
  const harm = [1, 0.75, 0.6, 0.42, 0.3, 0.2, 0.12, 0.07];
  const ph = new Float64Array(harm.length);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const glide = Math.min(1, t / 0.09);
    const f = (from + (freq - from) * glide) * (1 + 0.011 * Math.sin(TAU * 5.6 * t) * Math.min(1, t / 0.25));
    const env = Math.min(1, t / 0.04) * Math.min(1, (dur - t) / 0.08);
    let v = 0;
    for (let h = 0; h < harm.length; h++) {
      ph[h] += (TAU * f * (h + 1)) / SR;
      v += Math.sin(ph[h]) * harm[h];
    }
    write(buf, s0 + i, v * amp * env * 0.35, gl, gr);
  }
}

function dholak(buf: StereoBuffer, t: number, kind: "dha" | "na" | "ge" | "ti", amp: number, rng: () => number) {
  if (kind === "dha" || kind === "ge") tone(buf, t, kind === "dha" ? 95 : 120, 0.4, amp, -0.1, { attack: 0.002, release: 0.1, decay: 8, glide: 0.5 });
  if (kind === "dha" || kind === "na") tone(buf, t, 340, 0.18, amp * 0.5, 0.15, { attack: 0.001, release: 0.06, decay: 22, harmonics: [1, 0.4, 0.2] });
  noise(buf, t, kind === "ti" ? 0.04 : 0.07, amp * (kind === "ti" ? 0.35 : 0.22), 0.1, rng, { lpFrom: kind === "ti" ? 7000 : 2500, hp: kind === "ti" ? 2500 : 300, release: 0.05 });
}

function tanpura(buf: StereoBuffer, L: number, root: number, rng: () => number) {
  const notes = [root - 5, root, root, root - 12];
  for (let t = 0, k = 0; t < L; t += 0.95, k++) pluck(buf, t, mtof(notes[k % 4]), 3, 0.06, (k % 2 ? 0.3 : -0.3), rng, 0.6, 0.9985);
}

function train2Bed(): StereoBuffer {
  const L = LOOP_SECONDS;
  const buf = alloc(L + 6);
  const rng = mulberry32(51);
  tanpura(buf, L, 50, rng);
  // dholak: 120 bpm, 8th-note groove
  const groove: ("dha" | "na" | "ge" | "ti" | null)[] = ["dha", "ti", "na", "ge", "dha", "ti", "na", "ti"];
  for (let i = 0; i < L / 0.25; i++) {
    const k = groove[i % groove.length];
    if (k) dholak(buf, i * 0.25, k, i % 8 === 0 ? 0.16 : 0.1, rng);
  }
  // shehnai melody in Khamaj on D (D E F# G A B C D)
  const D4 = 62;
  const scale = [0, 2, 4, 5, 7, 9, 10, 12, 14];
  const phrases = [
    [4, 5, 6, 5, 4, 3, 2, 3],
    [4, 4, 5, 7, 6, 5, 4, 2],
    [2, 3, 4, 5, 4, 3, 1, 0],
    [7, 8, 7, 6, 5, 4, 3, 4],
  ];
  let t = 0.5;
  let prev = mtof(D4);
  for (let rep = 0; rep < 2; rep++) {
    for (const ph of phrases) {
      for (let k = 0; k < ph.length; k++) {
        const f = mtof(D4 + scale[ph[k]]);
        const dur = k === ph.length - 1 ? 1.4 : 0.42;
        reed(buf, t, f, dur, 0.08, 0.1, prev);
        prev = f;
        t += k === ph.length - 1 ? 1.5 : 0.5;
      }
      t += 0.0;
    }
  }
  // soft harmonium pad underneath
  [[50, 54, 57], [48, 55, 60], [55, 59, 62], [57, 61, 64]].forEach((c, i) =>
    c.forEach((m, v) => pad(buf, i * 8, mtof(m), 9, 0.03, -0.3 + v * 0.3, 1100)),
  );
  reverb(buf, 0.22, 1);
  const out = wrap(buf, L);
  normalize(out, 0.7);
  return out;
}

function train2Sfx(omit: string[] = []): StereoBuffer {
  const C = TRAIN2_CUES;
  const buf = alloc(C.duration + 4);
  const rng = mulberry32(61);
  // three-tone station chime before the announcement
  if (!omit.includes("chime"))
    [76, 72, 67].forEach((m, i) =>
      tone(buf, C.chime + i * 0.38, mtof(m), 2.2, 0.12, 0, { attack: 0.003, release: 1, decay: 1.6, harmonics: [1, 0, 0.35, 0, 0.12] }),
    );
  // electric locomotive horn
  const horn = (t0: number, dur: number, amp: number) => {
    [330, 415.3].forEach((f, i) =>
      tone(buf, t0, f, dur, amp, i ? 0.4 : 0.2, { attack: 0.06, release: 0.2, harmonics: [1, 0.6, 0.45, 0.3, 0.2, 0.1], vibrato: 0.002 }),
    );
  };
  if (!omit.includes("horn")) {
    horn(C.horn, 1.3, 0.07);
    horn(C.horn + 1.7, 0.45, 0.08);
  }
  // rail joints: clickety-clack, slowing as the train brakes
  let t = C.enter + 0.3;
  while (t < C.stop) {
    const p = (t - C.enter) / (C.stop - C.enter);
    const g = 0.2 * Math.min(1, (t - C.enter) * 1.5) * (1 - p * 0.5);
    noise(buf, t, 0.035, g, 0.2, rng, { lpFrom: 3500, hp: 600, release: 0.03 });
    noise(buf, t + 0.09 + p * 0.1, 0.035, g * 0.8, -0.2, rng, { lpFrom: 3500, hp: 600, release: 0.03 });
    t += 0.32 + p * p * 0.9;
  }
  // brake squeal + air release at the stop
  tone(buf, C.stop - 1.6, 2350, 1.7, 0.012, 0.3, { attack: 0.4, release: 0.5, vibrato: 0.01, vibratoRate: 9 });
  noise(buf, C.stop, 1.2, 0.18, 0, rng, { attack: 0.02, release: 0.9, lpFrom: 6000, hp: 1500 });
  // sliding door + light swell
  noise(buf, C.doorOpen, 0.6, 0.12, 0, rng, { attack: 0.05, release: 0.3, lpFrom: 1200, lpTo: 2600 });
  noise(buf, C.flood - 0.4, 1.4, 0.18, 0, rng, { attack: 0.1, release: 0.6, lpFrom: 400, lpTo: 7000, shape: (k) => k * k });
  for (let i = 0; i < 10; i++)
    tone(buf, C.flood + i * 0.06, mtof(74 + [0, 2, 4, 7, 9, 12, 14, 16, 19, 21][i]), 2, 0.035, -0.5 + i * 0.1, { attack: 0.003, release: 1, decay: 1.6 });
  // confetti pop + dholak flourish as the sign drops
  noise(buf, C.hero, 0.25, 0.25, 0, rng, { lpFrom: 5000, hp: 800, release: 0.2 });
  (["dha", "na", "dha", "dha"] as const).forEach((k, i) => dholak(buf, C.sign + i * 0.13, k, 0.22, rng));
  tone(buf, C.date, mtof(81), 2.5, 0.06, 0.2, { attack: 0.003, release: 1.2, decay: 1.4, harmonics: [1, 0, 0.3] });
  reverb(buf, 0.25, 1.1);
  softClip(buf);
  return buf;
}

function nikah2Bed(): StereoBuffer {
  const L = LOOP_SECONDS;
  const buf = alloc(L + 6);
  const rng = mulberry32(71);
  // harmonium chords (reedy pads), 4 s each: Dm  Gm  C  F | Bb  Gm  A  Dm
  const chords = [
    [50, 53, 57], [55, 58, 62], [48, 52, 55], [53, 57, 60],
    [46, 50, 53], [55, 58, 62], [57, 61, 64], [50, 53, 57],
  ];
  chords.forEach((c, i) => c.forEach((m, v) => pad(buf, i * 4, mtof(m), 5, 0.045, -0.3 + v * 0.3, 1300)));
  // rubab-like plucked arpeggios
  chords.forEach((c, i) => {
    const arp = [c[0] + 12, c[1] + 12, c[2] + 12, c[1] + 12, c[2] + 12, c[0] + 24, c[2] + 12, c[1] + 12];
    arp.forEach((m, k) => pluck(buf, i * 4 + k * 0.5, mtof(m), 1.6, 0.12, k % 2 ? 0.35 : -0.25, rng, 0.55));
  });
  // soft daf
  for (let b = 0; b < L / 0.5; b++) {
    if (b % 4 === 0) tone(buf, b * 0.5, 72, 0.4, 0.1, 0, { attack: 0.002, release: 0.1, decay: 9, glide: 0.5 });
    if (b % 4 === 3) noise(buf, b * 0.5 + 0.25, 0.06, 0.03, 0.2, rng, { lpFrom: 5000, hp: 1500, release: 0.05 });
  }
  reverb(buf, 0.35, 1.1);
  const out = wrap(buf, L);
  normalize(out, 0.68);
  return out;
}

function nikah2Sfx(): StereoBuffer {
  const C = NIKAH2_CUES;
  const buf = alloc(C.duration + 4);
  const rng = mulberry32(81);
  noise(buf, 0, C.duration, 0.04, 0, rng, { attack: 1.5, release: 2, lpFrom: 700 });
  [79, 83, 86, 91].forEach((m, i) =>
    tone(buf, C.chime + i * 0.14, mtof(m), 2.4, 0.05, -0.4 + i * 0.25, { attack: 0.003, release: 1.2, decay: 1.5, harmonics: [1, 0, 0.3] }),
  );
  // wind chimes drifting during the courtyard pan
  const cr = mulberry32(9);
  for (let t = C.pan; t < C.panEnd; t += 0.35 + cr() * 0.6) {
    tone(buf, t, mtof(84 + [0, 3, 5, 7, 10, 12][Math.floor(cr() * 6)]), 1.8, 0.022, cr() * 1.6 - 0.8, { attack: 0.002, release: 1, decay: 2 });
  }
  noise(buf, C.pan, C.panEnd - C.pan, 0.06, 0, rng, { attack: 1.5, release: 1.5, lpFrom: 500, lpTo: 900 });
  // doors: wooden thud + soft gong
  noise(buf, C.doorsOpen, 0.5, 0.15, 0, rng, { attack: 0.01, release: 0.4, lpFrom: 300 });
  [65, 98, 131.5, 177].forEach((f, i) => tone(buf, C.doorsOpen + 0.1, f, 4.5, 0.09 / (1 + i * 0.6), 0, { attack: 0.006, release: 2, decay: 0.7 + i * 0.2 }));
  noise(buf, C.flood - 0.5, 1.5, 0.16, 0, rng, { attack: 0.1, release: 0.6, lpFrom: 400, lpTo: 6500, shape: (k) => k * k });
  for (let i = 0; i < 12; i++)
    tone(buf, C.flood + i * 0.05, mtof(74 + HIJAZ[i % HIJAZ.length]), 2.2, 0.035, -0.6 + i * 0.1, { attack: 0.003, release: 1, decay: 1.5 });
  tone(buf, C.date, mtof(86), 3, 0.06, 0.2, { attack: 0.003, release: 1.4, decay: 1.1, harmonics: [1, 0, 0.4] });
  reverb(buf, 0.4, 1.2);
  softClip(buf);
  return buf;
}

/* --------------------------------------------------------------------- api */

const cache = new Map<string, StereoBuffer>();
const BEDS: Record<TemplateId, () => StereoBuffer> = { nikah: nikahBed, train: trainBed, nikah2: nikah2Bed, train2: train2Bed };
const SFX: Record<TemplateId, (omit: string[]) => StereoBuffer> = {
  nikah: nikahSfx,
  train: trainSfx,
  nikah2: nikah2Sfx,
  train2: train2Sfx,
};

export function renderBed(template: TemplateId): StereoBuffer {
  const key = `bed:${template}`;
  if (!cache.has(key)) cache.set(key, BEDS[template]());
  return cache.get(key)!;
}

/** @param omit synthesized parts replaced by uploaded sounds (e.g. "horn") */
export function renderSfx(template: TemplateId, omit: string[] = []): StereoBuffer {
  const key = `sfx:${template}:${[...omit].sort().join(",")}`;
  if (!cache.has(key)) cache.set(key, SFX[template](omit));
  return cache.get(key)!;
}

/** Bed (looped) + sfx mixed down to `seconds`, with a fade-out tail. Used for the MP4 soundtrack. */
export function renderOpeningMix(template: TemplateId, seconds: number, includeBed = true, bedGain = 0.7, omit: string[] = []): StereoBuffer {
  const out = alloc(seconds);
  const bed = renderBed(template);
  const sfx = renderSfx(template, omit);
  const n = out.left.length;
  const fade = Math.floor(1.2 * SR);
  for (let i = 0; i < n; i++) {
    const b = i % bed.left.length;
    let l = (includeBed ? bed.left[b] * bedGain : 0) + (i < sfx.left.length ? sfx.left[i] : 0);
    let r = (includeBed ? bed.right[b] * bedGain : 0) + (i < sfx.right.length ? sfx.right[i] : 0);
    const g = i > n - fade ? (n - i) / fade : 1;
    l *= g;
    r *= g;
    out.left[i] = Math.tanh(l);
    out.right[i] = Math.tanh(r);
  }
  return out;
}

export function encodeWav(buf: StereoBuffer): Uint8Array {
  const n = buf.left.length;
  const bytes = new Uint8Array(44 + n * 4);
  const view = new DataView(bytes.buffer);
  const str = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  view.setUint32(4, 36 + n * 4, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, buf.sampleRate, true);
  view.setUint32(28, buf.sampleRate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, n * 4, true);
  let o = 44;
  for (let i = 0; i < n; i++) {
    view.setInt16(o, Math.max(-1, Math.min(1, buf.left[i])) * 0x7fff, true);
    view.setInt16(o + 2, Math.max(-1, Math.min(1, buf.right[i])) * 0x7fff, true);
    o += 4;
  }
  return bytes;
}
