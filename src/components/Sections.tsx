// ── Portfolio Sections ──
// Hero, About, Work, Contact
// Each is a <section> with data-section-index for IntersectionObserver tracking

import { GlassPanel, ProjectCard } from "./Glass";
import { PROJECTS } from "./projects";

// ── Hero (section 0) ──
export function HeroSection() {
  return (
    <section className="section hero" data-section-index={0}>
      <h1 className="hero__tagline">
        building things <br />
        <span>that feel alive.</span>
      </h1>
    </section>
  );
}

// ── About (section 1) ──
export function AboutSection() {
  const skills = [
    "typescript", "react", "three.js", "webgl", "glsl",
    "node", "python", "postgres", "aws", "docker", "cloudflare",
  ];

  return (
    <section className="section" data-section-index={1}>
      <div className="section-label">// about</div>
      <GlassPanel>
        <p className="about__text">
          i build software at the intersection of <br />
          engineering and visual art. <br />
          <span>
            currently obsessed with webgl, audio reactivity, and shaders that
            shouldn't run at 60fps but do.
          </span>
        </p>
        <div className="about__skills">
          {skills.map((skill) => (
            <span key={skill} className="about__skill">
              {skill}
            </span>
          ))}
        </div>
      </GlassPanel>
    </section>
  );
}

// ── Work (section 2) ──
export function WorkSection() {
  return (
    <section className="section" data-section-index={2}>
      <div className="section-label">// selected work</div>
      <div className="work-grid">
        {PROJECTS.map((project) => (
          <ProjectCard key={project.num} project={project} />
        ))}
      </div>
    </section>
  );
}

// ── Contact (section 3) ──
export function ContactSection() {
  return (
    <section className="section" data-section-index={3}>
      <div className="section-label">// let's talk</div>
      <div className="contact">
        <a className="contact__link" href="https://github.com" target="_blank" rel="noreferrer">
          github →
        </a>
        <a className="contact__link" href="https://linkedin.com" target="_blank" rel="noreferrer">
          linkedin →
        </a>
        <a className="contact__link" href="mailto:hello@pantorn.dev">
          email →
        </a>
      </div>
      <div className="contact__footer">© 2026 pantorn — built with webgl & liquid glass</div>
    </section>
  );
}
