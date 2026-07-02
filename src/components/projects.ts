// ── Project data ──
// Real projects from pantorn's portfolio

export interface Project {
  readonly num: string;
  readonly title: string;
  readonly stack: string;
  readonly desc: string;
  /** Main link (project URL or live demo) */
  readonly url: string;
  /** GitHub repository URL */
  readonly github: string;
  /** Path to screenshot image in public/ */
  readonly image: string;
  /** Long-form case study description for overlay */
  readonly longDescription: string;
  /** Tech stack as individual tags */
  readonly techs: readonly string[];
  /** Key features / accomplishments */
  readonly highlights: readonly string[];
}

export const PROJECTS: readonly Project[] = [
  {
    num: "01",
    title: "cashwise",
    stack: "go · next.js · postgresql",
    desc: "A money management application for tracking spending. Go backend, Next.js frontend. Future AI integration for spending recommendations.",
    url: "https://senzen.vercel.app",
    github: "https://github.com/Long104/SenZen",
    image: "/cashwise.jpg",
    longDescription:
      "A full-stack money management application that helps users track spending across categories. Built with a Go backend and Next.js frontend, featuring a clean dashboard with budget breakdowns, transaction history, and category-based filtering. Designed for future AI integration to provide personalized spending recommendations and anomaly detection.",
    techs: ["go", "next.js", "postgresql", "tailwind", "docker"],
    highlights: [
      "Real-time spending breakdown with category-based filtering",
      "Go backend with RESTful API and PostgreSQL persistence",
      "Responsive dashboard with budget tracking and history",
      "Architected for future ML-based spending recommendations",
    ],
  },
  {
    num: "02",
    title: "notion clone",
    stack: "react · liveblocks · firebase",
    desc: "Real-time collaborative editor with AI translation. Clerk auth, Liveblocks for multi-user editing, Blocknote text editor, Cloudflare Workers for AI.",
    url: "https://notion-clone-opal.vercel.app",
    github: "https://github.com/Long104/notion-clone",
    image: "/notion-clone.jpg",
    longDescription:
      "A real-time collaborative document editor inspired by Notion, featuring live multi-user editing, AI-powered translation, and a rich block-based text editor. Authentication handled by Clerk, real-time sync powered by Liveblocks, and AI features running on Cloudflare Workers edge.",
    techs: ["react", "liveblocks", "firebase", "clerk", "cloudflare workers", "typescript"],
    highlights: [
      "Live multi-user editing with Liveblocks and presence cursors",
      "AI translation and summarization via Cloudflare Workers",
      "Block-based text editor with Blocknote for rich formatting",
      "Clerk authentication with OAuth and session management",
    ],
  },
  {
    num: "03",
    title: "clipboard ai",
    stack: "cloudflare workers · llama 3.3",
    desc: "AI-powered clipboard extension that helps users understand concepts faster via a sidebar chat powered by LLaMA 3.3, running on Cloudflare Workers edge.",
    url: "https://chromewebstore.google.com/detail/clipboard-ai/...",
    github: "https://github.com/Long104/AI-Clipboard-extension",
    image: "/clipboard-ai.jpg",
    longDescription:
      "A browser extension that adds a powerful AI sidebar to any webpage. Select text while browsing and ask LLaMA 3.3 to explain, summarize, translate, or elaborate — all running on Cloudflare Workers edge for low-latency responses. Supports multiple conversation threads and works across any website without leaving the page.",
    techs: ["cloudflare workers", "llama 3.3", "chrome extensions", "typescript", "html/css"],
    highlights: [
      "Sidebar AI chat on any webpage with text selection context",
      "LLaMA 3.3 inference on Cloudflare Workers edge (low latency)",
      "Multiple conversation threads with persistent history",
      "Explains, summarizes, translates, and elaborates selected text",
    ],
  },
] as const;
