import { Canvas } from "@react-three/fiber";
import KiraKiraVortex from "./KiraKiraVortex";
import SparkleSystem from "./SparkleSystem";
import FrameLimiter from "./FrameLimiter";
import { PERF_TIER, MAX_DPR } from "./perf";

interface SceneProps {
  scrollProgress?: number;
}

export default function Scene({ scrollProgress = 0 }: SceneProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        background: "#01314A",
      }}
    >
      <Canvas
        frameloop="demand"
        camera={{ position: [0, 0, 5], fov: 75 }}
        dpr={PERF_TIER === "mobile" ? 1 : [1, MAX_DPR]}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          alpha: false,
        }}
        performance={{ min: 0.5 }}
      >
        <FrameLimiter fps={30} />
        <KiraKiraVortex scrollProgress={scrollProgress} />
        <SparkleSystem />
      </Canvas>
    </div>
  );
}
