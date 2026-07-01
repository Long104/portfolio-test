import { refractive, convex } from "refractive";

// ── Browser detection ──
// html2canvas (refractive's snapshot fallback) CANNOT read WebGL canvas
// pixels, so Firefox/Safari show solid #01314A instead of the vortex.
// Fix: use "simple" mode which applies CSS backdrop-filter:blur() directly —
// the browser's own GPU compositor CAN composite with the live WebGL canvas.
const IS_CHROME =
  typeof navigator !== "undefined" &&
  /Chrome|Chromium|Edg|OPR\//i.test(navigator.userAgent);

// Spread into config only on non-Chrome to skip html2canvas entirely.
const SIMPLE_FALLBACK = IS_CHROME ? {} : { fallbackMode: "simple" as const };

export const RefractiveDiv = refractive.div;

// ── Per-tier glass configs ──
// Different element sizes need different optical properties.
// All use bezelHeightFn: convex (squircle) — Apple's signature curve.

/** Large panel (About, Experience sections) */
export function buildPanelConfig(specularAngle: number) {
  return {
    radius: 28, blur: 3, glassThickness: 110, bezelWidth: 26,
    refractiveIndex: 1.5, specularOpacity: 0.8, specularAngle,
    bezelHeightFn: convex,
    ...SIMPLE_FALLBACK,
  };
}

/** Navigation bar / medium card (NavPill, ProjectCard) */
export function buildNavConfig(specularAngle: number) {
  return {
    radius: 22, blur: 2, glassThickness: 80, bezelWidth: 22,
    refractiveIndex: 1.5, specularOpacity: 0.7, specularAngle,
    bezelHeightFn: convex,
    ...SIMPLE_FALLBACK,
  };
}

/** Small control (Audio bar) */
export function buildSmallConfig(specularAngle: number) {
  return {
    radius: 18, blur: 1, glassThickness: 60, bezelWidth: 16,
    refractiveIndex: 1.5, specularOpacity: 0.6, specularAngle,
    bezelHeightFn: convex,
    ...SIMPLE_FALLBACK,
  };
}
