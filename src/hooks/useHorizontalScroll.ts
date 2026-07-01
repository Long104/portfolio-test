// ── useHorizontalScroll ──
// Pinned horizontal scroll for the Work section.
// Pins the container on scroll, then translates its inner track
// horizontally so projects scroll horizontally instead of vertically.
//
// Pattern: ScrollTrigger pin + gsap.fromTo track x scrub.
// Reduced-motion: no-ops (horizontal scroll is motion).
//
// Usage:
//   useHorizontalScroll(containerRef, trackRef, started)

import { useEffect } from "react";
import { gsap, ScrollTrigger, PREFERS_REDUCED_MOTION } from "../lib/gsap";

/**
 * Pins `containerRef` and horizontally scrolls `trackRef` on vertical scroll.
 * @param container The pinned <section> element
 * @param track The inner <div> containing flex items
 * @param enabled When false, skips setup
 */
export function useHorizontalScroll(
  container: React.RefObject<HTMLElement | null>,
  track: React.RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled || PREFERS_REDUCED_MOTION) return;
    const c = container.current;
    const t = track.current;
    if (!c || !t) return;

    // Calculate how far the track must travel.
    // Subtract RIGHT_GAP so the last card doesn't hit the edge —
    // it stops with visible breathing room on the right.
    const RIGHT_GAP = 80;
    const scrollDistance = Math.max(0, t.scrollWidth - c.clientWidth - RIGHT_GAP);
    if (scrollDistance <= 0) return;

    // Create the timeline: pin container + scrub track x
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

    // Refresh on resize to recalculate
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("resize", refresh);

    return () => {
      window.removeEventListener("resize", refresh);
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [container, track, enabled]);
}
