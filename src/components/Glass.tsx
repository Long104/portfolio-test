import { refractive } from "refractive";
import type { ReactNode } from "react";
import { PROJECTS } from "./projects";
import { useDeviceOrientation } from "../useDeviceOrientation";

// ── Refractive wrappers ──
// Chrome: native SVG displacement refraction (true light-bending glass)
// Firefox/Safari: snapshot fallback (captures backdrop, applies same filter)
// Mobile/perf-conscious: can pass fallbackMode: "simple" for blur-only

export const RefractiveDiv = refractive.div;

// Shared refraction config base (dynamic specularAngle from gyro)
export function buildGlassConfig(specularAngle: number) {
  return {
    radius: 28,
    blur: 4,
    glassThickness: 80,
    bezelWidth: 24,
    refractiveIndex: 1.8,
    specularOpacity: 0.72,
    specularAngle,
  };
}

// Static fallback for components that don't need gyro
export const refractionConfig = buildGlassConfig(2.007);

// ── Glass Panel (for About section) ──
export function GlassPanel({ children }: { children: ReactNode }) {
  const specularAngle = useDeviceOrientation();
  return (
    <RefractiveDiv refraction={buildGlassConfig(specularAngle)} className="glass-panel">
      {children}
    </RefractiveDiv>
  );
}

// ── Project Card (for Work section) ──
export function ProjectCard({
  project,
}: {
  project: (typeof PROJECTS)[number];
}) {
  const specularAngle = useDeviceOrientation();
  return (
    <RefractiveDiv
      refraction={buildGlassConfig(specularAngle)}
      className="project-card"
    >
      <div className="project-card__num">{project.num}</div>
      <div className="project-card__title">{project.title}</div>
      <div className="project-card__stack">{project.stack}</div>
      <div className="project-card__arrow">{"→"}</div>
    </RefractiveDiv>
  );
}
