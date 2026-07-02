import type { ReactNode } from "react";
import { useRef, useEffect, useMemo } from "react";
import { gsap } from "../lib/gsap";
import { PROJECTS } from "./projects";
import { useDeviceOrientation } from "../useDeviceOrientation";
import { RefractiveDiv, buildPanelConfig, buildNavConfig } from "./glass-configs";

// ── Glass Panel (large — About/Experience sections) ──
export function GlassPanel({ children }: { children: ReactNode }) {
  const specularAngle = useDeviceOrientation();
  const refraction = useMemo(() => buildPanelConfig(specularAngle), [specularAngle]);
  return (
    <RefractiveDiv refraction={refraction} className="glass-panel">
      {children}
    </RefractiveDiv>
  );
}

// ── Project Card (large — Work horizontal scroll) ──
// Full-refractive card with image area + text info.
// Image uses a gradient placeholder with clip-path reveal on scroll enter.
// GSAP micro-interaction: scale bump + arrow nudge + bracket fade on hover.
export function ProjectCard({
  project,
  cardRef,          // forwarded ref for the parent track
  imageRef,         // forwarded ref for clip-path reveal on the image
  onOpen,           // callback to open project detail overlay
}: {
  project: (typeof PROJECTS)[number];
  cardRef?: React.Ref<HTMLDivElement>;
  imageRef?: React.Ref<HTMLDivElement>;
  onOpen?: (project: (typeof PROJECTS)[number]) => void;
}) {
  const specularAngle = useDeviceOrientation();
  const localCardRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const bracketRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Timeline | null>(null);
  const mergedCardRef = cardRef || localCardRef;
  const refraction = useMemo(() => buildNavConfig(specularAngle), [specularAngle]);

  useEffect(() => {
    const card = (mergedCardRef as React.RefObject<HTMLDivElement>).current;
    const arrow = arrowRef.current;
    const bracket = bracketRef.current;
    if (!card) return;

    // mouseenter/mouseleave fire unreliably on touch — skip on coarse pointers
    const canHover = window.matchMedia("(hover: hover)").matches;
    if (!canHover) return;

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

    // ── Click: open project detail overlay ──
    function onClick(e: Event) {
      e.preventDefault();
      e.stopPropagation();
      onOpen?.(project);
    }

    card.addEventListener("mouseenter", onEnter);
    card.addEventListener("mouseleave", onLeave);
    card.addEventListener("click", onClick);
    return () => {
      card.removeEventListener("mouseenter", onEnter);
      card.removeEventListener("mouseleave", onLeave);
      card.removeEventListener("click", onClick);
      tweenRef.current?.kill();
    };
  }, [mergedCardRef, onOpen, project]);

  return (
    <RefractiveDiv
      ref={mergedCardRef as never}
      refraction={refraction}
      className="project-card"
    >
      {/* ── Project screenshot ── */}
      <div ref={imageRef} className="project-card__image">
        <img src={project.image} alt={project.title} loading="lazy" />
      </div>

      {/* ── Corner brackets (animated by GSAP on hover) ── */}
      <div ref={bracketRef} className="project-card__brackets" />

      {/* ── Text overlay ── */}
      <div className="project-card__info">
        <div className="project-card__num">{project.num}</div>
        <div className="project-card__title">{project.title}</div>
        <div className="project-card__desc">{project.desc}</div>
        <div className="project-card__stack">{project.stack}</div>
      </div>
      <div ref={arrowRef} className="project-card__arrow">{"→"}</div>
    </RefractiveDiv>
  );
}
