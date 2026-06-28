// ── Scroll Container ──
// Wraps all sections. Uses Lenis for smooth scroll.
// Tracks active section via IntersectionObserver for HUD counter.

import { useEffect, useRef, type ReactNode } from "react";
import Lenis from "lenis";

interface ScrollContainerProps {
  onSectionChange: (index: number) => void;
  children: ReactNode;
}

export function ScrollContainer({ onSectionChange, children }: ScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Lenis smooth scroll ──
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let frameId = 0;
    function raf(time: number) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);

  // ── Section tracking via IntersectionObserver ──
  useEffect(() => {
    const sections = containerRef.current?.querySelectorAll("[data-section-index]");
    if (!sections) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-section-index"));
            onSectionChange(index);
          }
        }
      },
      { threshold: 0.4 },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [onSectionChange]);

  return (
    <div ref={containerRef} className="content-layer">
      {children}
    </div>
  );
}
