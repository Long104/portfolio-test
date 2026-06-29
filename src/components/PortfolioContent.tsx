import { useEffect, useRef } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import HeroSection from "./HeroSection";
import AboutSection from "./AboutSection";
import ProjectsSection from "./ProjectsSection";
import ExperienceSection from "./ExperienceSection";
import ContactSection from "./ContactSection";

interface PortfolioContentProps {
  onScrollProgress: (progress: number) => void;
}

export default function PortfolioContent({ onScrollProgress }: PortfolioContentProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    const lenis = new Lenis({
      wrapper,
      content,
      lerp: 0.08,
      wheelMultiplier: 1,
      autoRaf: true,
    });

    lenis.on("scroll", (l) => {
      onScrollProgress(Math.min(Math.max(l.progress, 0), 1));
    });

    return () => {
      lenis.destroy();
    };
  }, [onScrollProgress]);

  return (
    <div ref={wrapperRef} className="scroll-container">
      <div ref={contentRef} className="scroll-content">
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <ExperienceSection />
        <ContactSection />
      </div>
    </div>
  );
}
