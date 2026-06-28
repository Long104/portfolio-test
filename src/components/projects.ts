// ── Project data ──
// Separated from Glass.tsx for react-refresh compatibility

export const PROJECTS = [
  { num: "01", title: "nebula engine", stack: "typescript · webgl · glsl", url: "#" },
  { num: "02", title: "kira-kira vortex", stack: "react · three.js · audio api", url: "#" },
  { num: "03", title: "realtime collab", stack: "typescript · websockets · yjs", url: "#" },
  { num: "04", title: "shader playground", stack: "glsl · webgpu · vite", url: "#" },
  { num: "05", title: "edge functions", stack: "rust · wasm · cloudflare", url: "#" },
] as const;
