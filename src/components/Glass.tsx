import { refractive } from "refractive";
import type { ReactNode } from "react";
import { PROJECTS } from "./projects";

// ── Refractive wrappers ──
// Chrome: native SVG displacement refraction (true light-bending glass)
// Firefox/Safari: snapshot fallback (captures backdrop, applies same filter)
// Mobile/perf-conscious: can pass fallbackMode: "simple" for blur-only

export const RefractiveDiv = refractive.div;

// Shared refraction config — experiment
export const refractionConfig = {
  radius: 28,
  blur: 4,
  glassThickness: 80,
  bezelWidth: 24,
  refractiveIndex: 1.45,
  specularOpacity: 0.72,
  specularAngle: 2.007,
} as const;

// ── Glass Panel (for About section) ──
export function GlassPanel({ children }: { children: ReactNode }) {
  return (
    <RefractiveDiv refraction={refractionConfig} className="glass-panel">
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
  return (
    <RefractiveDiv
      refraction={{
        radius: 28,
        blur: 4,
        glassThickness: 80,
        bezelWidth: 24,
        refractiveIndex: 1.45,
        specularOpacity: 0.72,
        specularAngle: 2.007,
      }}
      className="project-card"
    >
      <div className="project-card__num">{project.num}</div>
      <div className="project-card__title">{project.title}</div>
      <div className="project-card__stack">{project.stack}</div>
      <div className="project-card__arrow">{"→"}</div>
    </RefractiveDiv>
  );
}
