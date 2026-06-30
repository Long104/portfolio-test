// ── useScrollReveal ──
// Scroll-triggered SplitText reveal hook.
// Wraps text into words/lines/chars, then animates in with:
//   • overflow:hidden mask (text rises into a window)
//   • clip-path wipe (left→right)
//   • optional blur→clear
//   • stagger between units
//
// Uses ScrollTrigger.create() wrapping a timeline — NOT scrollTrigger
// on individual tweens (documented GSAP anti-pattern that breaks
// immediateRender, causing text to "pop" instead of animate).
//
// Compiler-safe: uses useGSAP with scope + revertOnUpdate.
// Same imperative-escape pattern as KiraKiraVortex.tsx.

import { useRef, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, SplitText, PREFERS_REDUCED_MOTION } from "../lib/gsap";
import { PERF_TIER } from "../perf";

// ── Options ──
export interface ScrollRevealOptions {
  /** Split type — default 'words' */
  split?: "words" | "lines" | "chars";
  /** Stagger delay between units (seconds) — auto-tuned for mobile */
  stagger?: number;
  /** translateY start value — auto-tuned for mobile */
  y?: string;
  /** Enable clip-path wipe (inset left→right) */
  clipWipe?: boolean;
  /** Enable blur→clear */
  blur?: boolean;
  /** ScrollTrigger scrub: true|number = scroll-linked, false = play once */
  scrub?: boolean | number;
  /** ScrollTrigger start position — default 'top 80%' */
  start?: string;
  /** Play only once — default true */
  once?: boolean;
  /** Ease for individual unit animations */
  ease?: string;
  /** Duration per unit animation (seconds) */
  duration?: number;
}

const DEFAULTS: Required<Pick<
  ScrollRevealOptions,
  "split" | "stagger" | "y" | "clipWipe" | "blur" | "scrub" | "start" | "once" | "ease" | "duration"
>> = {
  split: "words",
  stagger: 0.08,
  y: "120%",
  clipWipe: true,
  blur: false,
  scrub: 1,
  start: "top 80%",
  once: true,
  ease: "power4.out",
  duration: 0.8,
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
      if (PREFERS_REDUCED_MOTION) {
        el.style.visibility = "visible";
        return;
      }

      // ── Mobile tuning: halve stagger and y offset ──
      const isMobile = PERF_TIER === "mobile";
      const opts = { ...DEFAULTS, ...options };
      const stagger = isMobile ? (opts.stagger as number) * 0.5 : (opts.stagger as number);
      const yVal = opts.y; // guaranteed string from DEFAULTS
      const blur = isMobile ? false : opts.blur;
      const duration = isMobile ? (opts.duration as number) * 0.6 : (opts.duration as number);

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
      gsap.set(el, { clipPath: opts.clipWipe ? "inset(0 100% 0 0)" : "none" });
      gsap.set(targets, {
        y: yVal,
        opacity: 0,
        ...(blur ? { filter: "blur(6px)" } : {}),
      });

      // ── Build timeline (NO scrollTrigger on individual tweens) ──
      const tl = gsap.timeline();

      // Tween 1: units rise in + fade in
      tl.to(targets, {
        y: "0%",
        opacity: 1,
        filter: "blur(0px)",
        stagger,
        duration,
        ease: opts.ease,
      });

      // Tween 2: clip-path wipe (parallel — runs at same time as tween 1)
      if (opts.clipWipe) {
        tl.to(
          el,
          {
            clipPath: "inset(0 0% 0 0)",
            duration: duration + stagger * targets.length * 0.5,
            ease: "power2.out",
          },
          "<" // start at same position as tween 1
        );
      }

      // ── ScrollTrigger drives the entire timeline ──
      const scrubVal = opts.scrub === false ? false : opts.scrub === true ? 1 : opts.scrub;

      ScrollTrigger.create({
        trigger: el,
        start: opts.start,
        animation: tl,
        once: opts.once,
        ...(scrubVal !== false ? { scrub: scrubVal } : { toggleActions: "play none none none" }),
      });

      // ── Cleanup: revert split on unmount / re-render ──
      return () => {
        split.revert();
        ScrollTrigger.getAll().forEach((st) => {
          if (st.trigger === el) st.kill();
        });
      };
    },
    { scope: ref, revertOnUpdate: true }
  );

  return ref;
}
