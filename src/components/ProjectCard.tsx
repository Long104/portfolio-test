interface ProjectCardProps {
  title: string;
  description: string;
  tags: string[];
  index: number;
}

export default function ProjectCard({ title, description, tags, index }: ProjectCardProps) {
  return (
    <div
      className="glass"
      data-cursor="card"
      style={{
        padding: "1.5rem 2rem",
        maxWidth: "580px",
        width: "100%",
        cursor: "default",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Project number */}
      <span
        style={{
          fontSize: "11px",
          fontFamily: '"SF Mono", "Fira Code", monospace',
          color: "rgba(100, 200, 255, 0.5)",
          letterSpacing: "0.15em",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <h3
        style={{
          fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)",
          fontWeight: 400,
          color: "#fff",
          marginTop: "0.5rem",
          letterSpacing: "0.03em",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: "0.85rem",
          lineHeight: 1.6,
          marginTop: "0.75rem",
          fontFamily: '"SF Mono", "Fira Code", monospace',
        }}
      >
        {description}
      </p>

      {/* Tags */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          marginTop: "1rem",
        }}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: "10px",
              fontFamily: '"SF Mono", "Fira Code", monospace',
              color: "rgba(100, 200, 255, 0.6)",
              background: "rgba(100, 200, 255, 0.08)",
              border: "1px solid rgba(100, 200, 255, 0.12)",
              borderRadius: "999px",
              padding: "2px 10px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
