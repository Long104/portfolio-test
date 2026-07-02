// ── NavOverlay — Fullscreen hamburger menu ──
// SOTD-standard mobile/tablet navigation:
//   - Hamburger trigger button (fixed top-right)
//   - Fullscreen glass overlay with staggered link reveal
//   - Social/email footer at bottom
//   - Body scroll lock when open
//   - GSAP timeline for open/close (power3.out stagger up)
//
// CSS controls visibility: hidden at ≥1024px, shown at <1024px.
// Both NavPill and NavOverlay stay mounted; CSS toggles display.

import { useRef, useState, useEffect, useMemo } from "react";
import { RefractiveDiv, buildSmallConfig } from "./glass-configs";
import { useDeviceOrientation } from "../useDeviceOrientation";
import { gsap, PREFERS_REDUCED_MOTION } from "../lib/gsap";

const SECTIONS = ["pilot", "about", "experience", "work", "contact"] as const;

const SOCIAL_LINKS: { label: string; href: string }[] = [
  { label: "github", href: "https://github.com" },
  { label: "linkedin", href: "https://linkedin.com" },
  { label: "email", href: "mailto:hello@pantorn.dev" },
];

interface NavOverlayProps {
  activeIndex: number;
  onNavigate: (index: number) => void;
}

export function NavOverlay({ activeIndex, onNavigate }: NavOverlayProps) {
  const [open, setOpen] = useState(false);
  const specularAngle = useDeviceOrientation();
  const refraction = useMemo(() => buildSmallConfig(specularAngle), [specularAngle]);

  const iconLinesRef = useRef<HTMLSpanElement[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLAnchorElement[]>([]);
  const footerRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // ── Toggle open/close with GSAP timeline ──
  function toggle() {
    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
    }

    if (!open) {
      // ── OPEN ──
      setOpen(true);

      // Reduced motion: skip animation, just show
      if (PREFERS_REDUCED_MOTION) return;

      const lines = iconLinesRef.current;
      const tl = gsap.timeline();
      tlRef.current = tl;

      // 1. Overlay backdrop fades in
      tl.set(overlayRef.current, { opacity: 1, visibility: "visible" });
      tl.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power3.out" },
      );

      // 2. Links stagger up (SOTD standard)
      tl.fromTo(
        linksRef.current.filter(Boolean),
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.06,
          ease: "power3.out",
        },
        "-=0.15",
      );

      // 3. Footer fades in
      tl.fromTo(
        footerRef.current,
        { opacity: 0 },
        { opacity: 0.5, duration: 0.3 },
        "-=0.2",
      );

      // 4. Icon morphs to X
      tl.to(
        lines[1],
        { opacity: 0, duration: 0.15, ease: "power2.out" },
        0,
      );
      tl.to(
        lines[0],
        { rotate: 45, y: 5, duration: 0.3, ease: "power2.out" },
        0,
      );
      tl.to(
        lines[2],
        { rotate: -45, y: -5, duration: 0.3, ease: "power2.out" },
        0,
      );
    } else {
      // ── CLOSE ──
      if (PREFERS_REDUCED_MOTION) {
        setOpen(false);
        resetIcon();
        return;
      }

      const lines = iconLinesRef.current;
      const tl = gsap.timeline({
        onComplete: () => {
          setOpen(false);
          resetIcon();
        },
      });
      tlRef.current = tl;

      // Links stagger out
      tl.to(linksRef.current.filter(Boolean), {
        y: 20,
        opacity: 0,
        duration: 0.2,
        stagger: 0.03,
        ease: "power2.in",
      });

      tl.to(footerRef.current, { opacity: 0, duration: 0.2 }, "<");

      tl.to(
        overlayRef.current,
        { opacity: 0, duration: 0.3, ease: "power3.in" },
        "<0.05",
      );

      // Icon morphs back
      tl.to(lines[1], { opacity: 1, duration: 0.2, ease: "power2.out" }, 0);
      tl.to(
        [lines[0], lines[2]],
        { rotate: 0, y: 0, duration: 0.3, ease: "power2.out" },
        0,
      );
    }
  }

  function resetIcon() {
    const lines = iconLinesRef.current;
    gsap.set(lines, { rotate: 0, y: 0, opacity: 1, clearProps: "all" });
  }

  // ── Navigate: close overlay first, then scroll ──
  function handleNavigate(index: number) {
    if (!open) return;
    if (PREFERS_REDUCED_MOTION) {
      setOpen(false);
      resetIcon();
      onNavigate(index);
      return;
    }
    toggle(); // triggers close animation
    setTimeout(() => onNavigate(index), 400);
  }

  // ── Body scroll lock when overlay is open ──
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      tlRef.current?.kill();
    };
  }, []);

  return (
    <>
      {/* ── Hamburger trigger ── */}
      <RefractiveDiv refraction={refraction} className="nav-trigger">
        <button
          className="nav-trigger__btn"
          onClick={toggle}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          <span className="nav-trigger__icon">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                ref={(el: HTMLSpanElement | null) => {
                  if (el) iconLinesRef.current[i] = el;
                }}
                className="nav-trigger__line"
              />
            ))}
          </span>
        </button>
      </RefractiveDiv>

      {/* ── Fullscreen overlay ── */}
      <div
        ref={overlayRef}
        className={"nav-overlay" + (open ? " nav-overlay--open" : "")}
      >
        <nav className="nav-overlay__links">
          {SECTIONS.map((name, i) => (
            <a
              key={name}
              ref={(el: HTMLAnchorElement | null) => {
                if (el) linksRef.current[i] = el;
              }}
              className={
                "nav-overlay__link" +
                (i === activeIndex ? " nav-overlay__link--active" : "")
              }
              onClick={(e) => {
                e.preventDefault();
                handleNavigate(i);
              }}
            >
              <span className="nav-overlay__num">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="nav-overlay__name">{name}</span>
            </a>
          ))}
        </nav>
        <div ref={footerRef} className="nav-overlay__footer">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
