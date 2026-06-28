import { PERF_TIER } from "../perf";

// Shared refraction config — liquid glass effect
// Mobile uses "simple" mode (just blur) to save GPU for the WebGL vortex
const isMobile = PERF_TIER === "mobile";

export const refraction = {
  radius: 16,
  blur: 3,
  bezelWidth: 8,
  glassThickness: 50,
  renderMode: isMobile ? ("simple" as const) : ("auto" as const),
};
