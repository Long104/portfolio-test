// ── Project data ──
// Separated from Glass.tsx for react-refresh compatibility
//
// Each project has an image field: a CSS gradient string used as a
// placeholder background. Gradients are abstract energy-scan visuals
// that match the cockpit/Gundam aesthetic.

export interface Project {
  readonly num: string;
  readonly title: string;
  readonly stack: string;
  readonly url: string;
  /** CSS gradient used as placeholder project image */
  readonly image: string;
}

export const PROJECTS: readonly Project[] = [
  {
    num: "01",
    title: "nebula engine",
    stack: "typescript · webgl · glsl",
    url: "#",
    image: "linear-gradient(135deg, #0c0e1a 0%, #1a1040 40%, #2d1b69 70%, #4a2c8a 100%)",
  },
  {
    num: "02",
    title: "kira-kira vortex",
    stack: "react · three.js · audio api",
    url: "#",
    image: "linear-gradient(135deg, #0a1628 0%, #0d3b66 40%, #1a6b8a 70%, #3a9bba 100%)",
  },
  {
    num: "03",
    title: "realtime collab",
    stack: "typescript · websockets · yjs",
    url: "#",
    image: "linear-gradient(135deg, #1a0a0a 0%, #4a1525 40%, #8a2040 70%, #c03555 100%)",
  },
  {
    num: "04",
    title: "shader playground",
    stack: "glsl · webgpu · vite",
    url: "#",
    image: "linear-gradient(135deg, #0a1a0a 0%, #0d3d1a 40%, #1a6b35 70%, #3a9a55 100%)",
  },
  {
    num: "05",
    title: "edge functions",
    stack: "rust · wasm · cloudflare",
    url: "#",
    image: "linear-gradient(135deg, #1a1a0a 0%, #3d3d0d 40%, #6b6b1a 70%, #9a9a3a 100%)",
  },
] as const;
