// ── Global Scroll Store ──
// Lightweight, framework-agnostic scroll state.
// App writes scroll progress (0–1) here; R3F reads it in useFrame.
// Avoids prop-drilling through Suspense/Lazy boundaries.
// No React re-renders — just a mutable ref + getter.

interface ScrollState {
  progress: number;   // 0–1, entire page
  sectionIndex: number; // current section 0–4
  sectionProgress: number; // 0–1 within current section
  velocity: number;   // smoothed scroll velocity (px/frame, 0 when idle)
}

const state: ScrollState = {
  progress: 0,
  sectionIndex: 0,
  sectionProgress: 0,
  velocity: 0,
};

export function setScrollState(s: Partial<ScrollState>) {
  Object.assign(state, s);
}

export function getScrollState(): ScrollState {
  return state;
}
