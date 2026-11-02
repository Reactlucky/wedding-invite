import * as THREE from "three";
import { TRAIN_CUES as C } from "@/lib/cues";
import { clamp, mulberry32, smoothstep } from "@/lib/random";
import type { Palette } from "@/lib/types";

/**
 * Procedural vintage railway station at sunset with an original steam
 * locomotive built from primitives. `render(t)` is a pure function of the
 * opening's timeline time, which makes the MP4 export frame-exact.
 */

const Z_START = -360;
const Z_END = -7.5;
const MOVE_START = 0.4;
const WHEEL_R = 0.85;

/** Train nose position along the track at time t (decelerating arrival). */
export function trainZ(t: number) {
  const p = clamp((t - MOVE_START) / (C.approachEnd - MOVE_START));
  const e = 1 - (1 - p) * (1 - p) * (1 - p) * 0.35 - (1 - p) * (1 - p) * 0.65; // fast far away, gentle stop
  return Z_START + (Z_END - Z_START) * e;
}

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function cssFont(varName: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

export interface TrainSceneOptions {
  palette: Palette;
  initials: string;
  clockTime: Date;
  exportMode: boolean;
}

interface Puff {
  te: number;
  ox: number;
  oy: number;
  oz: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  life: number;
}

export class TrainScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(45, 1, 0.1, 3000);
  private train = new THREE.Group();
  private wheels: THREE.Object3D[] = [];
  private smallWheels: THREE.Object3D[] = [];
  private rods: THREE.Object3D[] = [];
  private glare: THREE.Sprite;
  private headSpot: THREE.SpotLight;
  private steam: THREE.Points;
  private puffs: Puff[] = [];
  private textures: THREE.Texture[] = [];
  private monogramMat!: THREE.MeshStandardMaterial;
  private clockMat!: THREE.MeshBasicMaterial;
  private sunDir = new THREE.Vector3(-0.12, 0.07, -1).normalize();
  private aspect = 1;

  constructor(
    private canvas: HTMLCanvasElement,
    private opts: TrainSceneOptions,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: opts.exportMode,
    });
    this.renderer.setPixelRatio(opts.exportMode ? window.devicePixelRatio : Math.min(window.devicePixelRatio, 1.75));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const p = opts.palette;
    const fogColor = new THREE.Color(p.base).lerp(new THREE.Color(p.accentLight), 0.45);
    this.scene.fog = new THREE.FogExp2(fogColor, 0.0085);

    this.buildSky();
    this.buildLights();
    this.buildGround();
    this.buildStation();
    this.buildTrain();
    this.scene.add(this.train);

    // headlamp glare (screen-space sized sprite) and light pool on the rails
    const glareTex = canvasTexture(256, 256, (g) => {
      const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      grd.addColorStop(0, "rgba(255,255,245,1)");
      grd.addColorStop(0.12, "rgba(255,236,190,.9)");
      grd.addColorStop(0.4, "rgba(255,190,110,.25)");
      grd.addColorStop(1, "rgba(255,160,80,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, 256, 256);
      g.globalCompositeOperation = "lighter";
      g.fillStyle = "rgba(255,230,190,.35)";
      g.fillRect(0, 124, 256, 8);
    });
    this.textures.push(glareTex);
    this.glare = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glareTex, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, sizeAttenuation: false, fog: false }),
    );
    this.glare.position.set(0, 3.55, 0.35);
    this.glare.renderOrder = 10;
    this.train.add(this.glare);

    this.headSpot = new THREE.SpotLight(0xffe2b0, 60, 60, 0.35, 0.6, 1.4);
    this.headSpot.position.set(0, 3.55, 0.4);
    this.headSpot.target.position.set(0, 0, 30);
    this.train.add(this.headSpot, this.headSpot.target);

    this.steam = this.buildSteam();
    this.scene.add(this.steam);
  }

  /* ------------------------------------------------------------- building */

  private buildSky() {
    const p = this.opts.palette;
    const geo = new THREE.SphereGeometry(1500, 32, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        top: { value: new THREE.Color(p.deep) },
        mid: { value: new THREE.Color(p.base) },
        horizon: { value: new THREE.Color(p.accentLight) },
        sun: { value: new THREE.Color(p.accentLight).lerp(new THREE.Color("#fff6e0"), 0.6) },
        sunDir: { value: this.sunDir },
      },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; uniform vec3 sun; uniform vec3 sunDir; varying vec3 vDir;
        void main(){
          float h = vDir.y;
          vec3 col = mix(horizon, mid, smoothstep(-0.02, 0.22, h));
          col = mix(col, top, smoothstep(0.18, 0.75, h));
          float d = max(dot(normalize(vDir), normalize(sunDir)), 0.0);
          col += sun * (pow(d, 900.0) * 3.0 + pow(d, 40.0) * 0.55 + pow(d, 6.0) * 0.18);
          // soft cloud streaks
          float band = sin(vDir.x * 9.0 + vDir.y * 40.0) * 0.5 + 0.5;
          col = mix(col, horizon * 1.1, band * smoothstep(0.02, 0.1, h) * (1.0 - smoothstep(0.1, 0.28, h)) * 0.18);
          col = mix(col, horizon * 0.55, smoothstep(0.0, -0.08, h));
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    this.scene.add(new THREE.Mesh(geo, mat));

    // distant hills silhouette
    const hills = canvasTexture(2048, 256, (g) => {
      const rng = mulberry32(17);
      g.clearRect(0, 0, 2048, 256);
      for (const [alpha, amp, base] of [
        [0.55, 90, 150],
        [0.85, 60, 205],
      ] as const) {
        g.beginPath();
        g.moveTo(0, 256);
        let y = base;
        for (let x = 0; x <= 2048; x += 16) {
          y = base - Math.abs(Math.sin(x * 0.004 + alpha * 7) * amp * 0.6) - rng() * amp * 0.15;
          g.lineTo(x, y);
        }
        g.lineTo(2048, 256);
        g.closePath();
        g.fillStyle = `rgba(0,0,0,${alpha})`;
        g.fill();
      }
    });
    this.textures.push(hills);
    const hillMat = new THREE.MeshBasicMaterial({ map: hills, transparent: true, color: new THREE.Color(p.base).multiplyScalar(0.55), fog: false, depthWrite: false });
    const hillMesh = new THREE.Mesh(new THREE.PlaneGeometry(2600, 320), hillMat);
    hillMesh.position.set(0, 60, -1100);
    this.scene.add(hillMesh);
  }

  private buildLights() {
    const p = this.opts.palette;
    this.scene.add(new THREE.HemisphereLight(new THREE.Color(p.accentLight), new THREE.Color(p.deep), 0.9));
    const sun = new THREE.DirectionalLight(new THREE.Color(p.accentLight), 2.6);
    sun.position.set(-40, 30, -200); // low sun behind the train → warm rim light
    this.scene.add(sun);
    // cool fill from the camera side so the engine's face reads
    const fill = new THREE.DirectionalLight(0xb9c4ff, 0.7);
    fill.position.set(20, 12, 40);
    this.scene.add(fill);
    // warm platform lamp pools near the camera
    for (const z of [1, -10, -24]) {
      const l = new THREE.PointLight(new THREE.Color(p.accentLight), 14, 18, 1.6);
      l.position.set(3.4, 4.8, z);
      this.scene.add(l);
    }
  }

  private buildGround() {
    const p = this.opts.palette;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(4000, 4000),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(p.deep).lerp(new THREE.Color(p.base), 0.35), roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    const ballast = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.3, 1400), new THREE.MeshStandardMaterial({ color: 0x3b332d, roughness: 1 }));
    ballast.position.set(0, 0.15, -650);
    this.scene.add(ballast);

    // sleepers
    const count = 900;
    const sleepers = new THREE.InstancedMesh(
      new THREE.BoxGeometry(2.6, 0.14, 0.26),
      new THREE.MeshStandardMaterial({ color: 0x2a1d14, roughness: 0.95 }),
      count,
    );
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      m.makeTranslation(0, 0.36, 12 - i * 0.7);
      sleepers.setMatrixAt(i, m);
    }
    this.scene.add(sleepers);

    const railMat = new THREE.MeshStandardMaterial({ color: 0xb8b2aa, metalness: 0.95, roughness: 0.25 });
    for (const x of [-0.72, 0.72]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 1400), railMat);
      rail.position.set(x, 0.5, -650);
      this.scene.add(rail);
    }
    // second track on the far side for depth
    for (const x of [-5.2, -3.8]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 1400), railMat);
      rail.position.set(x, 0.42, -650);
      this.scene.add(rail);
    }
  }

  private buildStation() {
    const p = this.opts.palette;
    const stone = new THREE.MeshStandardMaterial({ color: new THREE.Color("#8a7766").lerp(new THREE.Color(p.base), 0.25), roughness: 0.9 });
    const iron = new THREE.MeshStandardMaterial({ color: new THREE.Color(p.secondary).multiplyScalar(0.6), roughness: 0.5, metalness: 0.6 });
    const brass = new THREE.MeshStandardMaterial({ color: new THREE.Color(p.accent), roughness: 0.3, metalness: 1 });

    // platform with flagstone paving
    const paving = canvasTexture(512, 512, (g) => {
      const rng = mulberry32(8);
      const base = new THREE.Color("#7d6a58").lerp(new THREE.Color(p.base), 0.3);
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 4; x++) {
          const c = base.clone().multiplyScalar(0.8 + rng() * 0.35);
          g.fillStyle = `#${c.getHexString()}`;
          g.fillRect(x * 128 + (y % 2) * 64, y * 64, 128, 64);
          g.fillRect(x * 128 + (y % 2) * 64 - 512, y * 64, 128, 64);
        }
      g.strokeStyle = "rgba(20,12,8,.55)";
      g.lineWidth = 3;
      for (let y = 0; y <= 8; y++) {
        g.beginPath();
        g.moveTo(0, y * 64);
        g.lineTo(512, y * 64);
        g.stroke();
        for (let x = 0; x <= 4; x++) {
          const xx = x * 128 + (y % 2) * 64;
          g.beginPath();
          g.moveTo(xx, y * 64);
          g.lineTo(xx, y * 64 + 64);
          g.stroke();
        }
      }
    });
    paving.wrapS = paving.wrapT = THREE.RepeatWrapping;
    paving.repeat.set(2, 42);
    this.textures.push(paving);
    const platformTop = new THREE.MeshStandardMaterial({ map: paving, roughness: 0.85 });
    const platform = new THREE.Mesh(new THREE.BoxGeometry(7, 1.1, 150), [stone, stone, platformTop, stone, stone, stone]);
    platform.position.set(5.2, 0.55, -55);
    this.scene.add(platform);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 150), new THREE.MeshStandardMaterial({ color: new THREE.Color(p.accent), roughness: 0.6 }));
    edge.position.set(1.85, 1.13, -55);
    this.scene.add(edge);

    // cast-iron canopy: columns, arched brackets, roof, hanging lamps
    const colGeo = new THREE.CylinderGeometry(0.11, 0.14, 5.2, 10);
    const capGeo = new THREE.CylinderGeometry(0.25, 0.12, 0.3, 10);
    const bracketGeo = new THREE.TorusGeometry(1.2, 0.05, 6, 16, Math.PI / 2);
    const lampGeo = new THREE.SphereGeometry(0.22, 16, 12);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xffe9c0, emissive: new THREE.Color(p.accentLight), emissiveIntensity: 3 });
    // first column bay starts beyond the dolly path (camera travels z 9 → 4)
    for (let z = -2; z > -100; z -= 9) {
      for (const x of [3.4, 7.2]) {
        const col = new THREE.Mesh(colGeo, iron);
        col.position.set(x, 3.7, z);
        this.scene.add(col);
        const cap = new THREE.Mesh(capGeo, brass);
        cap.position.set(x, 6.35, z);
        this.scene.add(cap);
      }
      const br = new THREE.Mesh(bracketGeo, iron);
      br.position.set(3.4 - 1.2, 6.3, z);
      br.rotation.z = 0;
      this.scene.add(br);
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(2.9, 5.4, z - 4.5);
      this.scene.add(lamp);
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.1), iron);
      chain.position.set(2.9, 6.0, z - 4.5);
      this.scene.add(chain);
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.18, 110), iron);
    roof.position.set(5.0, 6.6, -47);
    this.scene.add(roof);
    // valance (decorative fringe) along the canopy edge
    const valanceTex = canvasTexture(256, 64, (g) => {
      g.clearRect(0, 0, 256, 64);
      g.fillStyle = "#fff";
      g.fillRect(0, 0, 256, 24);
      for (let x = 0; x < 256; x += 32) {
        g.beginPath();
        g.moveTo(x, 24);
        g.lineTo(x + 16, 60);
        g.lineTo(x + 32, 24);
        g.fill();
      }
    });
    valanceTex.wrapS = THREE.RepeatWrapping;
    valanceTex.repeat.set(110, 1);
    this.textures.push(valanceTex);
    const valance = new THREE.Mesh(
      new THREE.PlaneGeometry(110, 0.7),
      new THREE.MeshStandardMaterial({ map: valanceTex, alphaTest: 0.5, color: new THREE.Color(p.secondary).lerp(new THREE.Color("#ffffff"), 0.2), side: THREE.DoubleSide }),
    );
    valance.rotation.y = Math.PI / 2;
    valance.position.set(1.3, 6.25, -47);
    this.scene.add(valance);

    // hanging station clock showing the ceremony time
    this.clockMat = new THREE.MeshBasicMaterial({ map: this.makeClockTexture(), fog: true });
    const clock = new THREE.Group();
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.62, 48), this.clockMat);
    const back = face.clone();
    back.rotation.y = Math.PI;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.06, 10, 48), brass);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.18, 48), iron);
    body.rotation.x = Math.PI / 2;
    face.position.z = 0.1;
    back.position.z = -0.1;
    clock.add(body, face, back, rim);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9), iron);
    rod.position.y = 1.05;
    clock.add(rod);
    clock.position.set(3.2, 5.1, -16);
    clock.rotation.y = 0.35;
    this.scene.add(clock);

    // telegraph poles on the far side
    const poleGeo = new THREE.CylinderGeometry(0.09, 0.12, 8, 6);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1d140f, roughness: 1 });
    for (let z = 10; z > -500; z -= 28) {
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(-8, 4, z);
      this.scene.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.08), poleMat);
      arm.position.set(-8, 7.6, z);
      this.scene.add(arm);
    }
  }

  private makeClockTexture() {
    const tex = canvasTexture(512, 512, (g) => this.drawClock(g));
    this.textures.push(tex);
    return tex;
  }

  private drawClock(g: CanvasRenderingContext2D) {
    const time = this.opts.clockTime;
    g.fillStyle = "#f6efe0";
    g.fillRect(0, 0, 512, 512);
    g.translate(256, 256);
    g.strokeStyle = "#1b1410";
    g.fillStyle = "#1b1410";
    for (let i = 0; i < 60; i++) {
      g.save();
      g.rotate((i * Math.PI) / 30);
      g.lineWidth = i % 5 === 0 ? 10 : 3;
      g.beginPath();
      g.moveTo(0, -230);
      g.lineTo(0, i % 5 === 0 ? -192 : -214);
      g.stroke();
      g.restore();
    }
    g.font = `600 52px ${cssFont("--font-cinzel", "serif")}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const romans = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
    romans.forEach((r, i) => {
      const a = (i * Math.PI) / 6;
      g.fillText(r, Math.sin(a) * 150, -Math.cos(a) * 150);
    });
    const h = time.getHours() % 12;
    const m = time.getMinutes();
    const hand = (angle: number, len: number, w: number) => {
      g.save();
      g.rotate(angle);
      g.lineWidth = w;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(0, 24);
      g.lineTo(0, -len);
      g.stroke();
      g.restore();
    };
    hand(((h + m / 60) * Math.PI) / 6, 110, 16);
    hand((m * Math.PI) / 30, 175, 9);
    g.beginPath();
    g.arc(0, 0, 14, 0, Math.PI * 2);
    g.fill();
  }

  private makeMonogram() {
    const p = this.opts.palette;
    const tex = canvasTexture(512, 512, (g) => {
      const grd = g.createRadialGradient(200, 180, 20, 256, 256, 256);
      grd.addColorStop(0, p.accentLight);
      grd.addColorStop(0.6, p.accent);
      grd.addColorStop(1, "#3a2a10");
      g.fillStyle = "#121212";
      g.fillRect(0, 0, 512, 512);
      g.fillStyle = grd;
      g.beginPath();
      g.arc(256, 256, 240, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#121212";
      g.beginPath();
      g.arc(256, 256, 200, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = p.accent;
      g.lineWidth = 6;
      g.beginPath();
      g.arc(256, 256, 186, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = p.accentLight;
      g.font = `400 150px ${cssFont("--font-vibes", "cursive")}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(this.opts.initials, 256, 270);
    });
    this.textures.push(tex);
    return tex;
  }

  /** Redraw canvas textures once web fonts have loaded. */
  refreshTextures() {
    if (this.monogramMat) {
      this.monogramMat.map?.dispose();
      this.monogramMat.map = this.makeMonogram();
      this.monogramMat.emissiveMap = this.monogramMat.map;
      this.monogramMat.needsUpdate = true;
    }
    if (this.clockMat) {
      this.clockMat.map?.dispose();
      this.clockMat.map = this.makeClockTexture();
      this.clockMat.needsUpdate = true;
    }
  }

  private buildTrain() {
    const p = this.opts.palette;
    const livery = new THREE.MeshStandardMaterial({ color: new THREE.Color(p.secondary), roughness: 0.35, metalness: 0.35 });
    const black = new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.55, metalness: 0.5 });
    const brass = new THREE.MeshStandardMaterial({ color: new THREE.Color(p.accent), roughness: 0.22, metalness: 1, emissive: new THREE.Color(p.accent), emissiveIntensity: 0.08 });
    const red = new THREE.MeshStandardMaterial({ color: 0x8e1b16, roughness: 0.5, metalness: 0.2 });
    const T = this.train;
    const add = (mesh: THREE.Mesh, x: number, y: number, z: number) => {
      mesh.position.set(x, y, z);
      T.add(mesh);
      return mesh;
    };

    // running board / frame
    add(new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.22, 11.5), black), 0, 1.3, -5.6);
    add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 11), black), 0, 0.95, -5.6);
    // buffer beam + buffers
    add(new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.5, 0.22), red), 0, 1.2, 0.05);
    for (const x of [-0.95, 0.95]) {
      const stem = add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.45, 12), black), x, 1.2, 0.35);
      stem.rotation.x = Math.PI / 2;
      const disc = add(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 20), brass), x, 1.2, 0.58);
      disc.rotation.x = Math.PI / 2;
    }
    // cow-catcher bars
    for (let i = -4; i <= 4; i++) {
      const bar = add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 1.2), black), i * 0.3, 0.55, 0.45);
      bar.rotation.x = -0.55;
      bar.rotation.y = -i * 0.07;
    }
    // boiler
    const boiler = add(new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 6.6, 40), livery), 0, 2.35, -4.3);
    boiler.rotation.x = Math.PI / 2;
    for (const z of [-1.6, -3.2, -4.8, -6.4, -7.5]) {
      const band = add(new THREE.Mesh(new THREE.TorusGeometry(0.965, 0.045, 8, 48), brass), 0, 2.35, z);
      band.rotation.y = 0;
    }
    // smokebox + door + monogram
    const smokebox = add(new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.3, 40), black), 0, 2.35, -0.75);
    smokebox.rotation.x = Math.PI / 2;
    this.monogramMat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.6, emissive: 0xffffff, emissiveIntensity: 0.25 });
    this.monogramMat.map = this.makeMonogram();
    this.monogramMat.emissiveMap = this.monogramMat.map;
    const door = add(new THREE.Mesh(new THREE.CircleGeometry(0.88, 48), this.monogramMat), 0, 2.35, -0.09);
    door.rotation.y = 0;
    add(new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.06, 10, 48), brass), 0, 2.35, -0.08);
    // chimney
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 1.2, 24), black), 0, 3.75, -0.9);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.3, 0.24, 24), black), 0, 4.45, -0.9);
    add(new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.045, 8, 24), brass), 0, 4.57, -0.9).rotation.x = Math.PI / 2;
    // domes
    add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), brass), 0, 3.2, -3.4);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.3, 24), brass), 0, 3.15, -3.4);
    add(new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), livery), 0, 3.2, -5.4);
    // whistle
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.4, 12), brass), 0, 3.6, -6.9);
    // headlamp
    add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), black), 0, 3.55, 0.05);
    add(new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), new THREE.MeshBasicMaterial({ color: 0xfff3d0 })), 0, 3.55, 0.27);
    // cylinders (pistons)
    for (const x of [-1.25, 1.25]) {
      const cyl = add(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.5, 24), livery), x, 1.15, -1.5);
      cyl.rotation.x = Math.PI / 2;
      const cap = add(new THREE.Mesh(new THREE.CircleGeometry(0.36, 24), brass), x, 1.15, -0.74);
      cap.rotation.y = 0;
    }
    // cab
    add(new THREE.Mesh(new THREE.BoxGeometry(2.7, 2.5, 2.8), livery), 0, 2.65, -9.4);
    add(new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.16, 3.2), black), 0, 3.98, -9.4);
    const fireGlow = new THREE.MeshStandardMaterial({ color: 0x331a08, emissive: new THREE.Color(p.accentLight), emissiveIntensity: 2.2 });
    for (const x of [-0.75, 0.75]) add(new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.55), fireGlow), x, 3.15, -7.99);
    for (const side of [-1, 1]) {
      const w = add(new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), fireGlow), side * 1.36, 3.0, -9.4);
      w.rotation.y = (side * Math.PI) / 2;
      const stripe = add(new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.06), brass), side * 1.361, 2.2, -9.4);
      stripe.rotation.y = (side * Math.PI) / 2;
    }
    // tender
    add(new THREE.Mesh(new THREE.BoxGeometry(2.7, 2.2, 4.6), livery), 0, 2.2, -13.4);
    add(new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.4, 4.0), new THREE.MeshStandardMaterial({ color: 0x0c0b0a, roughness: 1 })), 0, 3.4, -13.4);
    for (const side of [-1, 1]) {
      const s = add(new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.06), brass), side * 1.355, 2.6, -13.4);
      s.rotation.y = (side * Math.PI) / 2;
    }

    // driving wheels with spokes + coupling rods
    const wheelGeo = new THREE.TorusGeometry(WHEEL_R - 0.06, 0.08, 10, 36);
    const spokeGeo = new THREE.BoxGeometry(0.05, WHEEL_R * 2 - 0.15, 0.06);
    const hubGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.14, 16);
    const makeWheel = (r: number, x: number, z: number, list: THREE.Object3D[]) => {
      const g = new THREE.Group();
      const rim = new THREE.Mesh(r === WHEEL_R ? wheelGeo : new THREE.TorusGeometry(r - 0.04, 0.06, 8, 24), red);
      rim.rotation.y = Math.PI / 2;
      g.add(rim);
      const spokes = r === WHEEL_R ? 10 : 6;
      for (let i = 0; i < spokes; i++) {
        const s = new THREE.Mesh(r === WHEEL_R ? spokeGeo : new THREE.BoxGeometry(0.04, r * 2 - 0.1, 0.05), red);
        s.rotation.x = (i * Math.PI) / spokes;
        g.add(s);
      }
      const hub = new THREE.Mesh(hubGeo, brass);
      hub.rotation.z = Math.PI / 2;
      g.add(hub);
      g.position.set(x, r, z);
      T.add(g);
      list.push(g);
    };
    for (const z of [-3.0, -4.9, -6.8]) for (const x of [-1.12, 1.12]) makeWheel(WHEEL_R, x, z, this.wheels);
    for (const z of [-0.9, -1.9, -11.8, -13.4, -15.0]) for (const x of [-1.05, 1.05]) makeWheel(0.45, x, z, this.smallWheels);
    for (const x of [-1.24, 1.24]) {
      const rod = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 4.0), brass);
      rod.position.set(x, WHEEL_R, -4.9);
      T.add(rod);
      this.rods.push(rod);
    }

    // two coaches with warm lit windows
    const windowsTex = canvasTexture(1024, 128, (g) => {
      g.fillStyle = p.secondary;
      g.fillRect(0, 0, 1024, 128);
      g.fillStyle = p.accent;
      g.fillRect(0, 18, 1024, 4);
      g.fillRect(0, 108, 1024, 4);
      for (let x = 30; x < 1000; x += 96) {
        const grd = g.createLinearGradient(0, 34, 0, 96);
        grd.addColorStop(0, "#ffe6b0");
        grd.addColorStop(1, "#ff9a3c");
        g.fillStyle = grd;
        g.beginPath();
        g.roundRect(x, 34, 64, 62, 10);
        g.fill();
      }
    });
    this.textures.push(windowsTex);
    const coachSide = new THREE.MeshStandardMaterial({ map: windowsTex, emissiveMap: windowsTex, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.45 });
    for (let c = 0; c < 2; c++) {
      const z0 = -16.4 - c * 15.2;
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.6, 14.4), [livery, livery, black, black, livery, livery]);
      body.position.set(0, 2.55, z0 - 7.2);
      T.add(body);
      for (const side of [-1, 1]) {
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(14.2, 1.6), coachSide);
        panel.position.set(side * 1.405, 2.75, z0 - 7.2);
        panel.rotation.y = (side * Math.PI) / 2;
        T.add(panel);
      }
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 14.6, 24, 1, false, -Math.PI / 3.2, (Math.PI * 2) / 3.2), black);
      roof.rotation.x = Math.PI / 2;
      roof.rotation.y = Math.PI;
      roof.position.set(0, 2.55, z0 - 7.2);
      T.add(roof);
      for (const z of [z0 - 2, z0 - 3.2, z0 - 11.2, z0 - 12.4]) for (const x of [-1.05, 1.05]) makeWheel(0.45, x, z, this.smallWheels);
    }
  }

  private buildSteam() {
    const rng = mulberry32(42);
    // chimney puffs while moving
    for (let te = 0; te < C.approachEnd + 0.2; te += 0.075) {
      for (let k = 0; k < 2; k++) {
        this.puffs.push({
          te,
          ox: (rng() - 0.5) * 0.3,
          oy: 4.6,
          oz: -0.9,
          vx: 0.6 + rng() * 1.2,
          vy: 2.2 + rng() * 1.8,
          vz: (rng() - 0.5) * 0.8,
          size: 1.3 + rng() * 1.4,
          life: 2.6 + rng() * 1.6,
        });
      }
    }
    // cylinder-cock & brake steam blasting sideways as it stops
    for (let te = C.approachEnd - 1.4; te < C.duration; te += 0.04) {
      const side = rng() < 0.5 ? -1 : 1;
      this.puffs.push({
        te,
        ox: side * 1.4,
        oy: 0.9,
        oz: -1.2 - rng() * 2,
        vx: side * (4 + rng() * 5),
        vy: 0.4 + rng() * 1.2,
        vz: 1 + rng() * 3,
        size: 1.6 + rng() * 2.2,
        life: 1.8 + rng() * 1.6,
      });
    }
    const n = this.puffs.length;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(n), 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(n), 1));
    const p = this.opts.palette;
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uColor: { value: new THREE.Color("#fff8ee").lerp(new THREE.Color(p.accentLight), 0.25) },
        uShade: { value: new THREE.Color(p.base).lerp(new THREE.Color("#777"), 0.5) },
        uScale: { value: 400 },
      },
      vertexShader: `
        attribute float aSize; attribute float aAlpha; varying float vAlpha; uniform float uScale;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = min(aSize * uScale / -mv.z, 900.0);
          vAlpha = aAlpha;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uColor; uniform vec3 uShade; varying float vAlpha;
        void main(){
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          float a = smoothstep(0.5, 0.05, d);
          a *= 0.75 + 0.25 * sin(c.x * 13.0 + c.y * 9.0);
          vec3 col = mix(uColor, uShade, smoothstep(-0.2, 0.5, c.y) * 0.55);
          gl_FragColor = vec4(col, a * vAlpha);
        }`,
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    return pts;
  }

  /* ------------------------------------------------------------ rendering */

  resize(w: number, h: number) {
    this.aspect = w / h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = this.aspect;
    // portrait screens need a wider vertical field of view to keep the track in frame
    this.camera.fov = this.aspect < 1 ? 58 + (1 - this.aspect) * 18 : 42;
    this.camera.updateProjectionMatrix();
    (this.steam.material as THREE.ShaderMaterial).uniforms.uScale.value = h * 0.9;
  }

  render(t: number) {
    const z = trainZ(t);
    this.train.position.z = z;
    const travelled = z - Z_START;
    const angle = travelled / WHEEL_R;
    for (const w of this.wheels) w.rotation.x = angle;
    for (const w of this.smallWheels) w.rotation.x = travelled / 0.45;
    this.rods.forEach((rod) => {
      rod.position.y = WHEEL_R + Math.sin(angle) * 0.32;
      rod.position.z = -4.9 + Math.cos(angle) * 0.32;
    });

    // glare grows as it nears, then dims once the engine stops
    const dist = Math.max(1, -z + 8);
    const stopFade = 1 - smoothstep(C.approachEnd, C.approachEnd + 1.5, t) * 0.6;
    const g = clamp(0.06 + 9 / dist, 0, 0.55) * stopFade * smoothstep(0, 1.2, t);
    this.glare.scale.set(g * 1.6, g, 1);
    this.headSpot.intensity = 60 * smoothstep(0, 1.5, t);

    // steam
    const pos = this.steam.geometry.getAttribute("position") as THREE.BufferAttribute;
    const size = this.steam.geometry.getAttribute("aSize") as THREE.BufferAttribute;
    const alpha = this.steam.geometry.getAttribute("aAlpha") as THREE.BufferAttribute;
    this.puffs.forEach((p, i) => {
      const age = t - p.te;
      if (age < 0 || age > p.life) {
        alpha.setX(i, 0);
        pos.setXYZ(i, 0, -100, 0);
        return;
      }
      const ez = trainZ(p.te);
      const k = 1 - Math.exp(-age * 1.4);
      pos.setXYZ(i, p.ox + p.vx * k * 1.6 + age * 0.8, p.oy + p.vy * k * 1.8 + age * 0.4, ez + p.oz + p.vz * k);
      size.setX(i, p.size * (1 + age * 1.9));
      const lifeK = age / p.life;
      alpha.setX(i, Math.min(1, age * 5) * (1 - lifeK) * (1 - lifeK) * 0.75);
    });
    pos.needsUpdate = true;
    size.needsUpdate = true;
    alpha.needsUpdate = true;

    // camera: slow dolly along the platform, tracking the engine, shaking as it arrives
    const near = smoothstep(C.approachEnd - 3, C.approachEnd - 0.2, t);
    const settle = smoothstep(C.approachEnd, C.approachEnd + 3, t);
    const portrait = this.aspect < 1;
    const camX = (portrait ? 2.6 : 3.3) + near * 0.4;
    const camY = 2.05 + near * 0.25 - settle * 0.1;
    const camZ = 9 - t * 0.35;
    const shakeAmt = near * (1 - settle) * 0.05;
    const sx = Math.sin(t * 37) * Math.cos(t * 23) * shakeAmt;
    const sy = Math.sin(t * 41 + 1) * shakeAmt;
    this.camera.position.set(camX + sx, camY + sy, camZ);
    const lookZ = Math.min(z - 6, -30) * (1 - near) + (z - 4) * near;
    const lookX = portrait ? -0.3 - near * 0.6 : -0.6 - near * 0.4;
    this.camera.lookAt(lookX, 2.0 + near * 0.6, lookZ);

    this.renderer.toneMappingExposure = 1.05 + near * 0.15;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((mat) => mat.dispose());
    });
    this.textures.forEach((t) => t.dispose());
    this.renderer.dispose();
  }
}
