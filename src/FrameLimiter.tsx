import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

// ==========================================
// 4. FRAME LIMITER + EXPORT
// ==========================================

// Caps render rate to 30fps using requestAnimationFrame (vsync-aligned).
// In frameloop="demand" mode, R3F only renders when invalidate() is called,
// so the GPU genuinely idles between frames instead of spinning at 60-120fps.
// rAF auto-pauses when the tab is hidden — no manual visibility handling needed.
export default function FrameLimiter({ fps = 30 }: { fps?: number }) {
  const invalidate = useThree((state) => state.invalidate);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const interval = 1000 / fps;

    function loop(now: number) {
      rafRef.current = requestAnimationFrame(loop);
      const elapsed = now - lastTimeRef.current;
      if (elapsed >= interval) {
        // Reset with remainder to avoid drift
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
  }, [fps, invalidate]);

  return null;
}
