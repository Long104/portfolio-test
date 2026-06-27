// --- Adaptive perf tier (replaces hardcoded counts) ---
// Cheap heuristic: UA + cores + RAM. Good enough before first frame;
// R3F `performance` prop then drops DPR further if FPS dips at runtime.
export type PerfTier = "mobile" | "low" | "high";

export function detectPerfTier(): PerfTier {
  if (typeof navigator === "undefined") return "high";
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  if (isMobile) return "mobile";
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as { deviceMemory?: number }).deviceMemory ?? 4;
  if (cores <= 4 || memory <= 4) return "low";
  return "high";
}

export const PERF_TIER = detectPerfTier();
export const PAINT_COUNT =
  PERF_TIER === "mobile" ? 2000 : PERF_TIER === "low" ? 3500 : 5500;
export const FLARE_COUNT =
  PERF_TIER === "mobile" ? 1000 : PERF_TIER === "low" ? 1500 : 3000;
export const MAX_DPR = PERF_TIER === "mobile" ? 1 : PERF_TIER === "low" ? 1.25 : 1.5;
