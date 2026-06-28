// ── Scroll Container ──
// Wraps all sections. Uses Lenis for smooth scroll.
// Tracks active section by finding which section's midpoint
// is closest to the viewport center.

import { useEffect, useRef, type ReactNode } from "react";
import Lenis from "lenis";

interface ScrollContainerProps {
  onSectionChange: (index: number) => void;
  children: ReactNode;
}

export function ScrollContainer({ onSectionChange, children }: ScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Lenis smooth scroll ──
    const lenis = new Lenis({
      duration: 1.2,
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

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateActiveSection);
      lenis.destroy();
    };
  }, [onSectionChange]);

  return (
    <div ref={containerRef} className="content-layer">
      {children}
    </div>
  );
}
