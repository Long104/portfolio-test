import { Canvas } from "@react-three/fiber";
import KiraKiraVortex from "./KiraKiraVortex";
import SparkleSystem from "./SparkleSystem";
import FrameLimiter from "./FrameLimiter";
import { PERF_TIER, MAX_DPR } from "./perf";

// preserveDrawingBuffer is only needed for refractive's html2canvas fallback
// (Firefox/Safari). Chrome uses native SVG filters and doesn't need it.
// Skipping it on Chrome avoids unnecessary GPU framebuffer retention.
const NEEDS_PRESERVE_DRAWING_BUFFER =
  typeof navigator !== "undefined" &&
  !/Chrome|Chromium|Edg|OPR\//i.test(navigator.userAgent);

export default function Scene() {
  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <Canvas
        frameloop="demand"
        camera={{ position: [0, 0, 5], fov: 75 }}
        dpr={PERF_TIER === "mobile" ? 1 : [1, MAX_DPR]}
        gl={{
          antialias: false, // additive particles + glow — MSAA is wasted cost
          powerPreference: "high-performance",
          alpha: false,
          preserveDrawingBuffer: NEEDS_PRESERVE_DRAWING_BUFFER,
        }}
        performance={{ min: 0.5 }} // R3F adaptive: drops DPR if FPS dips
      >
        <FrameLimiter />
        <KiraKiraVortex />
        <SparkleSystem />
      </Canvas>
    </div>
  );
}
