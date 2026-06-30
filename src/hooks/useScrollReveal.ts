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
  /** translateX start value — when set, animates from left instead of bottom */
  x?: string;
  /** Enable clip-path wipe (inset left→right) */
  clipWipe?: boolean;
  /** Enable blur→clear */
  blur?: boolean;
  /** ScrollTrigger start position — default 'top 85%'. Set `scroll: false` to skip scrollTrigger. */
  start?: string;
  /** When false, plays animation immediately (with delay) instead of on scroll. */
  scroll?: boolean;
  /** Ease for individual unit animations */
  ease?: string;
  /** Duration per unit animation (seconds) */
  duration?: number;
  /** Delay before animation starts (seconds) */
  delay?: number;
}

const DEFAULTS: Required<Pick<
  ScrollRevealOptions,
  "split" | "stagger" | "y" | "x" | "clipWipe" | "blur" | "start" | "scroll" | "ease" | "duration" | "delay"
>> = {
  split: "words",
  stagger: 0.08,
  y: "120%",
  x: "0%",
  clipWipe: false,
  blur: false,
  start: "top 85%",
  scroll: true,
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

      // ── Reduced motion: gentle fade-only reveal ──
      // No y-movement, no blur, no clipWipe, no stagger — opacity crossfade only.
      // Still runs SplitText so text layout is correct (same split classes as full path).
      if (PREFERS_REDUCED_MOTION) {
        const opts = { ...DEFAULTS, ...options };
        const split = new SplitText(el, {
          type: opts.split,
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
        gsap.set(targets, { opacity: 0 });
        gsap.to(targets, { opacity: 1, duration: 0.4, ease: "power2.out" });
        return () => { split.revert(); };
      }

      // ── Mobile tuning ──
      const isMobile = PERF_TIER === "mobile";
      const opts = { ...DEFAULTS, ...options };
      const stagger = isMobile ? (opts.stagger as number) * 0.5 : (opts.stagger as number);
      const yVal = opts.y;
      const xVal = opts.x;
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
      // When x is set (slide-from-left), y stays at 0 — horizontal-only motion.
      // When x is "0%" (default), y provides the vertical rise.
      gsap.set(targets, {
        y: xVal !== "0%" ? "0%" : yVal,
        x: xVal !== "0%" ? xVal : "0%",
        opacity: 0,
        willChange: "transform, opacity",
        ...(blur ? { filter: "blur(6px)" } : {}),
      });

      if (opts.clipWipe) {
        gsap.set(el, { clipPath: "inset(0 100% 0 0)" });
      }

      // ── Build timeline (scroll or auto-play) ──
      // scrollTrigger on the TIMELINE (NOT on individual tweens — anti-pattern).
      // When scroll=false, the timeline auto-plays immediately (with delay) — used
      // for the hero section which should animate after boot clears, not on scroll.
      const tlCfg: gsap.TimelineVars = {
        defaults: { ease: opts.ease },
      };

      if (opts.scroll) {
        tlCfg.scrollTrigger = {
          trigger: el,
          start: opts.start,
          toggleActions: "play none none none",
          scroller: document.body,
        };
      }

      const tl = gsap.timeline(tlCfg);

      // Tween 1: units slide/fade in
      // When x is set, animates x→0 (slide from left). Otherwise y→0 (rise).
      // NOTE: delay goes on the TWEEN, NOT timeline — ScrollTrigger's "play"
      // action bypasses timeline-level delay.
      tl.to(targets, {
        y: xVal !== "0%" ? "0%" : "0%",
        x: xVal !== "0%" ? "0%" : "0%",
        opacity: 1,
        filter: "blur(0px)",
        stagger,
        duration,
        delay,
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
