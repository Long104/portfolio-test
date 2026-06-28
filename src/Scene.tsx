import { Canvas } from "@react-three/fiber";
import KiraKiraVortex from "./KiraKiraVortex";
import SparkleSystem from "./SparkleSystem";
import FrameLimiter from "./FrameLimiter";
import { PERF_TIER, MAX_DPR } from "./perf";

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
          preserveDrawingBuffer: true, // needed for refractive snapshot fallback (Firefox/Safari)
        }}
        performance={{ min: 0.5 }} // R3F adaptive: drops DPR if FPS dips
      >
        <FrameLimiter fps={30} />
        <KiraKiraVortex />
        <SparkleSystem />
      </Canvas>
    </div>
  );
}
