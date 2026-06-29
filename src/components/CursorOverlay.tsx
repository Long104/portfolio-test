// ── Kira-Kira Cursor Overlay ─────────────────────────────
// SEED-mode cross sparkles that trail the cursor, audio-reactive.
// Runs on its own 60fps rAF loop — independent of R3F's 30fps demand loop.
// Self-gates: desktop only (pointer: fine).
//
// Architecture:
//   • Dual-element cursor: dot (snappy) + ring (laggy) = elastic premium feel
//   • Object pool of 120 sparkles (ring buffer, no GC churn)
//   • Pre-rendered sprite per palette color (drawImage = GPU, not gradient creation)
//   • Energy-based beat detection on bass band
//   • Spawn sources: movement + beat burst + idle trickle + click
//   • Additive blending (globalCompositeOperation = 'lighter')

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
const BEAT_HISTORY = 26; // ~430ms at 60fps
const BEAT_DEBOUNCE_MS = 110;
const IDLE_INTERVAL_MS = 80;
const SPRITE_SIZE = 64;

interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1 → 0 over lifespan
  lifespan: number; // seconds
  size: number;
  rot: number;
  rotSpeed: number;
  phase: number; // twinkle offset
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

// ── Weighted palette pick ────────────────────────────────
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
// drawImage with transform = 1 GPU op. Creating gradients per-frame would be
// 360 gradient creations/frame (120 sparkles × 3 gradients) → janky.
function makeSparkleSprite(color: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = SPRITE_SIZE;
  const x = c.getContext("2d")!;
  const cx = SPRITE_SIZE / 2;

  // Soft radial halo
  const halo = x.createRadialGradient(cx, cx, 0, cx, cx, SPRITE_SIZE * 0.35);
  halo.addColorStop(0, hexA(color, 0.6));
  halo.addColorStop(0.5, hexA(color, 0.18));
  halo.addColorStop(1, hexA(color, 0));
  x.fillStyle = halo;
  x.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);

  // Vertical cross arm (gradient: transparent → color → transparent)
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

  // Horizontal cross arm
  const h = x.createLinearGradient(0, cx, SPRITE_SIZE, cx);
  h.addColorStop(0, hexA(color, 0));
  h.addColorStop(0.5, hexA(color, 1));
  h.addColorStop(1, hexA(color, 0));
  x.strokeStyle = h;
  x.beginPath();
  x.moveTo(2, cx);
  x.lineTo(SPRITE_SIZE - 2, cx);
  x.stroke();

  // White-hot core
  x.fillStyle = hexA("#FFFFFF", 0.95);
  x.beginPath();
  x.arc(cx, cx, 1.6, 0, Math.PI * 2);
  x.fill();

  return c;
}

// ── Ring renderer (outer, laggy — visual anchor) ────────
function drawRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha: number,
  treble: number,
): void {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r + treble * 2, 0, Math.PI * 2);
  ctx.stroke();
}

// ── Dot renderer (inner, snappy — precise click point) ──
function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  bass: number,
): void {
  ctx.globalAlpha = 1;

  // Glow halo
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
  glow.addColorStop(0, hexA("#FFFFFF", 0.35 + bass * 0.3));
  glow.addColorStop(0.4, hexA("#FFFFFF", 0.06));
  glow.addColorStop(1, hexA("#FFFFFF", 0));
  ctx.fillStyle = glow;
  ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);

  // Core
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(x, y, r * (1 + bass * 0.3), 0, Math.PI * 2);
  ctx.fill();
}

export function CursorOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Gate: desktop pointer only (no touch).
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

    // NOTE: const arrows (not function declarations) so TS preserves null-narrowing
    // of canvas/ctx inside closures. Function declarations are hoisted → TS widens.
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
    const dot = { x: w / 2, y: h / 2 };   // fast follow — precise click point
    const ring = { x: w / 2, y: h / 2 };  // slow follow — visual anchor
    let prevX = dot.x;
    let prevY = dot.y;
    let firstMove = false;
    let hover = false;
    let clicking = false;

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
      // Click sparkle burst from dot position
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

    // ── Sparkle object pool (ring buffer) ──
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
          {
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            size: 8 + Math.random() * 6,
          },
        );
      }
    }

    // ── Beat detection (energy-based onset) ──
    // Tracks running bass energy. When instantaneous bass exceeds an adaptive
    // threshold (mean × 1.35 + floor, divided by 1+√variance for self-tuning),
    // fires a beat — debounced to 110ms.
    const bassHistory = new Float32Array(BEAT_HISTORY);
    let bhIdx = 0;
    let bhFilled = 0;
    let lastBeat = 0;

    // ── Idle trickle timer ──
    let lastIdle = 0;

    // ── Hide native cursor ──
    document.documentElement.classList.add("cursor-hidden");

    // ── Main rAF loop ──
    let rafId = 0;
    let lastT = performance.now();

    const frame = (t: number): void => {
      rafId = requestAnimationFrame(frame);
      const dt = Math.min((t - lastT) / 1000, 0.05);
      lastT = t;

      const audio = getAudioData();

      // ── Dual-element lerp: dot snaps fast, ring lags behind ──
      dot.x += (target.x - dot.x) * DOT_LERP;
      dot.y += (target.y - dot.y) * DOT_LERP;
      ring.x += (target.x - ring.x) * RING_LERP;
      ring.y += (target.y - ring.y) * RING_LERP;

      // Speed based on dot (the precise one)
      const speed = Math.hypot(dot.x - prevX, dot.y - prevY);
      prevX = dot.x;
      prevY = dot.y;

      // Pre-first-move: render cursor at center, no sparkles yet
      if (!firstMove) {
        ctx.clearRect(0, 0, w, h);
        drawRing(ctx, ring.x, ring.y, 16, "#FFFFFF", 0.6, 0);
        drawDot(ctx, dot.x, dot.y, 3, 0);
        return;
      }

      // ── Spawn: movement-driven ──
      if (speed > 2) {
        const n = Math.min(4, Math.ceil(speed / 40 + audio.level * 2));
        for (let i = 0; i < n; i++) spawn(dot.x, dot.y);
      }

      // ── Spawn: idle ambient trickle ──
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
        s.vy -= 0.02; // ember-rise
        s.rot += s.rotSpeed;
      }

      // ── Render ──
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      // Sparkles (additive)
      const time = t / 1000;
      for (let i = 0; i < MAX_SPARKLES; i++) {
        const s = pool[i];
        if (s.life <= 0) continue;
        const sprite = sprites[s.color] ?? sprites["#FFFFFF"];
        const twinkle = 0.4 + 0.6 * Math.sin(time * 8 + s.phase);
        const alpha = Math.max(0, s.life * twinkle * (0.7 + audio.mid * 0.6));
        const drawSize = s.size * 5 * (0.5 + s.life * 0.5);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        ctx.restore();
      }

      // ── Ring (outer, laggy — visual anchor) ──
      const ringBaseR = hover ? 24 : 16;
      const ringR = ringBaseR * (1 + audio.bass * 0.5) * (clicking ? 0.75 : 1);
      const ringColor = hover ? "#FF4FD8" : "#FFFFFF";
      const ringAlpha = hover ? 0.85 : 0.5;
      drawRing(ctx, ring.x, ring.y, ringR, ringColor, ringAlpha, audio.treble);

      // ── Dot (inner, snappy — precise click point) ──
      drawDot(ctx, dot.x, dot.y, 3, audio.bass);

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
