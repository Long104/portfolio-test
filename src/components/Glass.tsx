import { refractive } from "refractive";
import type { ReactNode } from "react";
import { PROJECTS } from "./projects";

// ── Refractive wrappers ──
// Chrome: native SVG displacement refraction (true light-bending glass)
// Firefox/Safari: snapshot fallback (captures backdrop, applies same filter)
// Mobile/perf-conscious: can pass fallbackMode: "simple" for blur-only

const RefractiveDiv = refractive.div;

// Shared refraction config — tuned for vortex backdrop
const refractionConfig = {
  radius: 16,
  blur: 2,
  bezelWidth: 12,
  specularOpacity: 0.15,
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
        blur: 1,
        bezelWidth: 10,
        specularOpacity: 0.1,
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
