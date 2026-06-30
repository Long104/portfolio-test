// ── GSAP Foundation ──
// Central registration + reduced-motion detection.
// Import once in main.tsx to ensure plugins are available globally.

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

// ── Default scroller ──
// All ScrollTriggers use document.body as scroller by default.
// ScrollContainer sets up a scrollerProxy that feeds Lenis's virtual
// scroll position to ScrollTrigger (required because Lenis freezes
// native window.scrollY).
ScrollTrigger.defaults({ scroller: document.body });

// ── Reduced motion ──
// Checked by hooks — if true, all SplitText reverts immediately.
export const PREFERS_REDUCED_MOTION = false;
// Production: swap back to:
//   typeof window !== "undefined" &&
//   window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger, SplitText };
