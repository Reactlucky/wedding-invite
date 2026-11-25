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
  /** Uploaded clips, such as the announcement. Kept off the score clock so a pause cannot cut them off. */
  private sampleEls: HTMLAudioElement[] = [];
  private sampleTimers: number[] = [];
  private samplesArmed = false;
  private scoreGen = 0;
  private muted = false;

  constructor(
    private template: TemplateId,
    private sounds: ResolvedSounds,
  ) {}

  /** Start rendering/downloading early so playback begins instantly on tap. */
  preload() {
    renderInWorker(this.template, this.sounds.omit).catch(() => {});
    this.sounds.samples.forEach((s) => {
      const audio = new Audio(s.src);
      audio.preload = "auto";
      audio.volume = 1;
      audio.setAttribute("playsinline", "");
      this.sampleEls.push(audio);
    });
    const music = this.sounds.music;
    if (music.src) {
      this.custom = new Audio(music.src);
      this.custom.loop = true;
      this.custom.preload = "auto";
      this.custom.volume = music.volume;
    }
  }

  /**
   * @param offset seconds into the score. Used when playback starts late so the
   * door and the remaining effects still line up with the picture.
   * @param gesture true when called from a tap. Without one, browsers block
   * sound; the context is closed so a later tap can start it in sync.
   */
  async start({ withSfx = true, offset = 0, gesture = false } = {}) {
    if (this.ctx && this.ctx.state !== "closed") return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    // Resume synchronously inside the gesture; awaiting the render first would lose it on iOS.
    const resumed = this.ctx.resume();
    if (!gesture && this.ctx.state !== "running") {
      const ctx = this.ctx;
      this.ctx = null;
      ctx.close().catch(() => {});
      return;
    }
    const gen = ++this.scoreGen;
    const t0 = this.ctx.currentTime;
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.connect(this.master);
    if (this.custom) {
      this.custom.muted = this.muted;
      try {
        this.custom.currentTime = offset;
      } catch {
        /* metadata may not be in yet; playback still starts at the beginning */
      }
      this.custom.play().catch(() => {});
    }
    await resumed;
    await this.playScore(gen, offset, withSfx, t0);
  }

  /**
   * Play uploaded clips on their own elements so the score pause cannot cut them off.
   * `immediate` is for a tap: start any clip that never got going, from the top.
   * Call that form inside the tap so the browser allows sound.
   */
  playSamples({ immediate = false } = {}) {
    this.sounds.samples.forEach((s, i) => {
      const audio = this.sampleEls[i];
      if (!audio) return;
      const kick = () => {
        if (!audio.paused && audio.currentTime > 0.25 && !audio.ended) return;
        if (audio.ended || (immediate && audio.currentTime < 0.25)) {
          try {
            audio.currentTime = 0;
          } catch {
            /* metadata may not be in yet */
          }
        }
        audio.muted = this.muted;
        audio.play().catch(() => {});
      };
      if (immediate || s.at <= 0.05) kick();
      else if (!this.samplesArmed) this.sampleTimers.push(window.setTimeout(kick, s.at * 1000));
    });
    this.samplesArmed = true;
  }

  /** Jump the synth score to `offset` without touching uploaded clips. */
  async playScoreFrom(offset: number) {
    this.stopScoreNodes();
    if (!this.ctx || this.ctx.state === "closed") {
      await this.start({ offset, gesture: true });
      return;
    }
    if (this.ctx.state === "suspended") await this.ctx.resume().catch(() => {});
    const gen = ++this.scoreGen;
    await this.playScore(gen, offset, true, this.ctx.currentTime);
  }

  private async playScore(gen: number, offset: number, withSfx: boolean, t0: number) {
    const r = await renderInWorker(this.template, this.sounds.omit);
    if (gen !== this.scoreGen || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime + 0.02;
    if (!this.custom && this.sounds.bed && !this.bedSrc) {
      const bedGain = this.ctx.createGain();
      bedGain.gain.value = 0.75 * this.sounds.music.volume;
      bedGain.connect(this.master!);
      this.bedSrc = this.ctx.createBufferSource();
      this.bedSrc.buffer = toBuffer(this.ctx, r.sampleRate, r.bed);
      this.bedSrc.loop = true;
      this.bedSrc.connect(bedGain);
      this.bedSrc.start(now);
    }
    if (!withSfx) return;
    const src = this.ctx.createBufferSource();
    const buffer = toBuffer(this.ctx, r.sampleRate, r.sfx);
    src.buffer = buffer;
    src.connect(this.sfxGain);
    const into = offset + Math.max(0, now - t0);
    if (into < buffer.duration - 0.05) {
      src.start(now, into);
      this.oneShots.push(src);
    }
  }

  private stopScoreNodes() {
    try {
      this.bedSrc?.stop();
    } catch {
      /* already stopped */
    }
    this.bedSrc = null;
    this.oneShots.forEach((n) => {
      try {
        n.stop();
      } catch {
        /* already stopped */
      }
    });
    this.oneShots = [];
  }

  contextState(): AudioContextState | "closed" {
    return this.ctx?.state ?? "closed";
  }

  /** Freeze the synth score while the guest decides to board. Uploaded clips keep playing. */
  suspend() {
    if (this.ctx?.state === "running") this.ctx.suspend().catch(() => {});
    if (this.custom && !this.custom.paused) this.custom.pause();
  }

  resume() {
    if (this.ctx?.state === "suspended") this.ctx.resume().catch(() => {});
    if (this.custom?.paused) this.custom.play().catch(() => {});
  }

  /** Fade out the opening's sound design (e.g. when the animation is skipped). */
  stopSfx() {
    this.scoreGen++;
    this.stopClips();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    this.sfxGain.gain.setTargetAtTime(0, t, 0.15);
    this.oneShots.forEach((n) => {
      try {
        n.stop(t + 1);
      } catch {
        /* already stopped */
      }
    });
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.08);
    if (this.custom) this.custom.muted = m;
    this.sampleEls.forEach((audio) => {
      audio.muted = m;
    });
  }

  private stopClips() {
    this.sampleTimers.forEach((id) => window.clearTimeout(id));
    this.sampleTimers = [];
    this.sampleEls.forEach((audio) => {
      audio.pause();
      audio.src = "";
    });
    this.sampleEls = [];
    this.samplesArmed = false;
  }

  dispose() {
    this.scoreGen++;
    this.stopScoreNodes();
    this.stopClips();
    this.custom?.pause();
    this.custom = null;
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}
