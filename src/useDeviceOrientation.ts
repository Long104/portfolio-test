// ── useDeviceOrientation ──
// Apple Liquid Glass-style specular tilt.
// Light is world-fixed at 115° (upper-left). Device tilt shifts the
// highlight ±20° with lerp smoothing — like tilting a real glass pane
// under a desk lamp. Highlight glides, never orbits.
//
// On mobile, the angle is quantized to 3° steps to avoid excessive
// SVG filter recalculations (refractive library). Desktop passes through
// the smooth value — but deviceorientation rarely fires on desktop anyway.
//
// iOS 13+ requires DeviceOrientationEvent.requestPermission() inside a
// user gesture. The hook attaches the listener immediately on non-iOS;
// on iOS it waits for requestOrientationPermission() to be called from
// a click handler (App.tsx calls it during LAUNCH).

import { useState, useEffect, useRef } from "react";
import { PERF_TIER } from "./perf";

const BASE_ANGLE = 2.007;   // 115° in radians — Apple's system-wide upper-left light
const TILT_RANGE = 0.349;   // ±20° in radians — subtle parallax shift
const SMOOTHING = 0.1;      // lerp factor — glide, don't snap
const QUANTIZE_STEP = 0.0524; // 3° in radians — mobile only

const SHOULD_QUANTIZE = PERF_TIER === "mobile";

// ── Module-level permission state (shared across all hook instances) ──
type PermState = "unknown" | "granted" | "denied" | "not-needed";
let permState: PermState = "unknown";

// Subscribers waiting for permission result (iOS path)
type Listener = (e: DeviceOrientationEvent) => void;
const pendingListeners = new Set<Listener>();

function isIOSPermissionRequired(): boolean {
  return (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission === "function"
  );
}

/**
 * Call this from a user gesture (click/tap) to request orientation permission on iOS.
 * On non-iOS browsers this is a no-op. Safe to call multiple times.
 */
export function requestOrientationPermission(): void {
  if (permState !== "unknown") return;

  if (!isIOSPermissionRequired()) {
    permState = "not-needed";
    return;
  }

  permState = "denied"; // pessimistic default until granted

  try {
    const result = (DeviceOrientationEvent as unknown as {
      requestPermission: () => Promise<string>;
    }).requestPermission();

    result
      .then((state: string) => {
        permState = state === "granted" ? "granted" : "denied";
        if (permState === "granted") {
          // Attach all pending listeners now
          pendingListeners.forEach((fn) => {
            window.addEventListener("deviceorientation", fn);
          });
        }
      })
      .catch(() => { /* permission denied — stay at base angle */ });
  } catch {
    // requestPermission threw synchronously — not in a gesture context
    permState = "unknown"; // allow retry on next gesture
  }
}

export function useDeviceOrientation(): number {
  const [specularAngle, setSpecularAngle] = useState(BASE_ANGLE);
  const currentRef = useRef(BASE_ANGLE);
  const quantizedRef = useRef(BASE_ANGLE);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    function handleOrientation(e: DeviceOrientationEvent) {
      if (!mounted) return;
      const gamma = e.gamma ?? 0; // -90 (right) to +90 (left)

      // Clamp to ±45° comfortable handheld range, normalize to [-1, 1]
      const normalized = Math.max(-1, Math.min(1, gamma / 45));

      // Target: base shifted by tilt (inverted — parallax)
      // Tilt right → glass rotates clockwise → highlight shifts left (lower angle)
      const target = BASE_ANGLE - (normalized * TILT_RANGE);

      // Smooth lerp toward target
      currentRef.current += (target - currentRef.current) * SMOOTHING;

      // rAF throttle — skip if a frame is already pending
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;

          if (SHOULD_QUANTIZE) {
            // Only update React state when quantized angle crosses a 3° threshold
            const quantized = Math.round(currentRef.current / QUANTIZE_STEP) * QUANTIZE_STEP;
            if (quantized !== quantizedRef.current) {
              quantizedRef.current = quantized;
              setSpecularAngle(quantized);
            }
          } else {
            setSpecularAngle(currentRef.current);
          }
        });
      }
    }

    // ── Attach listener based on permission state ──
    if (permState === "granted" || permState === "not-needed") {
      window.addEventListener("deviceorientation", handleOrientation);
    } else if (permState === "unknown" && !isIOSPermissionRequired()) {
      // Non-iOS browser with DeviceOrientationEvent — no permission needed
      permState = "not-needed";
      window.addEventListener("deviceorientation", handleOrientation);
    } else {
      // iOS: permission not yet requested. Register as pending —
      // requestOrientationPermission() (called from LAUNCH tap) will
      // attach the listener if granted.
      pendingListeners.add(handleOrientation);
    }

    return () => {
      mounted = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("deviceorientation", handleOrientation);
      pendingListeners.delete(handleOrientation);
    };
  }, []);

  return specularAngle;
}
