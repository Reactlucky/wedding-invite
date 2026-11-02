"use client";

import type { MusicChoice, TemplateId } from "../types";

interface Rendered {
  sampleRate: number;
  bed: [Float32Array, Float32Array];
  sfx: [Float32Array, Float32Array];
}

const renders = new Map<TemplateId, Promise<Rendered>>();

/** Render the template's score off the main thread (cached per template). */
function renderInWorker(template: TemplateId): Promise<Rendered> {
  if (!renders.has(template)) {
    renders.set(
      template,
      new Promise<Rendered>((resolve, reject) => {
        const worker = new Worker(new URL("./score.worker.ts", import.meta.url), { type: "module" });
        worker.onmessage = (e) => {
          resolve(e.data as Rendered);
          worker.terminate();
        };
        worker.onerror = (e) => {
          renders.delete(template);
          reject(e);
          worker.terminate();
        };
        worker.postMessage({ template });
      }),
    );
  }
  return renders.get(template)!;
}

function toBuffer(ctx: AudioContext, sampleRate: number, [l, r]: [Float32Array, Float32Array]) {
  const b = ctx.createBuffer(2, l.length, sampleRate);
  b.copyToChannel(new Float32Array(l), 0);
  b.copyToChannel(new Float32Array(r), 1);
  return b;
}

/**
 * Plays the opening's synced sound design plus either the original looping
 * score or the couple's uploaded track. Must be started from a user gesture.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bedSrc: AudioBufferSourceNode | null = null;
  private sfxSrc: AudioBufferSourceNode | null = null;
  private custom: HTMLAudioElement | null = null;
  private muted = false;

  constructor(
    private template: TemplateId,
    private music: MusicChoice,
  ) {}

  /** Kick off rendering early (before the user taps) so playback starts instantly. */
  preload() {
    renderInWorker(this.template).catch(() => {});
    if (this.music.src) {
      this.custom = new Audio(this.music.src);
      this.custom.loop = true;
      this.custom.preload = "auto";
      this.custom.volume = this.music.volume;
    }
  }

  async start({ withSfx = true } = {}) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    // Resume synchronously inside the gesture; awaiting the render first would lose it on iOS.
    const resumed = this.ctx.resume();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);
    if (this.custom) {
      this.custom.muted = this.muted;
      this.custom.play().catch(() => {});
    }
    await resumed;
    const r = await renderInWorker(this.template);
    if (!this.ctx) return;
    const now = this.ctx.currentTime + 0.02;
    if (!this.custom) {
      const bedGain = this.ctx.createGain();
      bedGain.gain.value = 0.75 * this.music.volume;
      bedGain.connect(this.master);
      this.bedSrc = this.ctx.createBufferSource();
      this.bedSrc.buffer = toBuffer(this.ctx, r.sampleRate, r.bed);
      this.bedSrc.loop = true;
      this.bedSrc.connect(bedGain);
      this.bedSrc.start(now);
    }
    if (withSfx) {
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.master);
      this.sfxSrc = this.ctx.createBufferSource();
      this.sfxSrc.buffer = toBuffer(this.ctx, r.sampleRate, r.sfx);
      this.sfxSrc.connect(this.sfxGain);
      this.sfxSrc.start(now);
    }
  }

  /** Fade out the opening's sound design (e.g. when the animation is skipped). */
  stopSfx() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    this.sfxGain.gain.setTargetAtTime(0, t, 0.15);
    this.sfxSrc?.stop(t + 1);
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.08);
    if (this.custom) this.custom.muted = m;
  }

  dispose() {
    try {
      this.bedSrc?.stop();
      this.sfxSrc?.stop();
    } catch {}
    this.custom?.pause();
    this.custom = null;
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}
