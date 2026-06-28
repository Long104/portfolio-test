import { refractive } from "refractive";
import { refraction } from "./refraction";

export default function ContactSection() {
  return (
    <section className="section">
      <refractive.div
        refraction={refraction}
        className="glass"
        style={{
          maxWidth: "520px",
          width: "100%",
          textAlign: "center",
          padding: "3rem 2.5rem",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(1.3rem, 3vw, 1.8rem)",
            fontWeight: 300,
            color: "#fff",
            letterSpacing: "0.04em",
            margin: 0,
          }}
        >
          Get In Touch
        </h2>

        <p
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.85rem",
            lineHeight: 1.7,
            marginTop: "1rem",
            fontFamily: '"SF Mono", "Fira Code", monospace',
          }}
        >
          I'm always open to interesting conversations, collaboration, or just
          swapping music playlists. Feel free to reach out.
        </p>

        {/* Email */}
        <a
          href="mailto:hello@pantorn.dev"
          data-cursor="link"
          style={{
            display: "inline-block",
            marginTop: "1.5rem",
            color: "rgba(100, 200, 255, 0.8)",
            fontSize: "0.9rem",
            fontFamily: '"SF Mono", "Fira Code", monospace',
            textDecoration: "none",
            borderBottom: "1px solid rgba(100, 200, 255, 0.2)",
            paddingBottom: "2px",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(100, 200, 255, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(100, 200, 255, 0.2)";
          }}
        >
          hello@pantorn.dev
        </a>

        {/* Social links */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1.5rem",
            marginTop: "1.5rem",
          }}
        >
          {/* GitHub */}
          <a
            href="https://github.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="link"
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "11px",
              fontFamily: '"SF Mono", "Fira Code", monospace',
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.9)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            }}
          >
            GitHub
          </a>

          {/* Divider */}
          <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>

          {/* LinkedIn */}
          <a
            href="https://linkedin.com/in/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="link"
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "11px",
              fontFamily: '"SF Mono", "Fira Code", monospace',
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.9)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            }}
          >
            LinkedIn
          </a>
        </div>

        {/* Decorative line */}
        <div
          style={{
            width: "32px",
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(100,200,255,0.3), transparent)",
            margin: "2rem auto 0",
          }}
        />

        <p
          style={{
            color: "rgba(255,255,255,0.15)",
            fontSize: "10px",
            fontFamily: '"SF Mono", "Fira Code", monospace',
            marginTop: "0.75rem",
            letterSpacing: "0.15em",
          }}
        >
          Pantorn &copy; {new Date().getFullYear()}
        </p>
      </refractive.div>
    </section>
  );
}
