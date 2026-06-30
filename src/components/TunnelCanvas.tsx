// ── Tunnel Canvas — Gundam Catapult Deck ──────────────────
// One-point perspective tunnel rendered on 2D canvas.
// Light particles flow toward the viewer in an infinite loop.
// Two phases: running (always) → done (fade out on LAUNCH click).
// Procedural pulse keeps it alive; real audio drives it when playing.
//
// Performance: glow sprites (radial gradients) instead of shadowBlur.
// No save/restore per particle. Batch by color to minimize state changes.

import { useEffect, useRef } from "react";
import { getAudioData } from "../useAudioEngine";

export type TunnelPhase = "running" | "done";

interface Props {
  phase: TunnelPhase;
}

const POOL_SIZE = 80;
const COLORS = ["#FF4FD8", "#1BBCB2", "#8B5CF6"] as const;
const TUNNEL_SPEED = 0.6;
const SPRITE_SIZE = 64;

interface Particle {
  x: number;
  y: number;
  z: number;
  colorIdx: number;
}

/** Pre-render a glow sprite (radial gradient) for one color */
function makeGlowSprite(color: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = SPRITE_SIZE;
  c.height = SPRITE_SIZE;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(
    SPRITE_SIZE / 2, SPRITE_SIZE / 2, 0,
    SPRITE_SIZE / 2, SPRITE_SIZE / 2, SPRITE_SIZE / 2,
  );
  g.addColorStop(0, color);
  g.addColorStop(0.25, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  return c;
}

export function TunnelCanvas({ phase }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<TunnelPhase>(phase);
  phaseRef.current = phase;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Glow sprites (created once) ──
    const glowSprites = COLORS.map(makeGlowSprite);

    // ── Sizing ──
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
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

    // ── Particle pool ──
    const pool: Particle[] = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      pool.push({
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: Math.random(),
        colorIdx: i % 3,
      });
    }

    // ── Scratch arrays for render batching (reused every frame) ──
    const buckets: { sx: number; sy: number; size: number; brightness: number }[][] = [
      [], [], [],
    ];

    // ── State ──
    let tunnelAlpha = 1;
    let elapsed = 0;
    let lastT = performance.now();
    let raf = 0;

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((t - lastT) / 1000, 0.05);
      lastT = t;
      elapsed += dt;

      // ── Done: fade out ──
      if (phaseRef.current === "done") {
        tunnelAlpha = Math.max(tunnelAlpha - dt * 2, 0);
        if (tunnelAlpha <= 0.005) {
          ctx.clearRect(0, 0, w, h);
          return;
        }
      }

      // ── Pulse ──
      const audio = getAudioData();
      const pulse = audio.bass > 0.01
        ? audio.bass
        : 0.5 + 0.5 * Math.sin(elapsed * 2.5);

      const cx = w / 2;
      const cy = h / 2;
      const maxRadius = Math.hypot(w, h) / 2;

      // ── Clear ──
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = tunnelAlpha;

      // ── Perspective grid ──
      const gridAlpha = 0.06 + pulse * 0.04;
      ctx.strokeStyle = `rgba(255, 255, 255, ${gridAlpha})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * maxRadius, cy + Math.sin(angle) * maxRadius);
        ctx.stroke();
      }

      // ── Depth rings ──
      const ringOffset = (elapsed * TUNNEL_SPEED * 0.5) % 1;
      for (let i = 0; i < 8; i++) {
        const ringZ = ((i / 8) + ringOffset) % 1;
        const radius = ringZ * maxRadius;
        if (radius < 5) continue;
        ctx.strokeStyle = `rgba(255, 255, 255, ${ringZ * (0.15 + pulse * 0.08)})`;
        ctx.lineWidth = 0.5 + ringZ * 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ── Update particles & bucket by color ──
      // Clear buckets
      buckets[0].length = 0;
      buckets[1].length = 0;
      buckets[2].length = 0;

      for (const p of pool) {
        p.z += TUNNEL_SPEED * dt;
        if (p.z > 1.2) {
          p.x = (Math.random() - 0.5) * 2;
          p.y = (Math.random() - 0.5) * 2;
          p.z = 0;
        }

        const scale = p.z * p.z;
        const sx = cx + p.x * scale * maxRadius * 0.7;
        const sy = cy + p.y * scale * maxRadius * 0.7;
        const size = scale * (2 + pulse * 3);
        const brightness = scale * (0.5 + pulse * 0.5);

        if (size < 0.1) continue;

        buckets[p.colorIdx].push({ sx, sy, size, brightness });
      }

      // ── Render particles — batch by color, no shadowBlur, no save/restore ──
      ctx.globalCompositeOperation = "lighter";
      for (let ci = 0; ci < 3; ci++) {
        const bucket = buckets[ci];
        const len = bucket.length;
        if (len === 0) continue;

        const sprite = glowSprites[ci];
        // Draw all particles of this color with one composite-op setting
        for (let j = 0; j < len; j++) {
          const p = bucket[j];
          ctx.globalAlpha = p.brightness * tunnelAlpha;
          const s = p.size * 2;
          ctx.drawImage(sprite, p.sx - s / 2, p.sy - s / 2, s, s);
        }
      }
      ctx.globalCompositeOperation = "source-over";

      ctx.globalAlpha = 1;
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
