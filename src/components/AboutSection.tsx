import { refractive } from "refractive";
import { refraction } from "./refraction";

export default function AboutSection() {
  return (
    <section className="section">
      <refractive.div
        refraction={refraction}
        className="glass"
        style={{
          maxWidth: "640px",
          width: "100%",
          padding: "3rem 2.5rem",
        }}
      >
        {/* Section label */}
        <span
          style={{
            fontSize: "11px",
            fontFamily: '"SF Mono", "Fira Code", monospace',
            color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
          }}
        >
          About Me
        </span>

        <h2
          style={{
            fontSize: "clamp(1.3rem, 3vw, 1.8rem)",
            fontWeight: 300,
            color: "#fff",
            letterSpacing: "0.04em",
            marginTop: "0.75rem",
          }}
        >
          Hi, I'm Pantorn
        </h2>

        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "0.9rem",
            lineHeight: 1.8,
            marginTop: "1.25rem",
            fontFamily: '"SF Mono", "Fira Code", monospace',
          }}
        >
          I'm a software engineer based in [Your City], passionate about building
          things that live at the intersection of performance, design, and
          creativity. My work spans from crafting immersive 3D web experiences
          with WebGL to architecting scalable backend systems.
        </p>

        <p
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: "0.85rem",
            lineHeight: 1.8,
            marginTop: "1rem",
            fontFamily: '"SF Mono", "Fira Code", monospace',
          }}
        >
          When I'm not coding, you'll find me exploring new music, experimenting
          with shaders, or chasing the perfect cup of coffee. I believe great
          software is felt, not just used — and I bring that philosophy to
          everything I build.
        </p>

        {/* Skills row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginTop: "1.5rem",
          }}
        >
          {[
            "TypeScript", "React", "Three.js", "WebGL", "Node.js",
            "Go", "Rust", "Docker", "PostgreSQL", "AWS",
          ].map((skill) => (
            <span
              key={skill}
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
              {skill}
            </span>
          ))}
        </div>
      </refractive.div>
    </section>
  );
}
