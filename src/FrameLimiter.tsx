import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { PERF_TIER } from "./perf";

// ==========================================
// FRAME LIMITER — adaptive fps with runtime fallback
// ==========================================

// High tier: starts at 60fps, measures actual frame times for ~2 seconds.
// If the GPU can't sustain 45fps avg → silently drops to 30fps permanently.
// Low/mobile: locked at 30fps from start — never tries 60.
//
// In frameloop="demand" mode, R3F only renders when invalidate() is called.
// rAF auto-pauses when the tab is hidden — no manual visibility handling needed.

const INITIAL_FPS =
  PERF_TIER === "high" || PERF_TIER === "tablet" ? 60 : 30;
const FALLBACK_FPS = 30;
const SAMPLE_FRAMES = 120;       // ~2 sec at 60fps, ~4 sec at 30fps
const MIN_ACCEPTABLE_FPS = 45;   // below this → drop to 30

export default function FrameLimiter() {
  const invalidate = useThree((state) => state.invalidate);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const fpsRef = useRef(INITIAL_FPS);

  // Runtime benchmark state
  const sampleCountRef = useRef(0);
  const totalDeltaRef = useRef(0);
  const downgradedRef = useRef(INITIAL_FPS === FALLBACK_FPS);

  useEffect(() => {
    function loop(now: number) {
      rafRef.current = requestAnimationFrame(loop);

      const elapsed = now - lastTimeRef.current;
      const interval = 1000 / fpsRef.current;

      if (elapsed >= interval) {
        lastTimeRef.current = now - (elapsed % interval);
        invalidate();

        // Benchmark: measure actual frame times on high tier
        if (!downgradedRef.current && sampleCountRef.current < SAMPLE_FRAMES) {
          if (sampleCountRef.current > 0) {
            totalDeltaRef.current += elapsed;
          }
          sampleCountRef.current++;

          if (sampleCountRef.current >= SAMPLE_FRAMES) {
            const avgDelta = totalDeltaRef.current / (SAMPLE_FRAMES - 1);
            const avgFps = 1000 / avgDelta;
            if (avgFps < MIN_ACCEPTABLE_FPS) {
              fpsRef.current = FALLBACK_FPS;
              downgradedRef.current = true;
            }
          }
        }
      }
    }

    function onVisibilityChange() {
      if (document.hidden) {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      } else {
        if (rafRef.current === null) {
          lastTimeRef.current = 0;
          rafRef.current = requestAnimationFrame(loop);
        }
      }
    }

    rafRef.current = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [invalidate]);

  return null;
}
