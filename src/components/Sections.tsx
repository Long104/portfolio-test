// ── Portfolio Sections ──
// Hero, About, Work, Contact
// Each is a <section> with data-section-index for IntersectionObserver tracking

import { GlassPanel, ProjectCard } from "./Glass";
import { PROJECTS } from "./projects";
import { EXPERIENCE, CURRENT_STATUS } from "./experience";

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
const STACK = {
  languages: ["typescript", "python", "glsl", "rust"],
  frameworks: ["react", "three.js", "node", "vite"],
  tools: ["git", "docker", "cloudflare", "aws", "postgres"],
};

export function AboutSection() {
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

        <div className="stack-grid">
          {Object.entries(STACK).map(([category, items]) => (
            <div key={category} className="stack-col">
              <div className="stack-col__label">// {category}</div>
              <ul className="stack-col__list">
                {items.map((item) => (
                  <li key={item} className="stack-col__item">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </GlassPanel>
    </section>
  );
}

// ── Experience (section 2) ──
export function ExperienceSection() {
  return (
    <section className="section" data-section-index={2}>
      <div className="section-label">// experience</div>
      <div className="experience">
        {EXPERIENCE.map((job, i) => (
          <div key={i} className="exp-item">
            <div className="exp-item__period">{job.period}</div>
            <div className="exp-item__body">
              <div className="exp-item__role">{job.role}</div>
              <div className="exp-item__company">{job.company}</div>
              <div className="exp-item__desc">{job.description}</div>
            </div>
          </div>
        ))}
        {/* Current status */}
        <div className="exp-item exp-item--current">
          <div className="exp-item__period exp-item__period--current">now</div>
          <div className="exp-item__body">
            <div className="exp-item__role exp-item__role--current">
              {CURRENT_STATUS}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Work (section 3) ──
export function WorkSection() {
  return (
    <section className="section" data-section-index={3}>
      <div className="section-label">// selected work</div>
      <div className="work-grid">
        {PROJECTS.map((project) => (
          <ProjectCard key={project.num} project={project} />
        ))}
      </div>
    </section>
  );
}

// ── Contact (section 4) ──
export function ContactSection() {
  return (
    <section className="section section--centered" data-section-index={4}>
      <div className="section-label section-label--center">// let's talk</div>
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
