// --- Adaptive perf tier (replaces hardcoded counts) ---
// Cheap heuristic: UA + cores + RAM. Good enough before first frame;
// R3F `performance` prop then drops DPR further if FPS dips at runtime.
//
// Four tiers:
//   mobile — phones (30fps, 1.0 DPR, 2000 particles, no blur, quantized orientation)
//   tablet — iPads, Android tablets (60fps, 1.25 DPR, 4500 particles, blur, smooth)
//   low    — low-end desktops (60fps, 1.25 DPR, 3500 particles, blur, smooth)
//   high   — high-end desktops (60fps, 1.5 DPR, 5500 particles, blur, smooth)
export type PerfTier = "mobile" | "tablet" | "low" | "high";

export function detectPerfTier(): PerfTier {
  if (typeof navigator === "undefined") return "high";
  const ua = navigator.userAgent;

  // iPad in Safari 13+ reports "Macintosh" UA when "Request Desktop Site" is on.
  // Detect via touch support on a Mac UA.
  const isIpad =
    /iPad/i.test(ua) ||
    (/Macintosh/i.test(ua) && "ontouchend" in document);

  // Android tablets don't include "Mobile" in their UA string
  const isAndroidTablet = /Android/i.test(ua) && !/Mobile/i.test(ua);

  if (isIpad || isAndroidTablet) return "tablet";

  const isPhone =
    /iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    (/Android/i.test(ua) && /Mobile/i.test(ua));
  if (isPhone) return "mobile";

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as { deviceMemory?: number }).deviceMemory ?? 4;
  if (cores <= 4 || memory <= 4) return "low";
  return "high";
}

export const PERF_TIER = detectPerfTier();
export const PAINT_COUNT =
  PERF_TIER === "mobile"
    ? 2000
    : PERF_TIER === "tablet"
      ? 4500
      : PERF_TIER === "low"
        ? 3500
        : 5500;
export const FLARE_COUNT =
  PERF_TIER === "mobile"
    ? 1000
    : PERF_TIER === "tablet"
      ? 2500
      : PERF_TIER === "low"
        ? 1500
        : 3000;
export const MAX_DPR =
  PERF_TIER === "mobile"
    ? 1
    : PERF_TIER === "tablet"
      ? 1.25
      : PERF_TIER === "low"
        ? 1.25
        : 1.5;
