// ── GSAP Foundation ──
// Central registration + reduced-motion detection.
// Import once in main.tsx to ensure plugins are available globally.

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

// NOTE: Do NOT call ScrollTrigger.defaults({ scroller }) here.
// In Lenis 1.x window mode, native window.scrollY still works.
// ScrollTrigger reads it natively. A scrollerProxy is only needed
// for wrapper-mode Lenis (custom scroll div), which we don't use.
// Setting it here (before Lenis exists) breaks all triggers.

// ── Reduced motion ──
// Checked by hooks — if true, all SplitText reverts immediately.
export const PREFERS_REDUCED_MOTION =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger, SplitText };
