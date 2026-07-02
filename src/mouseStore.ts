// ── Global Mouse Store ──
// Same pattern as scrollStore — mutable ref, zero React re-renders.
// App writes normalized cursor position here; R3F reads it in useFrame.

interface MouseState {
  x: number;  // -1 (left) to 1 (right)
  y: number;  // -1 (bottom) to 1 (top)
}

const state: MouseState = {
  x: 0,
  y: 0,
};

export function setMouseState(s: Partial<MouseState>) {
  Object.assign(state, s);
}

export function getMouseState(): MouseState {
  return state;
}
