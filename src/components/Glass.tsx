import { refractive, convex } from "refractive";
import type { ReactNode } from "react";
import { PROJECTS } from "./projects";
import { useCursorSpecular } from "../hooks/useCursorSpecular";
import { useGlassInteraction } from "../hooks/useGlassInteraction";

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
// Cursor: internal illumination + subtle 3D tilt + cursor-driven specular
export function GlassPanel({ children }: { children: ReactNode }) {
  const specularAngle = useCursorSpecular();
  const { ref: glassRef } = useGlassInteraction({
    maxTilt: 2, // subtle — panel is large
    tiltSmooth: 0.08,
    glowRadius: "35%",
    glowColor: "rgba(255, 79, 216, 0.08)",
  });

  return (
    <div className="glass-tilt-wrapper" ref={glassRef}>
      <RefractiveDiv
        refraction={buildPanelConfig(specularAngle)}
        className="glass-panel glass-interactive"
      >
        {children}
      </RefractiveDiv>
    </div>
  );
}

// ── Project Card (medium — Work section) ──
// Cursor: internal illumination + 3D tilt + cursor-driven specular
export function ProjectCard({
  project,
}: {
  project: (typeof PROJECTS)[number];
}) {
  const specularAngle = useCursorSpecular();
  const { ref: glassRef } = useGlassInteraction({
    maxTilt: 5, // more pronounced on small cards
    tiltSmooth: 0.12,
    glowRadius: "50%",
    glowColor: "rgba(255, 79, 216, 0.1)",
  });

  return (
    <div className="glass-tilt-wrapper" ref={glassRef}>
      <RefractiveDiv
        refraction={buildNavConfig(specularAngle)}
        className="project-card glass-interactive"
      >
        <div className="project-card__num">{project.num}</div>
        <div className="project-card__title">{project.title}</div>
        <div className="project-card__stack">{project.stack}</div>
        <div className="project-card__arrow">{"→"}</div>
      </RefractiveDiv>
    </div>
  );
}
