// ── useHorizontalScroll ──
// Pinned horizontal scroll for the Work section.
// Pins the container on scroll, then translates its inner track
// horizontally so projects scroll horizontally instead of vertically.
//
// Pattern: ScrollTrigger pin + gsap.fromTo track x scrub.
// Reduced-motion: no-ops (horizontal scroll is motion).
// Responsive: uses matchMedia("(max-width: 768px)") to dynamically
// destroy/recreate the tween when viewport crosses the CSS breakpoint.
//
// Usage:
//   const tweenRef = useRef<gsap.core.Tween>(null);
//   useHorizontalScroll(containerRef, trackRef, started, tweenRef);
//   // Later: tweenRef.current can be used as containerAnimation

import { useEffect } from "react";
import type { MutableRefObject } from "react";
import { gsap, ScrollTrigger, PREFERS_REDUCED_MOTION } from "../lib/gsap";

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
    const c = container.current;
    const t = track.current;
    if (!c || !t) return;

    // ── Media query matching the CSS breakpoint ──
    // When this matches (≤768px), horizontal scroll is destroyed.
    const mq = window.matchMedia("(max-width: 768px)");

    let tween: gsap.core.Tween | null = null;

    // ── Create the pinned horizontal scroll tween ──
    function createTween() {
      if (!c || !t) return;
      // Already exists? Kill first so we can re-create fresh.
      destroyTween();

      if (!enabled || PREFERS_REDUCED_MOTION) return;

      const scrollDistance = t.scrollWidth - c.clientWidth;
      if (scrollDistance <= 0) return;

      tween = gsap.fromTo(
        t,
        { x: 0 },
        {
          x: -scrollDistance,
          ease: "none",
          scrollTrigger: {
            trigger: c,
            pin: true,
            start: "top top",
            end: () => "+=" + (t.scrollWidth - c.clientWidth),
            scrub: 1,
            invalidateOnRefresh: true,
          },
        },
      );

      if (tweenRef) tweenRef.current = tween;
      ScrollTrigger.refresh();
    }

    // ── Destroy the tween and reset ──
    function destroyTween() {
      if (!t) return;
      if (tween) {
        tween.scrollTrigger?.kill();
        tween.kill();
        tween = null;
        gsap.set(t, { x: 0 });
        if (tweenRef) tweenRef.current = null;
        ScrollTrigger.refresh();
      }
    }

    // ── React to viewport crossing the breakpoint ──
    // Uses two mechanisms:
    //   1. matchMedia "change" event — fires in real browsers on resize/orientation
    //   2. window "resize" event — fallback for headless/test environments where
    //      matchMedia change doesn't fire (e.g. CDP viewport resizing)
    function syncTween() {
      if (mq.matches) {
        destroyTween();
      } else {
        createTween();
      }
    }

    function handleChange() {
      syncTween();
    }

    function handleResize() {
      // Only act if the mq state actually changed (not every resize pixel)
      if ((mq.matches && tween) || (!mq.matches && !tween)) {
        syncTween();
      }
    }

    // ── Initial setup ──
    if (!mq.matches) {
      createTween();
    }

    // ── Listen for dynamic resize / orientation changes ──
    mq.addEventListener("change", handleChange);
    window.addEventListener("resize", handleResize);

    return () => {
      mq.removeEventListener("change", handleChange);
      window.removeEventListener("resize", handleResize);
      destroyTween();
    };
    // Deliberately re-run when refs/enabled change (refs are stable in practice,
    // but React may call the callback with a new closure).
  }, [container, track, enabled, tweenRef]);
}
