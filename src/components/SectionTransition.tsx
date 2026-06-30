// ── Section Transition — Gundam Targeting Scan ──
// When the active section changes, a thin scan line sweeps top→bottom
// across the viewport, followed by a brief flash. Gives each section
// change a "lock-on" ritual instead of content just appearing.
//
// Layer: fixed, above content (z-index 45), below HUD (z-index 50).
// Pointer-events: none — never blocks interaction.

import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";

interface Props {
  activeSection: number;
}

export function SectionTransition({ activeSection }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const lastSection = useRef(activeSection);

  useEffect(() => {
    // Skip first mount — no transition on initial load
    if (lastSection.current === activeSection) return;
    lastSection.current = activeSection;

    const scan = scanRef.current;
    const flash = flashRef.current;
    if (!scan || !flash) return;

    const direction = activeSection > lastSection.current ? 1 : -1;

    // ── Scan line sweep ──
    const tl = gsap.timeline();

    // Start scan line from top (or bottom if scrolling up)
    gsap.set(scan, {
      y: direction > 0 ? "0vh" : "100vh",
      opacity: 1,
    });

    tl.to(scan, {
      y: direction > 0 ? "100vh" : "0vh",
      duration: 0.5,
      ease: "power2.inOut",
    });

    // ── Brief flash on scan completion ──
    tl.fromTo(flash,
      { opacity: 0 },
      { opacity: 0.06, duration: 0.1, ease: "power2.out" },
      "-=0.15",
    ).to(flash, {
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
    });

    // Fade scan line after sweep
    tl.to(scan, {
      opacity: 0,
      duration: 0.2,
    }, "-=0.2");

    return () => {
      tl.kill();
    };
  }, [activeSection]);

  return (
    <div ref={containerRef} className="section-transition" aria-hidden="true">
      {/* Scan line */}
      <div ref={scanRef} className="section-transition__scan" />
      {/* Flash overlay */}
      <div ref={flashRef} className="section-transition__flash" />
    </div>
  );
}
