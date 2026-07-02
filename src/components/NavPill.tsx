// ── NavPill — Clan Battle Terminal ──
// Sliding active indicator animates between sections on nav change.

import { useRef, useEffect, useMemo } from "react";
import { RefractiveDiv, buildNavConfig } from "./glass-configs";
import { useDeviceOrientation } from "../useDeviceOrientation";
import { gsap } from "../lib/gsap";

const SECTIONS = ["pilot", "about", "experience", "work", "contact"] as const;

interface NavPillProps {
  activeIndex: number;
  onNavigate: (index: number) => void;
}

export function NavPill({ activeIndex, onNavigate }: NavPillProps) {
  const specularAngle = useDeviceOrientation();
  const refraction = useMemo(() => buildNavConfig(specularAngle), [specularAngle]);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLButtonElement[]>([]);
  const initialised = useRef(false);
  const hoverTweens = useRef<Map<number, gsap.core.Tween>>(new Map());

  // ── Hover spring on nav buttons (pointer-capable devices only) ──
  useEffect(() => {
    // mouseenter/mouseleave fire unreliably on iOS touch — buttons get stuck
    // at scale 1.08. Only attach on devices that actually support hover.
    const canHover = window.matchMedia("(hover: hover)").matches;
    if (!canHover) return;

    itemsRef.current.forEach((btn, i) => {
      if (!btn) return;
      function onEnter() {
        const tw = gsap.to(btn, { scale: 1.08, duration: 0.25, ease: "back.out(2)" });
        hoverTweens.current.set(i, tw);
      }
      function onMove(e: MouseEvent) {
        const rect = btn.getBoundingClientRect();
        gsap.to(btn, {
          x: (e.clientX - (rect.left + rect.width / 2)) * 0.3,
          y: (e.clientY - (rect.top + rect.height / 2)) * 0.3,
          duration: 0.4,
          ease: "power3.out",
        });
      }
      function onLeave() {
        hoverTweens.current.get(i)?.kill();
        gsap.to(btn, { x: 0, y: 0, scale: 1, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      }
      btn.addEventListener("mouseenter", onEnter);
      btn.addEventListener("mousemove", onMove);
      btn.addEventListener("mouseleave", onLeave);
    });
    return () => {
      hoverTweens.current.forEach((tw) => tw.kill());
      hoverTweens.current.clear();
    };
  }, []);

  // ── Slide indicator to active item ──
  useEffect(() => {
    const indicator = indicatorRef.current;
    const target = itemsRef.current[activeIndex];
    if (!indicator || !target) return;

    const pill = indicator.parentElement;
    if (!pill) return;

    const pillRect = pill.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const left = targetRect.left - pillRect.left;
    const w = targetRect.width;

    if (!initialised.current) {
      // First paint: set instantly (no flash).
      initialised.current = true;
      gsap.set(indicator, { left, width: w });
      return;
    }

    // Subsequent: animate smoothly.
    const anim = gsap.to(indicator, {
      left,
      width: w,
      duration: 0.4,
      ease: "power3.out",
      overwrite: "auto",
    });

    return () => {
      anim.kill();
    };
  }, [activeIndex]);

  return (
    <RefractiveDiv
      className="nav-pill"
      refraction={refraction}
    >
      {/* Sliding active indicator */}
      <div ref={indicatorRef} className="nav-pill__indicator" />

      <div className="nav-pill__segmented">
        {SECTIONS.map((name, i) => (
          <button
            key={name}
            ref={(el) => { if (el) itemsRef.current[i] = el; }}
            className={
              "nav-pill__item" +
              (i === activeIndex ? " nav-pill__item--active" : "")
            }
            onClick={() => onNavigate(i)}
          >
            {name}
          </button>
        ))}
      </div>
    </RefractiveDiv>
  );
}
