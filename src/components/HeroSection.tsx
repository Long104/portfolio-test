import { useEffect, useState } from "react";

const ROLES = ["Software Engineer", "Creative Developer", "Problem Solver"];

export default function HeroSection() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // Rotate through roles every 3s with crossfade
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setRoleIndex((i) => (i + 1) % ROLES.length);
        setFade(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="section">
      <div
        className="glass"
        style={{
          maxWidth: "720px",
          width: "100%",
          textAlign: "center",
          padding: "3rem 2.5rem",
        }}
      >
        {/* Decorative line */}
        <div
          style={{
            width: "48px",
            height: "2px",
            background: "linear-gradient(90deg, transparent, rgba(100,200,255,0.6), transparent)",
            margin: "0 auto 2rem",
          }}
        />

        <h1
          className="text-glow"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: 300,
            letterSpacing: "0.06em",
            color: "#fff",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          Pantorn
        </h1>

        <p
          style={{
            fontSize: "clamp(0.9rem, 2vw, 1.2rem)",
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            fontFamily: '"SF Mono", "Fira Code", monospace',
            marginTop: "1rem",
            minHeight: "1.6em",
            transition: "opacity 0.4s ease",
            opacity: fade ? 1 : 0,
          }}
        >
          {ROLES[roleIndex]}
        </p>

        <p
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: "0.9rem",
            lineHeight: 1.7,
            maxWidth: "480px",
            margin: "1.5rem auto 0",
            fontFamily: '"SF Mono", "Fira Code", monospace',
          }}
        >
          Building things that live at the intersection of code, craft, and creativity.
        </p>

        {/* Scroll indicator */}
        <div
          style={{
            marginTop: "3rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            opacity: 0.3,
          }}
        >
          <span
            style={{
              width: "1px",
              height: "24px",
              background: "rgba(255,255,255,0.4)",
              animation: "scrollBounce 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontSize: "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
              fontFamily: '"SF Mono", "Fira Code", monospace',
            }}
          >
            Scroll
          </span>
        </div>
      </div>

      {/* Keyframes for scroll bounce */}
      <style>{`
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
      `}</style>
    </section>
  );
}
