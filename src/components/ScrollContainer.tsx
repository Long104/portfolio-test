// ── Scroll Container ──
// Wraps all sections. Uses Lenis for smooth scroll, synced to GSAP ticker.
// Tracks active section by finding which section's midpoint
// is closest to the viewport center.

import { useEffect, useRef, useImperativeHandle, forwardRef, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "../lib/gsap";

export interface ScrollContainerHandle {
  scrollToSection: (index: number) => void;
}

interface ScrollContainerProps {
  onSectionChange: (index: number) => void;
  children: ReactNode;
}

export const ScrollContainer = forwardRef<ScrollContainerHandle, ScrollContainerProps>(
  function ScrollContainer({ onSectionChange, children }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sectionsRef = useRef<HTMLElement[]>([]);
    const lenisRef = useRef<Lenis | null>(null);

    useImperativeHandle(ref, () => ({
      scrollToSection(index: number) {
        const section = sectionsRef.current[index];
        if (section && lenisRef.current) {
          lenisRef.current.scrollTo(section, { offset: 0 });
        }
      },
    }));

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // ── Section tracking setup ──
      // Finds which section's midpoint is closest to the viewport center.
      const sections = Array.from(
        container.querySelectorAll<HTMLElement>("[data-section-index]"),
      );
      sectionsRef.current = sections;

      let lastIndex = -1;

      function updateActiveSection() {
        const viewportCenter = window.innerHeight / 2;
        let bestIndex = 0;
        let bestDist = Infinity;

        for (const section of sections) {
          const rect = section.getBoundingClientRect();
          const sectionMid = rect.top + rect.height / 2;
          const dist = Math.abs(sectionMid - viewportCenter);
          if (dist < bestDist) {
            bestDist = dist;
            bestIndex = Number(section.dataset.sectionIndex);
          }
        }

        if (bestIndex !== lastIndex) {
          lastIndex = bestIndex;
          onSectionChange(bestIndex);
        }
      }

      // Throttle section tracking to ~30fps — getBoundingClientRect() forces
      // synchronous layout, so halving its rate reduces layout thrashing
      // during scroll. Section changes happen over seconds; 33ms is invisible.
      const THROTTLE_MS = 33;
      let lastSectionUpdate = 0;
      function throttledSectionUpdate() {
        const now = performance.now();
        if (now - lastSectionUpdate < THROTTLE_MS) return;
        lastSectionUpdate = now;
        updateActiveSection();
      }

      // ── Lenis smooth scroll ──
      const lenis = new Lenis({
        duration: 0.6,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      lenisRef.current = lenis;

      // ── Lenis + ScrollTrigger integration ──
      // Lenis 1.x in window mode: native window.scrollY still changes.
      // No scrollerProxy needed — just sync ScrollTrigger on Lenis scroll
      // and drive Lenis from GSAP's ticker (single rAF source).
      lenis.on("scroll", () => {
        throttledSectionUpdate();
        ScrollTrigger.update();
      });

      // GSAP ticker drives Lenis — single rAF source of truth.
      const tickerCb = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tickerCb);
      gsap.ticker.lagSmoothing(0);

      // Recalculate trigger positions now that Lenis is active.
      ScrollTrigger.refresh();

      // Initial call
      updateActiveSection();

      // Also listen to resize (viewport height changes)
      function onResize() {
        updateActiveSection();
        ScrollTrigger.refresh();
      }
      window.addEventListener("resize", onResize);

      // ── Keyboard navigation (arrow up/down to jump between sections) ──
      function onKeyDown(e: KeyboardEvent) {
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
        e.preventDefault();
        const dir = e.key === "ArrowDown" ? 1 : -1;
        const nextIndex = Math.max(0, Math.min(sections.length - 1, lastIndex + dir));
        if (nextIndex !== lastIndex && sections[nextIndex]) {
          lenis.scrollTo(sections[nextIndex]);
        }
      }
      window.addEventListener("keydown", onKeyDown);

      return () => {
        gsap.ticker.remove(tickerCb);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("keydown", onKeyDown);
        lenis.destroy();
        lenisRef.current = null;
      };
    }, [onSectionChange]);

    return (
      <div ref={containerRef} className="content-layer">
        {children}
      </div>
    );
  },
);
