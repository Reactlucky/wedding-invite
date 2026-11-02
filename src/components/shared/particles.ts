import { mulberry32 } from "@/lib/random";

/**
 * Deterministic particle fields: every particle's position is a pure function
 * of time, so a frame at t=6.4s looks identical live and in the MP4 export.
 */

interface Dust {
  x: number;
  y: number;
  speed: number;
  sway: number;
  freq: number;
  phase: number;
  size: number;
  tw: number;
}

interface Spark {
  angle: number;
  speed: number;
  size: number;
  life: number;
  phase: number;
}

function makeSprite(color: string, size = 64) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.18, color);
  grd.addColorStop(0.45, color.replace(/[\d.]+\)$/, "0.25)"));
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return c;
}

function hexToRgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export class ParticleField {
  private ctx: CanvasRenderingContext2D;
  private dust: Dust[];
  private sparks: Spark[];
  private stars: { x: number; y: number; r: number; tw: number; ph: number }[];
  private sprite: HTMLCanvasElement;
  private w = 0;
  private h = 0;
  private dpr = 1;

  constructor(
    private canvas: HTMLCanvasElement,
    color: string,
    opts: { dust?: number; sparks?: number; stars?: number; seed?: number; maxDpr?: number } = {},
  ) {
    this.ctx = canvas.getContext("2d")!;
    const rng = mulberry32(opts.seed ?? 3);
    this.dust = Array.from({ length: opts.dust ?? 80 }, () => ({
      x: rng(),
      y: rng(),
      speed: 0.015 + rng() * 0.05,
      sway: 0.004 + rng() * 0.02,
      freq: 0.3 + rng() * 0.9,
      phase: rng() * Math.PI * 2,
      size: 0.6 + rng() ** 3 * 3.2,
      tw: 0.8 + rng() * 2.5,
    }));
    this.sparks = Array.from({ length: opts.sparks ?? 0 }, () => ({
      angle: -Math.PI / 2 + (rng() - 0.5) * Math.PI * 1.7,
      speed: 0.15 + rng() * 0.75,
      size: 0.8 + rng() * 2.6,
      life: 1.6 + rng() * 2.4,
      phase: rng() * Math.PI * 2,
    }));
    this.stars = Array.from({ length: opts.stars ?? 0 }, () => ({
      x: rng(),
      y: rng() ** 1.6 * 0.6,
      r: 0.3 + rng() ** 4 * 1.6,
      tw: 0.5 + rng() * 2.5,
      ph: rng() * Math.PI * 2,
    }));
    this.sprite = makeSprite(hexToRgba(color, 0.9));
    this.dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr ?? 2);
    this.resize();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
  }

  get size() {
    return { w: this.w, h: this.h };
  }

  /**
   * @param t        timeline time (s)
   * @param dust     0..1 ambient gold dust intensity
   * @param stars    0..1 star field intensity
   * @param burst    { t0, x, y } burst origin in CSS px, or null
   */
  draw(t: number, dust: number, stars: number, burst: { t0: number; x: number; y: number } | null) {
    const { ctx, w, h, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    if (stars > 0) {
      ctx.fillStyle = "#fffaf0";
      for (const s of this.stars) {
        const a = stars * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.tw + s.ph)));
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const scale = Math.min(1.6, Math.max(0.7, Math.min(w, h) / 600));
    if (dust > 0) {
      for (const p of this.dust) {
        const y = (((p.y - t * p.speed) % 1) + 1) % 1;
        const x = p.x + Math.sin(t * p.freq + p.phase) * p.sway;
        const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * p.tw + p.phase));
        const edge = Math.min(1, y * 6, (1 - y) * 6);
        ctx.globalAlpha = dust * tw * edge;
        const s = p.size * 7 * scale;
        ctx.drawImage(this.sprite, x * w - s / 2, y * h - s / 2, s, s);
      }
    }

    if (burst && t > burst.t0) {
      const dt = t - burst.t0;
      const reach = Math.max(w, h) * 0.75;
      for (const p of this.sparks) {
        if (dt > p.life) continue;
        const k = 1.6;
        const travel = ((1 - Math.exp(-k * dt)) / k) * p.speed * reach;
        const x = burst.x + Math.cos(p.angle) * travel + Math.sin(dt * 3 + p.phase) * 6;
        const y = burst.y + Math.sin(p.angle) * travel + dt * dt * 18;
        const life = 1 - dt / p.life;
        ctx.globalAlpha = Math.min(1, dt * 8) * life * life;
        const s = p.size * 8 * scale * (0.6 + 0.4 * life);
        ctx.drawImage(this.sprite, x - s / 2, y - s / 2, s, s);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
}
