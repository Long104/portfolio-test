// ── useGlassInteraction ──
// Cursor-reactive liquid glass: internal illumination + 3D tilt.
// Inspired by Apple's Liquid Glass "internal illumination on interaction".
//
// Attaches to a PARENT wrapper div (not the RefractiveDiv itself).
// Sets CSS custom properties that cascade down to the RefractiveDiv child:
//   --glow-bg: radial gradient with alpha baked in
//   --tilt-x, --tilt-y: degrees for perspective tilt
//
// The parent wrapper applies transform (safe — no backdrop-filter).
// The child RefractiveDiv applies background-image (safe — no composited pseudo-elements).
//
// NO CSS transitions — Chrome compositor bug breaks backdrop-filter: url().

import { useEffect, useRef, type RefObject } from "react";

interface GlassInteractionOptions {
  /** Max tilt in degrees. 0 disables tilt. Default: 4 */
  maxTilt?: number;
  /** Lerp factor for tilt smoothing. Default: 0.12 */
  tiltSmooth?: number;
  /** Lerp factor for glow position. Default: 0.25 */
  glowSmooth?: number;
  /** Glow radius as CSS value. Default: "40%" */
  glowRadius?: string;
  /** Glow color (rgba). Default: theme accent */
  glowColor?: string;
}

interface GlassInteractionHandle {
  ref: RefObject<HTMLDivElement | null>;
}

// Parse an rgba() string and scale its alpha value.
function scaleAlpha(rgba: string, alpha: number): string {
  const match = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,?\s*([\d.]*)\s*\)/);
  if (match) {
    const baseAlpha = parseFloat(match[4]) || 1;
    return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${(baseAlpha * alpha).toFixed(4)})`;
  }
  // Fallback: try to find the last number before the closing paren
  return rgba.replace(/,\s*([\d.]+)\s*\)/, `, ${(alpha).toFixed(4)})`);
}

export function useGlassInteraction(
  options: GlassInteractionOptions = {},
): GlassInteractionHandle {
  const {
    maxTilt = 4,
    tiltSmooth = 0.12,
    glowSmooth = 0.25,
    glowRadius = "40%",
    glowColor = "rgba(255, 79, 216, 0.15)",
  } = options;

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // ── State ──
    let isHovering = false;
    let rawX = 0.5; // normalized 0..1
    let rawY = 0.5;
    let smoothX = 0.5;
    let smoothY = 0.5;
    let tiltX = 0; // degrees
    let tiltY = 0;
    let glowActive = 0; // 0..1
    let rafId: number | undefined;

    function kick(): void {
      if (rafId === undefined) {
        rafId = requestAnimationFrame(tick);
      }
    }

    function onPointerEnter(): void {
      isHovering = true;
      kick();
    }

    function onPointerLeave(): void {
      isHovering = false;
      kick();
    }

    function onPointerMove(e: PointerEvent): void {
      const rect = el!.getBoundingClientRect();
      rawX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      rawY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      kick();
    }

    function tick(_now: number): void {
      // ── Smooth interpolation ──
      smoothX += (rawX - smoothX) * glowSmooth;
      smoothY += (rawY - smoothY) * glowSmooth;

      // Glow active state — fade in fast, fade out slow
      const targetGlow = isHovering ? 1 : 0;
      glowActive += (targetGlow - glowActive) * (isHovering ? 0.15 : 0.08);

      // ── Tilt: rotateX/Y based on cursor offset from center ──
      if (maxTilt > 0) {
        const targetTiltY = (smoothX - 0.5) * maxTilt * 2;
        const targetTiltX = -(smoothY - 0.5) * maxTilt * 2;
        tiltX += (targetTiltX - tiltX) * tiltSmooth;
        tiltY += (targetTiltY - tiltY) * tiltSmooth;
      }

      // ── Apply CSS custom properties on this element ──
      // Child RefractiveDiv inherits these via CSS cascade.
      const glowWithAlpha = scaleAlpha(glowColor, glowActive);
      el!.style.setProperty(
        "--glow-bg",
        `radial-gradient(circle ${glowRadius} at ${smoothX * 100}% ${smoothY * 100}%, ${glowWithAlpha}, transparent)`,
      );

      if (maxTilt > 0) {
        el!.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
        el!.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
      }

      // ── Stop when at rest ──
      const tiltDone = maxTilt === 0 || (Math.abs(tiltX) < 0.01 && Math.abs(tiltY) < 0.01);
      const glowDone = glowActive < 0.001;
      const posDone =
        Math.abs(rawX - smoothX) < 0.001 &&
        Math.abs(rawY - smoothY) < 0.001;

      if (!tiltDone || !glowDone || !posDone) {
        rafId = requestAnimationFrame(tick);
      } else {
        el!.style.setProperty("--glow-bg", "transparent");
        if (maxTilt > 0) {
          el!.style.setProperty("--tilt-x", "0deg");
          el!.style.setProperty("--tilt-y", "0deg");
        }
        rafId = undefined;
      }
    }

    el.addEventListener("pointerenter", onPointerEnter);
    el.addEventListener("pointerleave", onPointerLeave);
    el.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      el.removeEventListener("pointerenter", onPointerEnter);
      el.removeEventListener("pointerleave", onPointerLeave);
      el.removeEventListener("pointermove", onPointerMove);
      if (rafId !== undefined) cancelAnimationFrame(rafId);
    };
  }, [maxTilt, tiltSmooth, glowSmooth, glowRadius, glowColor]);

  return { ref };
}
