// ── Project data ──
// Real projects from pantorn's portfolio

export interface Project {
  readonly num: string;
  readonly title: string;
  readonly stack: string;
  readonly desc: string;
  readonly url: string;
  /** Path to screenshot image in public/ */
  readonly image: string;
}

export const PROJECTS: readonly Project[] = [
  {
    num: "01",
    title: "cashwise",
    stack: "go · next.js · postgresql",
    desc: "A money management application for tracking spending. Go backend, Next.js frontend. Future AI integration for spending recommendations.",
    url: "https://github.com/Long104/SenZen",
    image: "/cashwise.png",
  },
  {
    num: "02",
    title: "notion clone",
    stack: "react · liveblocks · firebase",
    desc: "Real-time collaborative editor with AI translation. Clerk auth, Liveblocks for multi-user editing, Blocknote text editor, Cloudflare Workers for AI.",
    url: "https://github.com/Long104/notion-clone",
    image: "/notion-clone.png",
  },
  {
    num: "03",
    title: "clipboard ai",
    stack: "cloudflare workers · llama 3.3",
    desc: "AI-powered clipboard extension that helps users understand concepts faster via a sidebar chat powered by LLaMA 3.3, running on Cloudflare Workers edge.",
    url: "https://github.com/Long104/AI-Clipboard-extension",
    image: "/clipboard-ai.png",
  },
] as const;
