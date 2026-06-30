// ── Tunnel Canvas — Gundam Catapult Deck ──────────────────
// One-point perspective tunnel rendered on 2D canvas.
// Light particles drift toward the viewer from a vanishing point.
// Phases: idle (dim drift) → launching (accelerate + streak) → done (fade out).
// Audio-reactive: bass drives light intensity, procedural fallback when silent.

import { useEffect, useRef } from "react";
import { getAudioData } from "../useAudioEngine";

export type TunnelPhase = "idle" | "launching" | "done";

interface Props {
  phase: TunnelPhase;
}

const POOL_SIZE = 80;
const COLOR_A = "#FF4FD8"; // magenta — matches psycommu palette
const COLOR_B = "#1BBCB2"; // cyan
const COLOR_C = "#8B5CF6"; // violet

interface Particle {
  x: number; // tunnel-space wall position (-1..1)
  y: number;
  z: number; // depth (0 = far, 1 = at viewer)
  prevZ: number;
  color: string;
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
    const colors = [COLOR_A, COLOR_B, COLOR_C];
    for (let i = 0; i < POOL_SIZE; i++) {
      const z = Math.random();
      pool.push({
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z,
        prevZ: z,
        color: colors[i % 3],
      });
    }

    // ── State ──
    let speed = 0.12;
    let targetSpeed = 0.12;
    let tunnelAlpha = 1; // fades to 0 when done
    let flashIntensity = 0;
    let elapsed = 0;
    let lastT = performance.now();
    let raf = 0;

    const STAR_COUNT = 150;
    const stars: { x: number; y: number; r: number; tw: number }[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.3,
        tw: Math.random() * Math.PI * 2,
      });
    }

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((t - lastT) / 1000, 0.05);
      lastT = t;
      elapsed += dt;

      const currentPhase = phaseRef.current;
      const audio = getAudioData();

      // ── Phase transitions ──
      if (currentPhase === "launching") {
        targetSpeed = 5.0;
        flashIntensity = Math.min(flashIntensity + dt * 3, 1);
      } else if (currentPhase === "done") {
        targetSpeed = 0;
        tunnelAlpha = Math.max(tunnelAlpha - dt * 1.5, 0);
        if (tunnelAlpha <= 0.01) {
          // Canvas fully faded — stop rendering
          ctx.clearRect(0, 0, w, h);
          return;
        }
      } else {
        targetSpeed = 0.12;
        flashIntensity = Math.max(flashIntensity - dt * 2, 0);
      }

      speed += (targetSpeed - speed) * (currentPhase === "launching" ? 0.06 : 0.02);

      // ── Procedural pulse (simulated audio when silent) ──
      const pulse = audio.bass > 0.01
        ? audio.bass
        : 0.5 + 0.5 * Math.sin(elapsed * 2.5);

      // ── Clear ──
      ctx.clearRect(0, 0, w, h);

      // ── Draw starfield (visible as tunnel fades) ──
      if (tunnelAlpha < 1) {
        const starAlpha = (1 - tunnelAlpha) * 0.6;
        ctx.save();
        for (const s of stars) {
          const twinkle = 0.4 + 0.6 * Math.sin(elapsed * 3 + s.tw);
          ctx.globalAlpha = starAlpha * twinkle;
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.globalAlpha = tunnelAlpha;

      const cx = w / 2;
      const cy = h / 2;
      const maxRadius = Math.hypot(w, h) / 2;

      // ── Perspective grid — converging lines ──
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.04 + pulse * 0.03})`;
      ctx.lineWidth = 1;
      const gridLines = 16;
      for (let i = 0; i < gridLines; i++) {
        const angle = (i / gridLines) * Math.PI * 2;
        const ex = cx + Math.cos(angle) * maxRadius;
        const ey = cy + Math.sin(angle) * maxRadius;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }

      // ── Depth rings ──
      const ringCount = 8;
      const ringOffset = (elapsed * speed * 0.5) % 1;
      for (let i = 0; i < ringCount; i++) {
        const ringZ = ((i / ringCount) + ringOffset) % 1;
        const radius = ringZ * maxRadius;
        if (radius < 5) continue;
        const alpha = ringZ * (0.12 + pulse * 0.06);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 0.5 + ringZ * 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ── Light particles ──
      const isStreaking = speed > 1.5;

      for (const p of pool) {
        p.prevZ = p.z;
        p.z += speed * dt;
        if (p.z > 1.2) {
          // Recycle to far
          p.x = (Math.random() - 0.5) * 2;
          p.y = (Math.random() - 0.5) * 2;
          p.z = 0;
          p.prevZ = 0;
        }

        // Project to screen
        const scale = p.z * p.z; // non-linear depth curve
        const prevScale = p.prevZ * p.prevZ;
        const sx = cx + p.x * scale * maxRadius * 0.7;
        const sy = cy + p.y * scale * maxRadius * 0.7;
        const size = scale * (2 + pulse * 3);
        const brightness = scale * (0.5 + pulse * 0.5);

        if (size < 0.1) continue;

        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        if (isStreaking && p.z > 0.1) {
          // Draw as streak — line from previous position to current
          const psx = cx + p.x * prevScale * maxRadius * 0.7;
          const psy = cy + p.y * prevScale * maxRadius * 0.7;
          const grad = ctx.createLinearGradient(psx, psy, sx, sy);
          grad.addColorStop(0, hexA(p.color, 0));
          grad.addColorStop(1, hexA(p.color, brightness * 0.9));
          ctx.strokeStyle = grad;
          ctx.lineWidth = size;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(psx, psy);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        } else {
          // Draw as dot with glow
          ctx.globalAlpha = brightness * tunnelAlpha;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = size * 3;
          ctx.beginPath();
          ctx.arc(sx, sy, size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // ── Central flash (launch burst) ──
      if (flashIntensity > 0.01) {
        const flashR = maxRadius * flashIntensity * 0.8;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, flashR);
        grad.addColorStop(0, `rgba(255, 255, 255, ${flashIntensity * 0.9})`);
        grad.addColorStop(0.3, `rgba(255, 79, 216, ${flashIntensity * 0.4})`);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

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

// ── Hex + alpha → rgba string ──
function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
