// ── HUD Layer ──
// Corner labels with GSAP-driven micro-interactions:
// - Entrance stagger (per-corner slide-in on boot)
// - Audio status pulse (gently pulses when playing)
// - Section tag crossfade (smooth text transition on scroll)
// - Section counter flip (opacity crossfade on change)

import { useRef, useEffect } from "react";
import { gsap } from "../lib/gsap";

const SECTION_TAGS = [
  "building things that feel alive",
  "engineering × visual art",
  "where i've worked",
  "selected work",
  "let's talk",
];

interface HUDProps {
  sectionIndex: number;
  totalSections: number;
  audioStatus: string;
  trackName: string;
  isPlaying: boolean;
}

export function HUD({
  sectionIndex,
  totalSections,
  audioStatus,
  trackName,
  isPlaying,
}: HUDProps) {
  const counter = `${String(sectionIndex + 1).padStart(2, "0")}/${String(totalSections).padStart(2, "0")}`;

  const tagRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const prevSectionRef = useRef(sectionIndex);

  // ── Section tag crossfade ──
  useEffect(() => {
    const el = tagRef.current;
    if (!el || prevSectionRef.current === sectionIndex) return;
    const capturedSection = sectionIndex; // freeze the section this effect was triggered for
    prevSectionRef.current = capturedSection;

    gsap.to(el, {
      opacity: 0,
      duration: 0.15,
      ease: "power2.out",
      overwrite: "auto",
      onComplete() {
        // Guard: if another section change already ran since this tween started,
        // don't fade back in here — that newer effect will handle it.
        if (prevSectionRef.current !== capturedSection) return;
        // Text already updated by React render — fade back in
        // (the opacity:0 is set via gsap, React won't override it)
        gsap.to(el, {
          opacity: 1,
          duration: 0.15,
          ease: "power2.in",
          overwrite: "auto",
        });
      },
    });
  }, [sectionIndex]);

  // ── Section counter crossfade ──
  useEffect(() => {
    const el = counterRef.current;
    if (!el) return;

    gsap.fromTo(
      el,
      { opacity: 0, y: -4 },
      {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      },
    );
  }, [counter]);

  return (
    <>
      {/* Top-left: identity — drops down */}
      <div className="hud hud--tl">
        <div className="hud__name">Pantorn Chuavallee</div>
        <div className="hud__role">software engineer</div>
      </div>

      {/* Top-right: audio status — slides in from right */}
      <div className="hud hud--tr">
        <div className="hud__status">
          <span className={"hud__dot" + (isPlaying ? " hud__dot--live" : "")} />
          <span>{audioStatus}</span>
        </div>
        <div className="hud__hint">{trackName}</div>
      </div>

      {/* Bottom-left: contextual tagline — slides up */}
      {sectionIndex > 0 && (
        <div className="hud hud--bl">
          <div ref={tagRef} className="hud__counter hud__crossfade">
            {SECTION_TAGS[sectionIndex]}
          </div>
        </div>
      )}

      {/* Bottom-right: section counter — slides in from right */}
      {sectionIndex > 0 && (
        <div className="hud hud--br">
          <div ref={counterRef} className="hud__counter">
            {counter}
          </div>
        </div>
      )}
    </>
  );
}
