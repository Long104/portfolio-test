import { refractive, convex } from "refractive";
import type { ReactNode } from "react";
import { useRef, useEffect } from "react";
import { gsap } from "../lib/gsap";
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
// GSAP micro-interaction: scale bump + arrow nudge + bracket fade on hover.
export function ProjectCard({
  project,
}: {
  project: (typeof PROJECTS)[number];
}) {
  const specularAngle = useDeviceOrientation();
  const cardRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const bracketRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    const arrow = arrowRef.current;
    const bracket = bracketRef.current;
    if (!card) return;

    function onEnter() {
      if (tweenRef.current) tweenRef.current.kill();
      tweenRef.current = gsap.timeline()
        .to(card, { scale: 1.03, duration: 0.3, ease: "power2.out" }, 0);
      if (arrow) {
        tweenRef.current.to(arrow, { x: 6, y: -6, duration: 0.25, ease: "power2.out" }, 0);
      }
      if (bracket) {
        tweenRef.current.to(bracket, { opacity: 1, duration: 0.2, ease: "power2.out" }, 0);
      }
    }

    function onLeave() {
      if (tweenRef.current) tweenRef.current.kill();
      tweenRef.current = gsap.timeline()
        .to(card, { scale: 1, duration: 0.4, ease: "power3.out" }, 0);
      if (arrow) {
        tweenRef.current.to(arrow, { x: 0, y: 0, duration: 0.3, ease: "power3.out" }, 0);
      }
      if (bracket) {
        tweenRef.current.to(bracket, { opacity: 0, duration: 0.3, ease: "power2.out" }, 0);
      }
    }

    card.addEventListener("mouseenter", onEnter);
    card.addEventListener("mouseleave", onLeave);
    return () => {
      card.removeEventListener("mouseenter", onEnter);
      card.removeEventListener("mouseleave", onLeave);
      tweenRef.current?.kill();
    };
  }, []);

  return (
    <RefractiveDiv
      ref={cardRef as never}
      refraction={buildNavConfig(specularAngle)}
      className="project-card"
    >
      {/* ── Corner brackets (animated by GSAP on hover) ── */}
      <div ref={bracketRef} className="project-card__brackets" />
      <div className="project-card__num">{project.num}</div>
      <div className="project-card__title">{project.title}</div>
      <div className="project-card__stack">{project.stack}</div>
      <div ref={arrowRef} className="project-card__arrow">{"→"}</div>
    </RefractiveDiv>
  );
}
