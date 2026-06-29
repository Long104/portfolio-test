// ── Kira-Kira Gundam Reticle Cursor ──────────────────────
// Targeting reticle inspired by Gundam cockpit HUDs.
// Rotating ring + tick marks, corner brackets, crosshair, SEED sparkle trail.
// Audio-reactive: bass punch, beat bursts, lock-on state on hover.
// Runs on its own 60fps rAF loop — independent of R3F's 30fps demand loop.

import { useEffect, useMemo, useRef } from "react";
import { getAudioData } from "../useAudioEngine";

// ── Palette (discrete, matches shaders) ──────────────────
const PALETTE = [
  { hex: "#FFFFFF", weight: 0.35 }, // core white
  { hex: "#FF4FD8", weight: 0.30 }, // SEED magenta
  { hex: "#1BBCB2", weight: 0.20 }, // cyan (matches particles.ts)
  { hex: "#8B5CF6", weight: 0.15 }, // galaxy violet
];

const MAX_SPARKLES = 120;
const DOT_LERP = 0.22; // snappy — marks exact click position
const RING_LERP = 0.12; // laggy — creates elastic, premium feel
const BEAT_HISTORY = 26;
const BEAT_DEBOUNCE_MS = 110;
const IDLE_INTERVAL_MS = 80;
const SPRITE_SIZE = 64;

interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  lifespan: number;
  size: number;
  rot: number;
  rotSpeed: number;
  phase: number;
  color: string;
}

// ── Hex → rgba ───────────────────────────────────────────
function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function pickColor(): string {
  const r = Math.random();
  let acc = 0;
  for (const c of PALETTE) {
    acc += c.weight;
    if (r < acc) return c.hex;
  }
  return PALETTE[0].hex;
}

// ── Pre-render SEED sparkle sprite (cached per color) ────
function makeSparkleSprite(color: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = SPRITE_SIZE;
  const x = c.getContext("2d")!;
  const cx = SPRITE_SIZE / 2;

  const halo = x.createRadialGradient(cx, cx, 0, cx, cx, SPRITE_SIZE * 0.35);
  halo.addColorStop(0, hexA(color, 0.6));
  halo.addColorStop(0.5, hexA(color, 0.18));
  halo.addColorStop(1, hexA(color, 0));
  x.fillStyle = halo;
  x.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);

  const v = x.createLinearGradient(cx, 0, cx, SPRITE_SIZE);
  v.addColorStop(0, hexA(color, 0));
  v.addColorStop(0.5, hexA(color, 1));
  v.addColorStop(1, hexA(color, 0));
  x.strokeStyle = v;
  x.lineWidth = 1.5;
  x.beginPath();
  x.moveTo(cx, 2);
  x.lineTo(cx, SPRITE_SIZE - 2);
  x.stroke();

  const h = x.createLinearGradient(0, cx, SPRITE_SIZE, cx);
  h.addColorStop(0, hexA(color, 0));
  h.addColorStop(0.5, hexA(color, 1));
  h.addColorStop(1, hexA(color, 0));
  x.strokeStyle = h;
  x.beginPath();
  x.moveTo(2, cx);
  x.lineTo(SPRITE_SIZE - 2, cx);
  x.stroke();

  x.fillStyle = hexA("#FFFFFF", 0.95);
  x.beginPath();
  x.arc(cx, cx, 1.6, 0, Math.PI * 2);
  x.fill();

  return c;
}

// ── Tick mark on ring perimeter ──────────────────────────
function drawTick(
  ctx: CanvasRenderingContext2D,
  angle: number,
  ringR: number,
  length: number,
): void {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  ctx.beginPath();
  ctx.moveTo(cos * ringR, sin * ringR);
  ctx.lineTo(cos * (ringR + length), sin * (ringR + length));
  ctx.stroke();
}

// ── L-shaped corner bracket ──────────────────────────────
function drawBracket(
  ctx: CanvasRenderingContext2D,
  bx: number, by: number,
  len: number,
  dx: number, dy: number,
): void {
  ctx.beginPath();
  ctx.moveTo(bx, by + dy * len);
  ctx.lineTo(bx, by);
  ctx.lineTo(bx + dx * len, by);
  ctx.stroke();
}

// ── Gundam targeting reticle ────────────────────────────
// Draws: rotating ring + ticks (scanning), fixed brackets + crosshair (frame),
// center dot (precise click point). Lock-on state on hover.
function drawReticle(
  ctx: CanvasRenderingContext2D,
  rx: number, ry: number,       // reticle center (laggy ring position)
  dx: number, dy: number,       // dot center (snappy precise position)
  rotation: number,
  hover: boolean,
  clicking: boolean,
  lockAlpha: number,            // 0..1 eased hover state
  bass: number,
): void {
  const color = hover ? "#FF4FD8" : "#FFFFFF";
  const baseR = hover ? 17 : 12;
  const ringR = baseR * (1 + bass * 0.35) * (clicking ? 0.75 : 1);

  // ═══ Rotating elements: ring + tick marks (scanning) ═══
  ctx.save();
  ctx.translate(rx, ry);
  ctx.rotate(rotation);

  // Outer ring
  ctx.strokeStyle = hexA(color, 0.4 + lockAlpha * 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, ringR, 0, Math.PI * 2);
  ctx.stroke();

  // Main ticks at 0°, 90°, 180°, 270°
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = hexA(color, 0.55 + lockAlpha * 0.3);
  for (let i = 0; i < 4; i++) {
    drawTick(ctx, (i / 4) * Math.PI * 2, ringR, 5);
  }

  // Minor ticks at 45°, 135°, 225°, 315°
  ctx.lineWidth = 1;
  ctx.strokeStyle = hexA(color, 0.25 + lockAlpha * 0.2);
  for (let i = 0; i < 4; i++) {
    drawTick(ctx, ((i + 0.5) / 4) * Math.PI * 2, ringR, 3);
  }

  ctx.restore();

  // ═══ Fixed elements: corner brackets (screen-aligned targeting frame) ═══
  // On lock-on: brackets contract inward + tighten
  const bo = hover ? ringR * 0.5 : ringR + 5;
  const bl = hover ? 6 : 8;
  const ba = hover ? 0.9 : 0.45;

  ctx.strokeStyle = hexA(color, ba);
  ctx.lineWidth = 1.5;
  drawBracket(ctx, rx - bo, ry - bo, bl, 1, 1);    // NW
  drawBracket(ctx, rx + bo, ry - bo, bl, -1, 1);   // NE
  drawBracket(ctx, rx - bo, ry + bo, bl, 1, -1);   // SW
  drawBracket(ctx, rx + bo, ry + bo, bl, -1, -1);  // SE

  // ═══ Crosshair lines (gaps near center) ═══
  const gap = 5;
  const armEnd = ringR - 2;
  if (armEnd > gap + 2) {
    ctx.strokeStyle = hexA(color, 0.3 + lockAlpha * 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx + gap, ry); ctx.lineTo(rx + armEnd, ry);
    ctx.moveTo(rx - gap, ry); ctx.lineTo(rx - armEnd, ry);
    ctx.moveTo(rx, ry + gap); ctx.lineTo(rx, ry + armEnd);
    ctx.moveTo(rx, ry - gap); ctx.lineTo(rx, ry - armEnd);
    ctx.stroke();
  }

  // ═══ Lock-on micro-text ═══
  if (lockAlpha > 0.03) {
    ctx.font = "8px 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace";
    ctx.fillStyle = hexA("#FF4FD8", lockAlpha * 0.7);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("◉ LOCK", rx + ringR + 10, ry);
  }

  // ═══ Center dot — dim precision marker, no glow halo ═══
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(dx, dy, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

export function CursorOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer: fine)").matches;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── DPR-aware sizing ──
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = (): void => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Sprite cache ──
    const sprites: Record<string, HTMLCanvasElement> = {};
    for (const c of PALETTE) sprites[c.hex] = makeSparkleSprite(c.hex);

    // ── Pointer state — dual element ──
    const target = { x: w / 2, y: h / 2 };
    const dot = { x: w / 2, y: h / 2 };
    const ring = { x: w / 2, y: h / 2 };
    let prevX = dot.x;
    let prevY = dot.y;
    let firstMove = false;
    let hover = false;
    let clicking = false;

    // Reticle rotation + lock-on easing
    let rotation = 0;
    let rotSpeed = 0;       // eases toward target speed
    let lockAlpha = 0;      // eases toward hover state

    const onMove = (e: PointerEvent): void => {
      if (!firstMove) {
        dot.x = ring.x = target.x = e.clientX;
        dot.y = ring.y = target.y = e.clientY;
        prevX = dot.x;
        prevY = dot.y;
        firstMove = true;
        return;
      }
      target.x = e.clientX;
      target.y = e.clientY;
    };
    const onOver = (e: MouseEvent): void => {
      const el = e.target;
      hover = el instanceof Element && !!el.closest("a, button, [data-hover]");
    };
    const onDown = (): void => {
      clicking = true;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.random() * 0.4;
        spawn(dot.x + Math.cos(a) * 8, dot.y + Math.sin(a) * 8, {
          vx: Math.cos(a) * 1.2,
          vy: Math.sin(a) * 1.2,
        });
      }
    };
    const onUp = (): void => {
      clicking = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    // ── Sparkle object pool ──
    const pool: Sparkle[] = [];
    for (let i = 0; i < MAX_SPARKLES; i++) {
      pool.push({
        x: 0, y: 0, vx: 0, vy: 0,
        life: 0, lifespan: 1,
        size: 0, rot: 0, rotSpeed: 0,
        phase: 0, color: "#FFFFFF",
      });
    }
    let head = 0;

    function spawn(x: number, y: number, opts?: Partial<Sparkle>): void {
      const s = pool[head];
      head = (head + 1) % MAX_SPARKLES;
      s.x = x;
      s.y = y;
      s.vx = (Math.random() - 0.5) * 1.2;
      s.vy = (Math.random() - 0.5) * 1.2;
      s.life = 1;
      s.lifespan = 0.8 + Math.random() * 0.6;
      s.size = 6 + Math.random() * 8;
      s.rot = Math.random() * Math.PI;
      s.rotSpeed = (Math.random() - 0.5) * 0.04;
      s.phase = Math.random() * Math.PI * 2;
      s.color = pickColor();
      if (opts) {
        if (opts.vx !== undefined) s.vx = opts.vx;
        if (opts.vy !== undefined) s.vy = opts.vy;
        if (opts.size !== undefined) s.size = opts.size;
        if (opts.lifespan !== undefined) s.lifespan = opts.lifespan;
      }
    }

    function burst(count: number, radius: number, speed: number): void {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.3;
        spawn(
          dot.x + Math.cos(a) * radius,
          dot.y + Math.sin(a) * radius,
          { vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, size: 8 + Math.random() * 6 },
        );
      }
    }

    // ── Beat detection ──
    const bassHistory = new Float32Array(BEAT_HISTORY);
    let bhIdx = 0;
    let bhFilled = 0;
    let lastBeat = 0;
    let lastIdle = 0;

    document.documentElement.classList.add("cursor-hidden");

    let rafId = 0;
    let lastT = performance.now();

    const frame = (t: number): void => {
      rafId = requestAnimationFrame(frame);
      const dt = Math.min((t - lastT) / 1000, 0.05);
      lastT = t;

      const audio = getAudioData();

      // ── Dual-element lerp ──
      dot.x += (target.x - dot.x) * DOT_LERP;
      dot.y += (target.y - dot.y) * DOT_LERP;
      ring.x += (target.x - ring.x) * RING_LERP;
      ring.y += (target.y - ring.y) * RING_LERP;
      const speed = Math.hypot(dot.x - prevX, dot.y - prevY);
      prevX = dot.x;
      prevY = dot.y;

      // ── Reticle rotation: spins while scanning, stops on lock-on ──
      const targetRotSpeed = hover ? 0 : 0.3; // rad/s
      rotSpeed += (targetRotSpeed - rotSpeed) * 0.08;
      rotation += dt * rotSpeed;

      // ── Lock-on alpha easing ──
      lockAlpha += ((hover ? 1 : 0) - lockAlpha) * 0.15;

      // Pre-first-move
      if (!firstMove) {
        ctx.clearRect(0, 0, w, h);
        drawReticle(ctx, ring.x, ring.y, dot.x, dot.y, rotation, false, false, 0, 0);
        return;
      }

      // ── Spawn sparkles ──
      if (speed > 2) {
        const n = Math.min(4, Math.ceil(speed / 40 + audio.level * 2));
        for (let i = 0; i < n; i++) spawn(dot.x, dot.y);
      }
      if (t - lastIdle > IDLE_INTERVAL_MS) {
        lastIdle = t;
        spawn(dot.x, dot.y, { size: 4 + Math.random() * 4 });
      }

      // ── Beat detection ──
      bassHistory[bhIdx] = audio.bass;
      bhIdx = (bhIdx + 1) % BEAT_HISTORY;
      if (bhFilled < BEAT_HISTORY) bhFilled++;
      let sum = 0;
      for (let i = 0; i < bhFilled; i++) sum += bassHistory[i];
      const mean = sum / bhFilled;
      let varSum = 0;
      for (let i = 0; i < bhFilled; i++) {
        const d = bassHistory[i] - mean;
        varSum += d * d;
      }
      const variance = varSum / bhFilled;
      const threshold = (mean * 1.35 + 0.05) / (1 + Math.sqrt(variance));
      if (
        audio.bass > threshold &&
        audio.bass > 0.15 &&
        t - lastBeat > BEAT_DEBOUNCE_MS
      ) {
        lastBeat = t;
        burst(10, 18, 1.5);
      }

      // ── Update pool ──
      for (let i = 0; i < MAX_SPARKLES; i++) {
        const s = pool[i];
        if (s.life <= 0) continue;
        s.life -= dt / s.lifespan;
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.96;
        s.vy *= 0.96;
        s.vy -= 0.02;
        s.rot += s.rotSpeed;
      }

      // ── Render ──
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      // Sparkles
      const time = t / 1000;
      for (let i = 0; i < MAX_SPARKLES; i++) {
        const s = pool[i];
        if (s.life <= 0) continue;
        const sprite = sprites[s.color] ?? sprites["#FFFFFF"];
        const twinkle = 0.4 + 0.6 * Math.sin(time * 8 + s.phase);
        const alpha = Math.max(0, s.life * twinkle * (0.3 + audio.mid * 0.4));
        const drawSize = s.size * 3 * (0.5 + s.life * 0.5);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        ctx.restore();
      }

      // ── Gundam targeting reticle ──
      drawReticle(
        ctx,
        ring.x, ring.y,
        dot.x, dot.y,
        rotation,
        hover,
        clicking,
        lockAlpha,
        audio.bass,
      );

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.classList.remove("cursor-hidden");
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}
