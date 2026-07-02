// ── useMagnetic — magnetic button effect ──
// Buttons subtly pull toward the cursor when hovering near them.
// Premium tactile feel — used on NavPill, AudioBar, Contact links.
// Respects prefers-reduced-motion and touch devices (skipped).

import { useEffect, type RefObject } from "react";
import { gsap, PREFERS_REDUCED_MOTION } from "../lib/gsap";

interface MagneticOptions {
  /** How strongly the element pulls toward cursor (0-1). Default 0.3 */
  strength?: number;
  /** Max pull distance in px. Default 15 */
  radius?: number;
}

export function useMagnetic(
  ref: RefObject<HTMLElement | null>,
  { strength = 0.3, radius = 15 }: MagneticOptions = {},
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (PREFERS_REDUCED_MOTION) return;

    // Skip on touch devices — no cursor to track
    if (window.matchMedia("(hover: none)").matches) return;

    function onMouseMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      gsap.to(el!, {
        x: dx * strength,
        y: dy * strength,
        duration: 0.4,
        ease: "power3.out",
      });
    }

    function onMouseLeave() {
      gsap.to(el!, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.3)",
      });
    }

    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);

    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [ref, strength, radius]);
}
