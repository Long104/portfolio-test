// ── useCursorSpecular ──
// On desktop: specular angle follows cursor position relative to viewport center.
// On mobile: falls back to device orientation (gyroscope).
//
// This makes the glass feel alive — the specular highlight tracks your cursor
// like light reflecting off a real glass pane under a fixed light source.
// Light source is fixed at upper-left (115°). Cursor movement shifts the
// perceived surface normal, causing the highlight to glide.

import { useState, useEffect, useRef } from "react";

const BASE_ANGLE = 2.007; // 115° — Apple's system-wide upper-left light
const CURSOR_RANGE = 0.35; // ±20° shift based on cursor offset from center
const CURSOR_SMOOTH = 0.08; // lerp for desktop
const ORIENT_RANGE = 0.349; // ±20° for device orientation
const ORIENT_SMOOTH = 0.1; // lerp for device orientation

export function useCursorSpecular(): number {
  const [angle, setAngle] = useState(BASE_ANGLE);
  const currentRef = useRef(BASE_ANGLE);
  const targetRef = useRef(BASE_ANGLE);
  const rafRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // ── Desktop: cursor position drives specular angle ──
    function onPointerMove(e: PointerEvent) {
      if (!mountedRef.current) return;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx; // -1..1
      const dy = (e.clientY - cy) / cy; // -1..1

      // Combine X/Y into a single angle offset
      // Cursor right → shift angle clockwise (lower)
      // Cursor down → slight shift
      const offset = dx * CURSOR_RANGE + dy * CURSOR_RANGE * 0.3;
      targetRef.current = BASE_ANGLE - offset;

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    // ── Mobile: device orientation drives specular angle ──
    function onOrientation(e: DeviceOrientationEvent) {
      if (!mountedRef.current) return;
      const gamma = e.gamma ?? 0; // -90 (right) to +90 (left)
      const normalized = Math.max(-1, Math.min(1, gamma / 45));
      targetRef.current = BASE_ANGLE - normalized * ORIENT_RANGE;

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    function tick() {
      rafRef.current = null;
      if (!mountedRef.current) return;

      // Use appropriate smoothing based on input source
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const smooth = isTouchDevice ? ORIENT_SMOOTH : CURSOR_SMOOTH;
      currentRef.current += (targetRef.current - currentRef.current) * smooth;
      setAngle(currentRef.current);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // Device orientation (mobile)
    if (typeof DeviceOrientationEvent !== "undefined") {
      if ("requestPermission" in DeviceOrientationEvent) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (DeviceOrientationEvent as any)
          .requestPermission()
          .then((state: string) => {
            if (state === "granted" && mountedRef.current) {
              window.addEventListener("deviceorientation", onOrientation);
            }
          })
          .catch(() => { /* denied */ });
      } else {
        window.addEventListener("deviceorientation", onOrientation);
      }
    }

    return () => {
      mountedRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, []);

  return angle;
}
