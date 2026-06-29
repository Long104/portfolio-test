// ── Scroll Container ──
// Wraps all sections. Uses Lenis for smooth scroll.
// Tracks active section by finding which section's midpoint
// is closest to the viewport center.

import { useEffect, useRef, useImperativeHandle, forwardRef, type ReactNode } from "react";
import Lenis from "lenis";

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

    useImperativeHandle(ref, () => ({
      scrollToSection(index: number) {
        const section = sectionsRef.current[index];
        if (section) {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      },
    }));

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // ── Lenis smooth scroll ──
      const lenis = new Lenis({
        duration: 0.6,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      // ── Section tracking ──
      // Finds which section's midpoint is closest to the viewport center.
      // More reliable than IntersectionObserver threshold when section heights
      // are close to viewport height.
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

      // Listen to Lenis scroll
      lenis.on("scroll", updateActiveSection);

      // RAF loop for Lenis
      let frameId = 0;
      function raf(time: number) {
        lenis.raf(time);
        frameId = requestAnimationFrame(raf);
      }
      frameId = requestAnimationFrame(raf);

      // Initial call
      updateActiveSection();

      // Also listen to resize (viewport height changes)
      window.addEventListener("resize", updateActiveSection);

      // ── Keyboard navigation (arrow up/down to jump between sections) ──
      function onKeyDown(e: KeyboardEvent) {
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
        e.preventDefault();
        const dir = e.key === "ArrowDown" ? 1 : -1;
        const nextIndex = Math.max(0, Math.min(sections.length - 1, lastIndex + dir));
        if (nextIndex !== lastIndex && sections[nextIndex]) {
          sections[nextIndex].scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      window.addEventListener("keydown", onKeyDown);

      return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener("resize", updateActiveSection);
        window.removeEventListener("keydown", onKeyDown);
        lenis.destroy();
      };
    }, [onSectionChange]);

    return (
      <div ref={containerRef} className="content-layer">
        {children}
      </div>
    );
  },
);
