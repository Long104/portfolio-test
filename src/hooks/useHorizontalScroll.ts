// ── useHorizontalScroll ──
// Pinned horizontal scroll for the Work section.
// Pins the container on scroll, then translates its inner track
// horizontally so projects scroll horizontally instead of vertically.
//
// Pattern: ScrollTrigger pin + gsap.fromTo track x scrub.
// Reduced-motion: no-ops (horizontal scroll is motion).
//
// Usage:
//   const tweenRef = useRef<gsap.core.Tween>(null);
//   useHorizontalScroll(containerRef, trackRef, started, tweenRef);
//   // Later: tweenRef.current can be used as containerAnimation

import { useEffect } from "react";
import type { MutableRefObject } from "react";
import { gsap, ScrollTrigger, PREFERS_REDUCED_MOTION } from "../lib/gsap";
import { PERF_TIER } from "../perf";

/**
 * Pins `containerRef` and horizontally scrolls `trackRef` on vertical scroll.
 * Stores the tween in `tweenRef` so per-card ScrollTriggers can use it
 * as their `containerAnimation`.
 */
export function useHorizontalScroll(
  container: React.RefObject<HTMLElement | null>,
  track: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  tweenRef?: MutableRefObject<gsap.core.Tween | null>,
) {
  useEffect(() => {
    if (!enabled || PREFERS_REDUCED_MOTION || PERF_TIER === "mobile") return;
    const c = container.current;
    const t = track.current;
    if (!c || !t) return;

    // Calculate how far the track must travel
    const scrollDistance = t.scrollWidth - c.clientWidth;
    if (scrollDistance <= 0) return;

    // Create the tween: pin container + scrub track x
    const tween = gsap.fromTo(
      t,
      { x: 0 },
      {
        x: -scrollDistance,
        ease: "none",
        scrollTrigger: {
          trigger: c,
          pin: true,
          start: "top top",
          end: "+=" + scrollDistance,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      },
    );

    // Expose the tween for containerAnimation usage
    if (tweenRef) tweenRef.current = tween;

    // Refresh on resize to recalculate
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("resize", refresh);

    return () => {
      window.removeEventListener("resize", refresh);
      if (tweenRef) tweenRef.current = null;
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [container, track, enabled, tweenRef]);
}
