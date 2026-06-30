// ── useScrollReveal ──
// Scroll-triggered SplitText reveal hook.
// Wraps text into words/lines/chars, then animates in with:
//   • overflow:hidden mask (text rises into a window)
//   • optional clip-path wipe (left→right)
//   • optional blur→clear
//   • stagger between units
//
// Pattern: scrollTrigger on the TIMELINE (not on individual tweens).
// toggleActions: "play none none none" = play once on enter.
// This is the SOTD portfolio standard.
//
// Compiler-safe: uses useGSAP with scope + revertOnUpdate.

import { useRef, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText, PREFERS_REDUCED_MOTION } from "../lib/gsap";
import { PERF_TIER } from "../perf";

// ── Options ──
export interface ScrollRevealOptions {
  /** Split type — default 'words' */
  split?: "words" | "lines" | "chars";
  /** Stagger delay between units (seconds) — auto-tuned for mobile */
  stagger?: number;
  /** translateY start value */
  y?: string;
  /** Enable clip-path wipe (inset left→right) */
  clipWipe?: boolean;
  /** Enable blur→clear */
  blur?: boolean;
  /** ScrollTrigger start position — default 'top 85%' */
  start?: string;
  /** Ease for individual unit animations */
  ease?: string;
  /** Duration per unit animation (seconds) */
  duration?: number;
  /** Delay before animation starts (seconds) */
  delay?: number;
}

const DEFAULTS: Required<Pick<
  ScrollRevealOptions,
  "split" | "stagger" | "y" | "clipWipe" | "blur" | "start" | "ease" | "duration" | "delay"
>> = {
  split: "words",
  stagger: 0.08,
  y: "120%",
  clipWipe: false,
  blur: false,
  start: "top 85%",
  ease: "power4.out",
  duration: 0.8,
  delay: 0,
} as const;

// ── Hook ──
export function useScrollReveal<T extends HTMLElement>(
  options: ScrollRevealOptions = {}
): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      // ── Reduced motion: show text static, no animation ──
      if (PREFERS_REDUCED_MOTION) return;

      // ── Mobile tuning ──
      const isMobile = PERF_TIER === "mobile";
      const opts = { ...DEFAULTS, ...options };
      const stagger = isMobile ? (opts.stagger as number) * 0.5 : (opts.stagger as number);
      const yVal = opts.y;
      const blur = isMobile ? false : opts.blur;
      const duration = isMobile ? (opts.duration as number) * 0.7 : (opts.duration as number);
      const delay = opts.delay;

      // ── SplitText: mask wraps lines in overflow:hidden ──
      const split = new SplitText(el, {
        type: opts.split,
        mask: "lines",
        linesClass: "split-line",
        wordsClass: "split-word",
        charsClass: "split-char",
      });

      const targets =
        opts.split === "lines"
          ? split.lines
          : opts.split === "chars"
            ? split.chars
            : split.words;

      if (targets.length === 0) return;

      // ── Set initial state immediately (prevents flash of visible text) ──
      gsap.set(targets, {
        y: yVal,
        opacity: 0,
        willChange: "transform, opacity",
        ...(blur ? { filter: "blur(6px)" } : {}),
      });

      if (opts.clipWipe) {
        gsap.set(el, { clipPath: "inset(0 100% 0 0)" });
      }

      // ── Build timeline with scrollTrigger ON THE TIMELINE ──
      // (NOT on individual tweens — that's the documented anti-pattern)
      const tl = gsap.timeline({
        delay,
        defaults: { ease: opts.ease },
        scrollTrigger: {
          trigger: el,
          start: opts.start,
          toggleActions: "play none none none",
          scroller: document.body,
        },
      });

      // Tween 1: units rise + fade in
      tl.to(targets, {
        y: "0%",
        opacity: 1,
        filter: "blur(0px)",
        stagger,
        duration,
      });

      // Tween 2: clip-path wipe (parallel with tween 1)
      if (opts.clipWipe) {
        tl.to(
          el,
          {
            clipPath: "inset(0 0% 0 0)",
            duration: duration + stagger * targets.length * 0.5,
            ease: "power2.out",
          },
          "<"
        );
      }

      // ── Cleanup: revert split + kill timeline ──
      return () => {
        split.revert();
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: ref, revertOnUpdate: true }
  );

  return ref;
}
