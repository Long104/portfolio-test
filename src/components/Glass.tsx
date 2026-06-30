import { refractive, convex } from "refractive";
import type { ReactNode } from "react";
import { PROJECTS } from "./projects";
import { useDeviceOrientation } from "../useDeviceOrientation";

// ── Refractive wrappers ──
// Chrome: native SVG displacement refraction (true light-bending glass)
// Firefox/Safari: snapshot fallback (captures backdrop, applies same filter)

export const RefractiveDiv = refractive.div;

// ── Per-tier glass configs ──
// Different element sizes need different optical properties.
// All use bezelHeightFn: convex (squircle) — Apple's signature curve.

/** Large panel (About, Experience sections) */
export function buildPanelConfig(specularAngle: number) {
  return {
    radius: 28, blur: 3, glassThickness: 110, bezelWidth: 26,
    refractiveIndex: 1.5, specularOpacity: 0.8, specularAngle,
    bezelHeightFn: convex,
  };
}

/** Navigation bar / medium card (NavPill, ProjectCard) */
export function buildNavConfig(specularAngle: number) {
  return {
    radius: 22, blur: 2, glassThickness: 80, bezelWidth: 22,
    refractiveIndex: 1.5, specularOpacity: 0.7, specularAngle,
    bezelHeightFn: convex,
  };
}

/** Small control (Audio bar) */
export function buildSmallConfig(specularAngle: number) {
  return {
    radius: 18, blur: 1, glassThickness: 60, bezelWidth: 16,
    refractiveIndex: 1.5, specularOpacity: 0.6, specularAngle,
    bezelHeightFn: convex,
  };
}

// ── Glass Panel (large — About/Experience sections) ──
export function GlassPanel({ children }: { children: ReactNode }) {
  const specularAngle = useDeviceOrientation();
  return (
    <RefractiveDiv refraction={buildPanelConfig(specularAngle)} className="glass-panel">
      {children}
    </RefractiveDiv>
  );
}

// ── Project Card (medium — Work section) ──
export function ProjectCard({
  project,
}: {
  project: (typeof PROJECTS)[number];
}) {
  const specularAngle = useDeviceOrientation();

  return (
    <RefractiveDiv
      refraction={buildNavConfig(specularAngle)}
      className="project-card"
    >
      <div className="project-card__num">{project.num}</div>
      <div className="project-card__title">{project.title}</div>
      <div className="project-card__stack">{project.stack}</div>
      <div className="project-card__arrow">{"→"}</div>
    </RefractiveDiv>
  );
}
