"use client";

import type { ResolvedSounds } from "../sounds";
import type { TemplateId } from "../types";

interface Rendered {
  sampleRate: number;
  bed: [Float32Array, Float32Array];
  sfx: [Float32Array, Float32Array];
}

const renders = new Map<string, Promise<Rendered>>();

/** Render the template's score off the main thread (cached per template + omitted parts). */
function renderInWorker(template: TemplateId, omit: string[]): Promise<Rendered> {
  const key = `${template}|${[...omit].sort().join(",")}`;
  if (!renders.has(key)) {
    renders.set(
      key,
      new Promise<Rendered>((resolve, reject) => {
        const worker = new Worker(new URL("./score.worker.ts", import.meta.url), { type: "module" });
        worker.onmessage = (e) => {
          resolve(e.data as Rendered);
          worker.terminate();
        };
        worker.onerror = (e) => {
          renders.delete(key);
          reject(e);
          worker.terminate();
        };
        worker.postMessage({ template, omit });
      }),
    );
  }
  return renders.get(key)!;
}

const sampleCache = new Map<string, Promise<ArrayBuffer>>();
function fetchSample(src: string) {
  if (!sampleCache.has(src)) {
    sampleCache.set(
      src,
      fetch(src).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.arrayBuffer();
      }),
    );
  }
  return sampleCache.get(src)!;
}

function toBuffer(ctx: AudioContext, sampleRate: number, [l, r]: [Float32Array, Float32Array]) {
  const b = ctx.createBuffer(2, l.length, sampleRate);
  b.copyToChannel(new Float32Array(l), 0);
  b.copyToChannel(new Float32Array(r), 1);
  return b;
}

/**
 * Plays the opening's sound design (synth SFX + any uploaded one-shots such as a
 * chime, announcement or horn at their cue times) over either the original
 * looping score or an uploaded music track. Must be started from a user gesture.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bedSrc: AudioBufferSourceNode | null = null;
  private oneShots: AudioBufferSourceNode[] = [];
  private custom: HTMLAudioElement | null = null;
  private muted = false;

  constructor(
    private template: TemplateId,
    private sounds: ResolvedSounds,
  ) {}

  /** Start rendering/downloading early so playback begins instantly on tap. */
  preload() {
    renderInWorker(this.template, this.sounds.omit).catch(() => {});
    this.sounds.samples.forEach((s) => fetchSample(s.src).catch(() => {}));
    const music = this.sounds.music;
    if (music.src) {
      this.custom = new Audio(music.src);
      this.custom.loop = true;
      this.custom.preload = "auto";
      this.custom.volume = music.volume;
    }
  }

  async start({ withSfx = true } = {}) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    // Resume synchronously inside the gesture; awaiting the render first would lose it on iOS.
    const resumed = this.ctx.resume();
    const t0 = this.ctx.currentTime;
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.connect(this.master);
    if (this.custom) {
      this.custom.muted = this.muted;
      this.custom.play().catch(() => {});
    }
    if (withSfx) this.sounds.samples.forEach((s) => this.scheduleSample(s.src, t0 + s.at));
    await resumed;
    const r = await renderInWorker(this.template, this.sounds.omit);
    if (!this.ctx) return;
    const now = this.ctx.currentTime + 0.02;
    if (!this.custom && this.sounds.bed) {
      const bedGain = this.ctx.createGain();
      bedGain.gain.value = 0.75 * this.sounds.music.volume;
      bedGain.connect(this.master);
      this.bedSrc = this.ctx.createBufferSource();
      this.bedSrc.buffer = toBuffer(this.ctx, r.sampleRate, r.bed);
      this.bedSrc.loop = true;
      this.bedSrc.connect(bedGain);
      this.bedSrc.start(now);
    }
    if (withSfx && this.sfxGain) {
      const src = this.ctx.createBufferSource();
      src.buffer = toBuffer(this.ctx, r.sampleRate, r.sfx);
      src.connect(this.sfxGain);
      // keep the synth SFX aligned with the timeline even if the render finished late
      const offset = Math.max(0, now - t0);
      src.start(now, offset);
      this.oneShots.push(src);
    }
  }

  private async scheduleSample(src: string, when: number) {
    try {
      const data = await fetchSample(src);
      if (!this.ctx || !this.sfxGain) return;
      const buf = await this.ctx.decodeAudioData(data.slice(0));
      if (!this.ctx || !this.sfxGain) return;
      const node = this.ctx.createBufferSource();
      node.buffer = buf;
      node.connect(this.sfxGain);
      const now = this.ctx.currentTime;
      if (when >= now) node.start(when);
      else if (now - when < buf.duration) node.start(now, now - when);
      else return;
      this.oneShots.push(node);
    } catch {
      /* a missing or undecodable upload shouldn't break the opening */
    }
  }

  /** Fade out the opening's sound design (e.g. when the animation is skipped). */
  stopSfx() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    this.sfxGain.gain.setTargetAtTime(0, t, 0.15);
    this.oneShots.forEach((n) => {
      try {
        n.stop(t + 1);
      } catch {}
    });
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.08);
    if (this.custom) this.custom.muted = m;
  }

  dispose() {
    try {
      this.bedSrc?.stop();
      this.oneShots.forEach((n) => n.stop());
    } catch {}
    this.custom?.pause();
    this.custom = null;
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}
