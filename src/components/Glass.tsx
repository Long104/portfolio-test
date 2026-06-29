import { refractive } from "refractive";
import type { ReactNode } from "react";
import { PROJECTS } from "./projects";

// ── Refractive wrappers ──
// Chrome: native SVG displacement refraction (true light-bending glass)
// Firefox/Safari: snapshot fallback (captures backdrop, applies same filter)
// Mobile/perf-conscious: can pass fallbackMode: "simple" for blur-only

export const RefractiveDiv = refractive.div;

// Shared refraction config — clear glass slab
export const refractionConfig = {
  radius: 16,
  blur: 12,
  glassThickness: 40,
  bezelWidth: 8,
  refractiveIndex: 1.05,
  specularOpacity: 0.08,
  specularAngle: Math.PI / 3,
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
        radius: 14,
        blur: 12,
        glassThickness: 32,
        bezelWidth: 6,
        refractiveIndex: 1.05,
        specularOpacity: 0.08,
        specularAngle: Math.PI / 3,
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
