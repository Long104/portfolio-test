import ProjectCard from "./ProjectCard";

const PROJECTS = [
  {
    title: "Kira Gem",
    description:
      "An audio-reactive 3D vortex built with Three.js and Web Audio API. Particles, flares, and glow layers pulse in real time to bass, mid, and treble frequencies.",
    tags: ["Three.js", "WebGL", "Web Audio", "React"],
  },
  {
    title: "Nebula",
    description:
      "Distributed task scheduler with real-time monitoring, retry logic, and worker pool management. Designed for high-throughput microservice orchestration.",
    tags: ["Go", "Redis", "gRPC", "Docker"],
  },
  {
    title: "Aurora",
    description:
      "Design system component library featuring 40+ accessible, themeable UI components. Shipped with a Figma plugin and a Storybook playground.",
    tags: ["React", "TypeScript", "Storybook", "Figma"],
  },
  {
    title: "Vortex",
    description:
      "CLI tool for scaffolding and managing monorepo projects across multiple languages. Supports plugins, templates, and incremental adoption.",
    tags: ["Rust", "CLI", "Monorepo", "Nx"],
  },
];

export default function ProjectsSection() {
  return (
    <section className="section" style={{ flexDirection: "column", gap: "1.5rem" }}>
      {/* Section label */}
      <span
        style={{
          fontSize: "11px",
          fontFamily: '"SF Mono", "Fira Code", monospace',
          color: "rgba(255,255,255,0.25)",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          marginBottom: "0.5rem",
        }}
      >
        Selected Work
      </span>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem",
          width: "100%",
          maxWidth: "1040px",
          padding: "0 1rem",
        }}
      >
        {PROJECTS.map((p, i) => (
          <ProjectCard key={p.title} {...p} index={i} />
        ))}
      </div>
    </section>
  );
}
