import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { getScrollState } from "./scrollStore";

// ==========================================
// FRAME LIMITER — adaptive fps with idle throttling
// ==========================================
//
// All tiers start at 30fps to reduce thermal throttling during scroll.
// When the user stops scrolling (velocity drops to 0 for 2s), drops to 15fps
// to let the GPU rest while keeping the tunnel visible with subtle animation.
// Any scroll input immediately restores full 30fps.
//
// In frameloop="demand" mode, R3F only renders when invalidate() is called.

const ACTIVE_FPS = 30;
const IDLE_FPS = 15;
const IDLE_TIMEOUT_MS = 2000;  // 2 seconds of no scroll → idle

export default function FrameLimiter() {
  const invalidate = useThree((state) => state.invalidate);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const fpsRef = useRef<number>(ACTIVE_FPS);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Watch scroll velocity — if near-zero for IDLE_TIMEOUT_MS, switch to idle fps
  useEffect(() => {
    function checkIdle() {
      const velocity = getScrollState().velocity;
      if (velocity < 0.5) {
        // User has stopped scrolling — start idle timer
        if (!idleTimerRef.current) {
          idleTimerRef.current = setTimeout(() => {
            idleTimerRef.current = null;
            fpsRef.current = IDLE_FPS;
          }, IDLE_TIMEOUT_MS);
        }
      } else {
        // User is scrolling — cancel idle timer, restore active fps
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
          idleTimerRef.current = null;
          fpsRef.current = ACTIVE_FPS;
        }
      }
    }

    const interval = setInterval(checkIdle, 200); // check every 200ms
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function loop(now: number) {
      rafRef.current = requestAnimationFrame(loop);

      const elapsed = now - lastTimeRef.current;
      const interval = 1000 / fpsRef.current;

      if (elapsed >= interval) {
        lastTimeRef.current = now - (elapsed % interval);
        invalidate();
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
