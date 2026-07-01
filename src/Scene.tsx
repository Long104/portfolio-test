import { useEffect, useRef } from "react";
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

/**
 * Tracks window.visualViewport so the 3D canvas stays within the visible
 * content area — essential in browsers with persistent sidebars (Dia, Arc).
 * Falls back to full viewport (inset: 0) when no sidebar is present.
 */
function useVisualViewport() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const vv = window.visualViewport;
      if (vv && (vv.offsetLeft > 0 || vv.offsetTop > 0)) {
        // Browser with chrome/sidebar — constrain to visible area
        el.style.left = vv.offsetLeft + "px";
        el.style.top = vv.offsetTop + "px";
        el.style.width = vv.width + "px";
        el.style.height = vv.height + "px";
        el.style.inset = "";
      } else {
        // No sidebar — fill full viewport
        el.style.inset = "0";
        el.style.left = "";
        el.style.top = "";
        el.style.width = "";
        el.style.height = "";
      }
    };

    update();

    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return ref;
}

export default function Scene() {
  const containerRef = useVisualViewport();

  return (
    <div
      ref={containerRef}
      className="kira-scene-container"
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
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
        <FrameLimiter fps={30} />
        <KiraKiraVortex />
        <SparkleSystem />
      </Canvas>
    </div>
  );
}
