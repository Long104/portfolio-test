import { refractive } from "refractive";
import { refraction } from "./refraction";

interface ExperienceItem {
  role: string;
  company: string;
  period: string;
  description: string;
  tags: string[];
}

const EXPERIENCES: ExperienceItem[] = [
  {
    role: "Senior Software Engineer",
    company: "Company Name",
    period: "2023 — Present",
    description:
      "Leading development of [placeholder project]. Architected microservices handling [X] requests/day. Mentored junior engineers and established CI/CD best practices.",
    tags: ["TypeScript", "React", "Go", "AWS"],
  },
  {
    role: "Software Engineer",
    company: "Previous Company",
    period: "2021 — 2023",
    description:
      "Built and maintained [placeholder system]. Improved performance by [X]%. Collaborated cross-functionally to ship features used by [X] users.",
    tags: ["React", "Node.js", "PostgreSQL"],
  },
  {
    role: "Junior Developer",
    company: "First Company",
    period: "2019 — 2021",
    description:
      "Developed UI components, fixed bugs, and learned the ropes of professional software development in a fast-paced startup environment.",
    tags: ["JavaScript", "Vue", "CSS"],
  },
];

export default function ExperienceSection() {
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
        Experience
      </span>

      {/* Timeline */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          width: "100%",
          maxWidth: "640px",
          padding: "0 1rem",
        }}
      >
        {EXPERIENCES.map((exp, i) => (
          <refractive.div
            key={i}
            refraction={refraction}
            className="glass"
            data-cursor="card"
            style={{
              padding: "1.5rem 2rem",
              position: "relative",
            }}
          >
            {/* Period */}
            <span
              style={{
                fontSize: "10px",
                fontFamily: '"SF Mono", "Fira Code", monospace',
                color: "rgba(100, 200, 255, 0.5)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              {exp.period}
            </span>

            {/* Role + Company */}
            <h3
              style={{
                fontSize: "clamp(1rem, 2vw, 1.2rem)",
                fontWeight: 400,
                color: "#fff",
                marginTop: "0.4rem",
                letterSpacing: "0.03em",
              }}
            >
              {exp.role}
              <span style={{ color: "rgba(255,255,255,0.3)", margin: "0 0.5rem" }}>
                ·
              </span>
              <span style={{ color: "rgba(100, 200, 255, 0.7)" }}>
                {exp.company}
              </span>
            </h3>

            {/* Description */}
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "0.82rem",
                lineHeight: 1.6,
                marginTop: "0.6rem",
                fontFamily: '"SF Mono", "Fira Code", monospace',
              }}
            >
              {exp.description}
            </p>

            {/* Tags */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginTop: "0.85rem",
              }}
            >
              {exp.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: "10px",
                    fontFamily: '"SF Mono", "Fira Code", monospace',
                    color: "rgba(100, 200, 255, 0.5)",
                    background: "rgba(100, 200, 255, 0.06)",
                    border: "1px solid rgba(100, 200, 255, 0.1)",
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
          </refractive.div>
        ))}
      </div>
    </section>
  );
}
