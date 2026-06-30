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

      // ── ScrollTrigger + Lenis integration ──
      // Lenis prevents native scroll (window.scrollY = 0), so ScrollTrigger
      // can't detect scroll progress. We proxy ScrollTrigger's scroller to
      // read Lenis's virtual scroll position instead.
      ScrollTrigger.scrollerProxy(document.body, {
        scrollTop() {
          return lenis.scroll;
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            bottom: window.innerHeight,
            right: window.innerWidth,
            width: window.innerWidth,
            height: window.innerHeight,
          };
        },
        pinType: document.body.style.transform ? "transform" : "fixed",
      });

      // Make all future ScrollTriggers use the proxied body scroller
      ScrollTrigger.defaults({ scroller: document.body });

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

      // Throttle section tracking to ~30fps — getBoundingClientRect() forces
      // synchronous layout, so halving its rate reduces layout thrashing
      // during scroll. Section changes happen over seconds; 33ms latency is
      // invisible.
      const THROTTLE_MS = 33;
      let lastSectionUpdate = 0;
      function throttledSectionUpdate() {
        const now = performance.now();
        if (now - lastSectionUpdate < THROTTLE_MS) return;
        lastSectionUpdate = now;
        updateActiveSection();
      }

      // Listen to Lenis scroll (throttled) + sync ScrollTrigger
      lenis.on("scroll", () => {
        throttledSectionUpdate();
        ScrollTrigger.update();
      });

      // GSAP ticker drives Lenis — single rAF source of truth.
      // Replaces manual requestAnimationFrame loop.
      const tickerCb = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tickerCb);
      gsap.ticker.lagSmoothing(0);

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
        gsap.ticker.remove(tickerCb);
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
