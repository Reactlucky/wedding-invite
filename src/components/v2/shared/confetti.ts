import { mulberry32 } from "@/lib/random";

/**
 * Falling petals + paper confetti. Every particle is a pure function of time so
 * the opening's burst renders identically live and in MP4 export; the
 * invitation hero simply feeds it a running clock.
 */
interface Bit {
  x: number;
  delay: number;
  speed: number;
  sway: number;
  freq: number;
  spin: number;
  size: number;
  color: string;
  kind: 0 | 1 | 2; // petal, paper strip, round
  phase: number;
}

export class ConfettiField {
  private ctx: CanvasRenderingContext2D;
  private bits: Bit[];
  private w = 1;
  private h = 1;
  private dpr = 1;

  constructor(
    private canvas: HTMLCanvasElement,
    colors: string[],
    count = 140,
    seed = 12,
  ) {
    this.ctx = canvas.getContext("2d")!;
    const rng = mulberry32(seed);
    this.bits = Array.from({ length: count }, () => ({
      x: rng(),
      delay: rng() * 2.2,
      speed: 0.09 + rng() * 0.16,
      sway: 0.01 + rng() * 0.04,
      freq: 0.8 + rng() * 2,
      spin: (rng() - 0.5) * 8,
      size: 4 + rng() * 7,
      color: colors[Math.floor(rng() * colors.length)],
      kind: (rng() < 0.55 ? 0 : rng() < 0.6 ? 1 : 2) as 0 | 1 | 2,
      phase: rng() * Math.PI * 2,
    }));
    this.resize();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
  }

  /**
   * @param t     seconds since the burst
   * @param loop  keep falling forever (hero idle) instead of a single shower
   */
  draw(t: number, loop = false, intensity = 1) {
    const { ctx, w, h, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (t < 0 || intensity <= 0) return;
    const fall = h * 1.25;
    for (const b of this.bits) {
      let lt = t - b.delay;
      if (lt < 0) continue;
      const period = fall / (b.speed * h * 2.6);
      if (loop) lt %= period;
      const y = -0.08 * h + lt * b.speed * h * 2.6 - (loop ? 0 : 0);
      if (y > h + 20) continue;
      const x = (b.x + Math.sin(lt * b.freq + b.phase) * b.sway) * w;
      const rot = b.phase + lt * b.spin;
      const flip = Math.abs(Math.cos(lt * b.freq * 1.7 + b.phase));
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(1, 0.25 + 0.75 * flip);
      ctx.globalAlpha = intensity * (loop ? 0.85 : Math.min(1, (h * 1.1 - y) / (h * 0.3)));
      ctx.fillStyle = b.color;
      const s = b.size * Math.min(1.4, Math.max(0.8, w / 500));
      if (b.kind === 0) {
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.55, s, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.kind === 1) {
        ctx.fillRect(-s * 0.3, -s * 0.8, s * 0.6, s * 1.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}
