// ── Project Detail Overlay ──
// Full-screen case study overlay triggered by clicking a project card.
// GSAP animation: backdrop fade + content scale-up on open; reverse on close.
// Close on: Escape key, click outside, close button.
// Lenis scroll lock when open.

import { useEffect, useRef, useCallback } from "react";
import { gsap, PREFERS_REDUCED_MOTION } from "../lib/gsap";
import type { Project } from "./projects";

interface ProjectDetailProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectDetail({ project, onClose }: ProjectDetailProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const wasBodyOverflow = useRef<string>("");

  // ── Open animation ──
  useEffect(() => {
    if (!project) return;

    const overlay = overlayRef.current;
    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    if (!overlay || !backdrop || !panel) return;

    // Show overlay immediately (JS visibility, not CSS)
    gsap.set(overlay, { display: "flex" });

    if (PREFERS_REDUCED_MOTION) {
      gsap.set(overlay, { opacity: 1 });
      return;
    }

    const tl = gsap.timeline();
    tlRef.current = tl;

    tl.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" });
    tl.fromTo(
      panel,
      { opacity: 0, scale: 0.92, y: 24 },
      { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "power3.out" },
      "-=0.2",
    );

    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [project]);

  // ── Close animation ──
  const animateClose = useCallback(() => {
    const overlay = overlayRef.current;
    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    if (!overlay || !backdrop || !panel) return;

    if (PREFERS_REDUCED_MOTION) {
      gsap.set(overlay, { display: "none", opacity: 0 });
      onClose();
      return;
    }

    if (tlRef.current) tlRef.current.kill();

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(overlay, { display: "none" });
        onClose();
      },
    });
    tlRef.current = tl;

    tl.to(panel, { opacity: 0, scale: 0.95, y: 16, duration: 0.25, ease: "power2.in" });
    tl.to(backdrop, { opacity: 0, duration: 0.2, ease: "power2.in" }, 0);
  }, [onClose]);

  // ── Scroll lock when open ──
  useEffect(() => {
    if (!project) return;

    wasBodyOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = wasBodyOverflow.current;
    };
  }, [project]);

  // ── Escape key ──
  useEffect(() => {
    if (!project) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") animateClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [project, animateClose]);

  // ── Click outside panel ──
  function onBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) {
      animateClose();
    }
  }

  // ── No project = hidden (but keep mounted to preserve state) ──
  if (!project) return null;

  return (
    <div ref={overlayRef} className="project-detail" style={{ display: "none" }}>
      {/* ── Backdrop ── */}
      <div
        ref={backdropRef}
        className="project-detail__backdrop"
        onClick={onBackdropClick}
      />

      {/* ── Content panel ── */}
      <div ref={panelRef} className="project-detail__panel">
        {/* Close button */}
        <button
          className="project-detail__close"
          onClick={animateClose}
          aria-label="Close project detail"
        >
          <span className="project-detail__close-icon">✕</span>
          <span className="project-detail__close-label">close</span>
        </button>

        {/* ── Image ── */}
        <div className="project-detail__image-wrap">
          <img
            src={project.image}
            alt={project.title}
            className="project-detail__image"
          />
        </div>

        {/* ── Info ── */}
        <div className="project-detail__info">
          {/* Header */}
          <div className="project-detail__header">
            <span className="project-detail__num">{project.num}</span>
            <h2 className="project-detail__title">{project.title}</h2>
          </div>

          {/* Short description */}
          <p className="project-detail__desc">{project.longDescription}</p>

          {/* Tech stack */}
          <div className="project-detail__techs">
            <span className="project-detail__techs-label">// stack</span>
            <div className="project-detail__techs-list">
              {project.techs.map((tech) => (
                <span key={tech} className="project-detail__tech">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Highlights */}
          <div className="project-detail__highlights">
            <span className="project-detail__highlights-label">// highlights</span>
            <ul className="project-detail__highlights-list">
              {project.highlights.map((h, i) => (
                <li key={i} className="project-detail__highlight">
                  {h}
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div className="project-detail__links">
            <a
              href={project.github}
              target="_blank"
              rel="noreferrer"
              className="project-detail__link project-detail__link--primary"
            >
              <span className="project-detail__link-bracket">[</span>
              github
              <span className="project-detail__link-bracket">]</span>
            </a>
            <a
              href={project.url}
              target="_blank"
              rel="noreferrer"
              className="project-detail__link project-detail__link--secondary"
            >
              <span className="project-detail__link-bracket">[</span>
              live site
              <span className="project-detail__link-bracket">]</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
