// ── Portfolio Sections ──
// Hero, About, Experience, Work, Contact
// Each is a <section> with data-section-index for scroll tracking.
// All text uses useScrollReveal for SplitText-driven scroll animations.
// Pattern: play-once-on-enter (the SOTD portfolio standard).

import { GlassPanel, ProjectCard } from "./Glass";
import { PROJECTS } from "./projects";
import { EXPERIENCE, CURRENT_STATUS } from "./experience";
import { useScrollReveal } from "../hooks/useScrollReveal";

// ── Hero (section 0) ──
// Line reveal with 0.7s delay — waits for boot screen fadeout (0.6s) to finish.
export function HeroSection() {
  const taglineRef = useScrollReveal<HTMLHeadingElement>({
    split: "lines",
    stagger: 0.15,
    y: "140%",
    clipWipe: true,
    delay: 0.7,
    duration: 1.0,
    start: "top 90%",
  });

  return (
    <section className="section hero" data-section-index={0}>
      <h1 ref={taglineRef} className="hero__tagline">
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
  const labelRef = useScrollReveal<HTMLDivElement>({
    split: "chars",
    stagger: 0.03,
    y: "100%",
    start: "top 85%",
  });

  const textRef = useScrollReveal<HTMLParagraphElement>({
    split: "words",
    stagger: 0.06,
    y: "120%",
    blur: true,
    start: "top 75%",
  });

  const langRef = useScrollReveal<HTMLDivElement>({
    split: "words",
    stagger: 0.04,
    y: "100%",
    start: "top 70%",
  });

  const frameRef = useScrollReveal<HTMLDivElement>({
    split: "words",
    stagger: 0.04,
    y: "100%",
    start: "top 65%",
  });

  const toolsRef = useScrollReveal<HTMLDivElement>({
    split: "words",
    stagger: 0.04,
    y: "100%",
    start: "top 60%",
  });

  return (
    <section className="section" data-section-index={1}>
      <div ref={labelRef} className="section-label">// about</div>
      <GlassPanel>
        <p ref={textRef} className="about__text">
          i build software at the intersection of <br />
          engineering and visual art. <br />
          <span>
            currently obsessed with webgl, audio reactivity, and shaders that
            shouldn't run at 60fps but do.
          </span>
        </p>

        <div className="stack-grid">
          {Object.entries(STACK).map(([category, items], idx) => {
            const ref = idx === 0 ? langRef : idx === 1 ? frameRef : toolsRef;
            return (
              <div key={category} className="stack-col">
                <div ref={ref} className="stack-col__label">// {category}</div>
                <ul className="stack-col__list">
                  {items.map((item) => (
                    <li key={item} className="stack-col__item">{item}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </GlassPanel>
    </section>
  );
}

// ── Experience (section 2) ──
export function ExperienceSection() {
  const labelRef = useScrollReveal<HTMLDivElement>({
    split: "chars",
    stagger: 0.03,
    y: "100%",
    start: "top 85%",
  });

  const bodyRef = useScrollReveal<HTMLDivElement>({
    split: "lines",
    stagger: 0.12,
    y: "100%",
    clipWipe: true,
    start: "top 75%",
  });

  return (
    <section className="section" data-section-index={2}>
      <div ref={labelRef} className="section-label">// experience</div>
      <GlassPanel>
        <div ref={bodyRef} className="experience">
          {/* Current status — reverse chronological, newest first */}
          <div className="exp-item exp-item--current">
            <div className="exp-item__period exp-item__period--current">now</div>
            <div className="exp-item__body">
              <div className="exp-item__role exp-item__role--current">
                {CURRENT_STATUS}
              </div>
            </div>
          </div>
          {[...EXPERIENCE].reverse().map((job, i) => (
            <div key={i} className="exp-item">
              <div className="exp-item__period">{job.period}</div>
              <div className="exp-item__body">
                <div className="exp-item__role">{job.role}</div>
                <div className="exp-item__company">{job.company}</div>
                <div className="exp-item__desc">{job.description}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </section>
  );
}

// ── Work (section 3) ──
export function WorkSection() {
  const labelRef = useScrollReveal<HTMLDivElement>({
    split: "chars",
    stagger: 0.03,
    y: "100%",
    start: "top 85%",
  });

  return (
    <section className="section" data-section-index={3}>
      <div ref={labelRef} className="section-label">// selected work</div>
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
  const labelRef = useScrollReveal<HTMLDivElement>({
    split: "chars",
    stagger: 0.03,
    y: "100%",
    start: "top 85%",
  });

  const linksRef = useScrollReveal<HTMLDivElement>({
    split: "lines",
    stagger: 0.15,
    y: "120%",
    clipWipe: true,
    start: "top 70%",
  });

  const footerRef = useScrollReveal<HTMLDivElement>({
    split: "lines",
    stagger: 0.1,
    y: "80%",
    start: "top 60%",
  });

  return (
    <section className="section section--centered" data-section-index={4}>
      <div ref={labelRef} className="section-label section-label--center">// let's talk</div>
      <div ref={linksRef} className="contact">
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
      <div ref={footerRef} className="contact__footer">© 2026 pantorn — built with webgl & liquid glass</div>
    </section>
  );
}
