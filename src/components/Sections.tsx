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
// Line reveal with 0.8s delay — just after boot exit animation completes (0.75s).
// The 0.05s gap is imperceptible; the user sees the full slow cinematic rise.
// Uses scroll:false (auto-play) instead of scrollTrigger because the hero is
// always at top — scrollTrigger fires immediately and bypasses the tween delay.
export function HeroSection() {
  const taglineRef = useScrollReveal<HTMLHeadingElement>({
    split: "lines",
    stagger: 0.2,
    y: "140%",
    clipWipe: true,
    delay: 0.8,
    duration: 1.2,
    ease: "power3.out",
    scroll: false,
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
    stagger: 0.02,
    x: "-60%",
    y: "0%",
    start: "top 90%",
    duration: 0.4,
    ease: "power2.out",
  });

  const textRef = useScrollReveal<HTMLParagraphElement>({
    split: "words",
    stagger: 0.06,
    y: "120%",
    blur: true,
    start: "top 70%",
    duration: 0.9,
  });

  const langRef = useScrollReveal<HTMLDivElement>({
    split: "words",
    stagger: 0.03,
    x: "-40%",
    y: "0%",
    start: "top 55%",
    duration: 0.5,
    ease: "power2.out",
  });

  const frameRef = useScrollReveal<HTMLDivElement>({
    split: "words",
    stagger: 0.03,
    x: "-40%",
    y: "0%",
    start: "top 45%",
    duration: 0.5,
    ease: "power2.out",
  });

  const toolsRef = useScrollReveal<HTMLDivElement>({
    split: "words",
    stagger: 0.03,
    x: "-40%",
    y: "0%",
    start: "top 35%",
    duration: 0.5,
    ease: "power2.out",
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

// ── Experience Item ──
// Each text element gets its own useScrollReveal ref.
// NOT applied to a parent wrapper — SplitText with split:"lines" on nested
// DOM structure (grid children) breaks the layout because it re-wraps text
// fragments and creates orphaned/mangled elements.

interface ExpItemData {
  period: string;
  role: string;
  company?: string;
  description?: string;
  isCurrent?: boolean;
}

function ExpItem({ period, role, company, description, isCurrent }: ExpItemData) {
  const periodRef = useScrollReveal<HTMLDivElement>({
    split: "chars",
    stagger: 0.02,
    x: "-50%",
    y: "0%",
    start: "top 88%",
    duration: 0.35,
    ease: "power2.out",
  });
  const roleRef = useScrollReveal<HTMLDivElement>({
    split: "words",
    stagger: 0.05,
    y: "120%",
    start: "top 78%",
    duration: 0.7,
  });
  const companyRef = useScrollReveal<HTMLDivElement>({
    split: "words",
    stagger: 0.03,
    y: "100%",
    start: "top 65%",
    duration: 0.5,
  });
  const descRef = useScrollReveal<HTMLDivElement>({
    split: "words",
    stagger: 0.03,
    y: "100%",
    start: "top 55%",
    duration: 0.5,
  });

  return (
    <div className={`exp-item${isCurrent ? " exp-item--current" : ""}`}>
      <div
        ref={periodRef}
        className={`exp-item__period${isCurrent ? " exp-item__period--current" : ""}`}
      >
        {period}
      </div>
      <div className="exp-item__body">
        <div
          ref={roleRef}
          className={`exp-item__role${isCurrent ? " exp-item__role--current" : ""}`}
        >
          {role}
        </div>
        {company && (
          <div ref={companyRef} className="exp-item__company">{company}</div>
        )}
        {description && (
          <div ref={descRef} className="exp-item__desc">{description}</div>
        )}
      </div>
    </div>
  );
}

// ── Experience (section 2) ──
export function ExperienceSection() {
  const labelRef = useScrollReveal<HTMLDivElement>({
    split: "chars",
    stagger: 0.02,
    x: "-60%",
    y: "0%",
    start: "top 90%",
    duration: 0.4,
    ease: "power2.out",
  });

  return (
    <section className="section" data-section-index={2}>
      <div ref={labelRef} className="section-label">// experience</div>
      <GlassPanel>
        <div className="experience">
          <ExpItem
            period="now"
            role={CURRENT_STATUS}
            isCurrent
          />
          {[...EXPERIENCE].reverse().map((job, i) => (
            <ExpItem
              key={i}
              period={job.period}
              role={job.role}
              company={job.company}
              description={job.description}
            />
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
    stagger: 0.02,
    x: "-60%",
    y: "0%",
    start: "top 90%",
    duration: 0.4,
    ease: "power2.out",
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
    stagger: 0.02,
    x: "-60%",
    y: "0%",
    start: "top 90%",
    duration: 0.4,
    ease: "power2.out",
  });

  const linksRef = useScrollReveal<HTMLDivElement>({
    split: "lines",
    stagger: 0.15,
    y: "120%",
    clipWipe: true,
    start: "top 65%",
    duration: 1.0,
  });

  const footerRef = useScrollReveal<HTMLDivElement>({
    split: "lines",
    stagger: 0.08,
    y: "80%",
    start: "top 40%",
    duration: 0.6,
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
      <div ref={footerRef} className="contact__footer">© 2026 Pantorn Chuavallee — built with webgl & liquid glass</div>
    </section>
  );
}
