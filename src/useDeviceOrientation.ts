// ── useDeviceOrientation ──
// Maps device tilt (gamma) to a specularAngle for the glass effect.
// Throttled to rAF (~30fps). Falls back to default when gyro unavailable.

import { useState, useEffect, useRef } from "react";

const DEFAULT_ANGLE = 2.007; // ~115°

export function useDeviceOrientation(): number {
  const [specularAngle, setSpecularAngle] = useState(DEFAULT_ANGLE);
  const pendingRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    function handleOrientation(e: DeviceOrientationEvent) {
      if (!mounted) return;
      const g = e.gamma ?? 0;
      const angle = ((g + 90) / 180) * Math.PI * 2; // 0 to 2π

      // rAF throttle
      if (pendingRef.current === null) {
        pendingRef.current = requestAnimationFrame(() => {
          pendingRef.current = null;
          setSpecularAngle(angle);
        });
      }
    }

    // iOS 13+ requires permission request
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      "requestPermission" in DeviceOrientationEvent
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (DeviceOrientationEvent as any)
        .requestPermission()
        .then((state: string) => {
          if (state === "granted" && mounted) {
            window.addEventListener("deviceorientation", handleOrientation);
          }
        })
        .catch(() => { /* permission denied — use default */ });
    } else if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    return () => {
      mounted = false;
      if (pendingRef.current !== null) cancelAnimationFrame(pendingRef.current);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  return specularAngle;
}
