import { useCallback, useEffect, useRef } from "react";

// 2D smooth custom cursor with hover state detection.
// Hidden on touch devices.
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const hoverRef = useRef(false);
  const rafRef = useRef(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;

    // Detect hover via data-cursor attribute on target or its parent
    const target = e.target as HTMLElement;
    const cursorTarget = target.closest("[data-cursor]");
    hoverRef.current = cursorTarget !== null;
  }, []);

  // Lerp loop — smooth follower
  const animate = useCallback(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const { x: mx, y: my } = mouseRef.current;
    currentRef.current.x += (mx - currentRef.current.x) * 0.15;
    currentRef.current.y += (my - currentRef.current.y) * 0.15;

    const { x: cx, y: cy } = currentRef.current;

    // Dot follows mouse instantly
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;

    // Ring lerps behind
    ring.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;

    // Hover state: scale ring, shrink dot
    if (hoverRef.current) {
      ring.style.width = "48px";
      ring.style.height = "48px";
      ring.style.borderColor = "rgba(100, 200, 255, 0.6)";
      ring.style.background = "rgba(100, 200, 255, 0.06)";
      dot.style.width = "4px";
      dot.style.height = "4px";
    } else {
      ring.style.width = "28px";
      ring.style.height = "28px";
      ring.style.borderColor = "rgba(255, 255, 255, 0.25)";
      ring.style.background = "transparent";
      dot.style.width = "6px";
      dot.style.height = "6px";
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    // Detect touch device — hide custom cursor
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    // Add class to body to hide native cursor via CSS
    document.body.classList.add("custom-cursor");

    window.addEventListener("mousemove", handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      document.body.classList.remove("custom-cursor");
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [handleMouseMove, animate]);

  return (
    <>
      {/* Dot — snaps to mouse position */}
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.7)",
          pointerEvents: "none",
          zIndex: 9999,
          transition: "width 0.15s ease, height 0.15s ease, background 0.15s ease",
          willChange: "transform",
        }}
      />
      {/* Ring — lerps behind mouse */}
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          pointerEvents: "none",
          zIndex: 9998,
          transition:
            "width 0.2s ease, height 0.2s ease, border-color 0.2s ease, background 0.2s ease",
          willChange: "transform",
        }}
      />
    </>
  );
}
