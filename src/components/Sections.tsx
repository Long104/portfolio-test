// ── Portfolio Sections ──
// Hero, About, Experience, Work, Contact
// Each is a <section> with data-section-index for scroll tracking.
// All text uses useScrollReveal for SplitText-driven scroll animations.
// Pattern: play-once-on-enter (the SOTD portfolio standard).

import { GlassPanel, ProjectCard } from "./Glass";
import { PROJECTS } from "./projects";
import { EXPERIENCE, CURRENT_STATUS } from "./experience";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { useHorizontalScroll } from "../hooks/useHorizontalScroll";
import { useRef, useEffect, memo } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText, ScrollTrigger, PREFERS_REDUCED_MOTION } from "../lib/gsap";

// ── Hero (section 0) ──
// Line reveal triggered by LAUNCH click.
//
// Two-phase approach (no revert/re-run):
//   Phase 1 (useGSAP, runs once on mount): SplitText + hide lines
//   Phase 2 (useEffect[started]): create timeline + play when LAUNCH clicked
//
// This avoids the fragile useGSAP revert/re-run cycle that was leaving
// the text visible but static.
export function HeroSection({ started }: { started: boolean }) {
  const taglineRef = useRef<HTMLHeadingElement>(null);
  const splitRef = useRef<{ lines: Element[] } | null>(null);

  // Phase 1: Split text into lines + hide them (runs ONCE, never reverts)
  useGSAP(
    () => {
      const el = taglineRef.current;
      if (!el) return;

      if (PREFERS_REDUCED_MOTION) {
        gsap.set(el, { opacity: 0 });
        return;
      }

      const split = new SplitText(el, {
        type: "lines",
        mask: "lines",
        linesClass: "split-line",
        wordsClass: "split-word",
        charsClass: "split-char",
      });

      if (split.lines.length === 0) return;

      // Hide immediately — stays hidden until Phase 2 runs
      gsap.set(split.lines, { yPercent: 140, opacity: 0 });
      splitRef.current = split;

      return () => {
        split.revert();
        splitRef.current = null;
      };
    },
    { scope: taglineRef },
  );

  // Phase 2: Play the reveal animation when `started` flips to true
  useEffect(() => {
    if (!started) return;

    const el = taglineRef.current;
    if (!el) return;

    if (PREFERS_REDUCED_MOTION) {
      gsap.to(el, { opacity: 1, duration: 0.5, delay: 0.3, ease: "power2.out" });
      return;
    }

    const split = splitRef.current;
    if (!split || split.lines.length === 0) return;

    const tl = gsap.timeline({ delay: 0.35 });
    tl.to(split.lines, {
      yPercent: 0,
      opacity: 1,
      stagger: 0.12,
      duration: 0.9,
      ease: "expo.out",
    });

    return () => {
      tl.kill();
    };
  }, [started]);

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

export const AboutSection = memo(function AboutSection() {
  const labelRef = useScrollReveal<HTMLDivElement>({
    split: "chars",
    stagger: 0.02,
    x: "-60%",
    y: "0%",
    start: "top 90%",
    end: "top 65%",
    duration: 0.4,
    ease: "power2.out",
  });

  const textRef = useScrollReveal<HTMLParagraphElement>({
    split: "lines",
    stagger: 0.12,
    y: "120%",
    start: "top 75%",
    end: "top 35%",
    duration: 0.9,
    ease: "expo.out",
  });

  const langRef = useScrollReveal<HTMLDivElement>({
    split: "words",
    stagger: 0.03,
    x: "-40%",
    y: "0%",
    start: "top 60%",
    end: "top 25%",
    duration: 0.5,
    ease: "power2.out",
  });

  const frameRef = useScrollReveal<HTMLDivElement>({
    split: "words",
    stagger: 0.03,
    x: "-40%",
    y: "0%",
    start: "top 50%",
    end: "top 20%",
    duration: 0.5,
    ease: "power2.out",
  });

  const toolsRef = useScrollReveal<HTMLDivElement>({
    split: "words",
    stagger: 0.03,
    x: "-40%",
    y: "0%",
    start: "top 40%",
    end: "top 15%",
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
});

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
    end: "top 60%",
    duration: 0.35,
    ease: "power2.out",
  });
  const roleRef = useScrollReveal<HTMLDivElement>({
    split: "lines",
    stagger: 0.1,
    y: "120%",
    start: "top 78%",
    end: "top 45%",
    duration: 0.7,
    ease: "expo.out",
  });
  const companyRef = useScrollReveal<HTMLDivElement>({
    split: "lines",
    stagger: 0.08,
    y: "100%",
    start: "top 65%",
    end: "top 35%",
    duration: 0.5,
    ease: "power2.out",
  });
  const descRef = useScrollReveal<HTMLDivElement>({
    split: "lines",
    stagger: 0.06,
    y: "100%",
    start: "top 55%",
    end: "top 25%",
    duration: 0.5,
    ease: "power2.out",
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
export const ExperienceSection = memo(function ExperienceSection() {
  const labelRef = useScrollReveal<HTMLDivElement>({
    split: "chars",
    stagger: 0.02,
    x: "-60%",
    y: "0%",
    start: "top 90%",
    end: "top 65%",
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
});

// ── Work (section 3) ──
// ── Work (section 3) — Pinned horizontal scroll ──
// When you scroll into this section, it pins and cards scroll
// horizontally. Each card has an image with clip-path reveal.
export function WorkSection({ started }: { started: boolean }) {
  const containerRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const labelRef = useScrollReveal<HTMLDivElement>({
    split: "chars",
    stagger: 0.02,
    x: "-60%",
    y: "0%",
    start: "top 90%",
    end: "top 65%",
    duration: 0.4,
    ease: "power2.out",
  });

  // ── Pinned horizontal scroll hook ──
  const horizontalTween = useRef<gsap.core.Tween>(null);
  useHorizontalScroll(containerRef, trackRef, started, horizontalTween);

  // ── Per-card clip-path reveal ──
  // Each card gets its own ScrollTrigger that wipes the image gradient
  // from right-to-left as the card enters the pinned viewport.
  // Uses `containerAnimation` to tie to the horizontal scroll tween.
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const revealTriggers = useRef<ScrollTrigger[]>([]);

  useEffect(() => {
    if (!started || !horizontalTween.current) return;

    // Kill any previous triggers
    revealTriggers.current.forEach((st) => st.kill());
    revealTriggers.current = [];

    const containerAnim = horizontalTween.current;

    // Set all images to hidden initially
    imageRefs.current.forEach((img) => {
      if (img) gsap.set(img, { clipPath: "inset(0 100% 0 0)" });
    });

    // Per-card trigger: wipes clip-path as card crosses into viewport
    imageRefs.current.forEach((imgEl) => {
      if (!imgEl) return;
      const card = imgEl.closest(".project-card") as HTMLElement;
      if (!card) return;

      const st = ScrollTrigger.create({
        trigger: card,
        containerAnimation: containerAnim,
        start: "left right",
        end: "left 60%",
        scrub: 0.6,
        onUpdate: (self) => {
          imgEl.style.clipPath = `inset(0 ${100 - self.progress * 100}% 0 0)`;
        },
      });

      revealTriggers.current.push(st);
    });

    return () => {
      revealTriggers.current.forEach((st) => st.kill());
      revealTriggers.current = [];
    };
  }, [started]);

  return (
    <section ref={containerRef} className="section section--work-horizontal" data-section-index={3}>
      <div ref={labelRef} className="section-label work-label">// selected work</div>
      <div ref={trackRef} className="work-track">
        {PROJECTS.map((project, i) => (
          <ProjectCard
            key={project.num}
            project={project}
            imageRef={(el: HTMLDivElement | null) => { imageRefs.current[i] = el; }}
          />
        ))}
        {/* Spacer — invisible element that creates right breathing room
            for the last card. When the spacer reaches the left edge,
            scroll stops and the last card is fully visible. */}
        <div className="work-track__spacer" aria-hidden="true" />
      </div>
    </section>
  );
}

// ── Contact (section 4) ──
export const ContactSection = memo(function ContactSection() {
  const labelRef = useScrollReveal<HTMLDivElement>({
    split: "chars",
    stagger: 0.02,
    x: "-60%",
    y: "0%",
    start: "top 90%",
    end: "top 65%",
    duration: 0.4,
    ease: "power2.out",
  });

  const linksRef = useScrollReveal<HTMLDivElement>({
    split: "lines",
    stagger: 0.15,
    y: "120%",
    clipWipe: true,
    start: "top 70%",
    end: "top 25%",
    duration: 1.0,
    ease: "expo.out",
  });

  const footerRef = useScrollReveal<HTMLDivElement>({
    split: "lines",
    stagger: 0.08,
    y: "80%",
    start: "top 50%",
    end: "top 20%",
    duration: 0.6,
    ease: "power2.out",
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
});
