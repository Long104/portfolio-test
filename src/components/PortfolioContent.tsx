import HeroSection from "./HeroSection";
import ProjectsSection from "./ProjectsSection";
import ContactSection from "./ContactSection";

export default function PortfolioContent() {
  return (
    <div className="scroll-container">
      <HeroSection />
      <ProjectsSection />
      <ContactSection />
    </div>
  );
}
