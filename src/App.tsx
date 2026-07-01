import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import "./fonts.css";
import type { ScrollContainerHandle } from "./components/ScrollContainer";
import { setScrollState } from "./scrollStore";
import { SectionTransition } from "./components/SectionTransition";
import { ScrollTrigger } from "./lib/gsap";
import { useParallax } from "./hooks/useParallax";
import { requestOrientationPermission } from "./useDeviceOrientation";

const Scene = lazy(() => import("./Scene"));
const ScrollContainer = lazy(() =>
  import("./components/ScrollContainer").then((m) => ({
    default: m.ScrollContainer,
  })),
);
import { useAudioEngine, TRACKS } from "./useAudioEngine";
import { HUD } from "./components/HUD";
import { PsycommuBoot } from "./components/PsycommuBoot";
import { NavPill } from "./components/NavPill";
import { ScrollProgress } from "./components/ScrollProgress";
import { AudioBar } from "./components/AudioBar";
import { CursorOverlay } from "./components/CursorOverlay";

import {
  HeroSection,
  AboutSection,
  ExperienceSection,
  WorkSection,
  ContactSection,
} from "./components/Sections";

const TOTAL_SECTIONS = 5;

type Theme = "gquuuuuux" | "gfreed";

function App() {
  const [started, setStarted] = useState(false);
  const [contentMounted, setContentMounted] = useState(false);
  const [bootPhase, setBootPhase] = useState<"enter" | "exit" | "gone">("enter");
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("kira-theme") as Theme) || "gquuuuuux",
  );
  const scrollRef = useRef<ScrollContainerHandle>(null);

  // ── Apply theme to root element ──
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "gfreed") {
      root.setAttribute("data-theme", "gfreed");
    } else {
      root.removeAttribute("data-theme");
    }
    localStorage.setItem("kira-theme", theme);
  }, [theme]);
  const {
    isLoading,
    error,
    isPlaying,
    isPreloaded,
    toggle,
    currentTrack,
    warmUp,
    preload,
    engage,
    loadTrack,
  } = useAudioEngine();

  // ── Preload default audio track on mount — happens during Psycommu boot ──
  useEffect(() => {
    if (!isPreloaded) preload(currentTrack);
  }, []); // mount only

  // ── Pre-mount heavy content during boot (behind overlay) ──
  // Mounts ScrollContainer + Sections 800ms after page load so SplitText,
  // Lenis, and ScrollTrigger are warm before the user clicks LAUNCH.
  // Prevents the 100-300ms frame freeze that was eating the GSAP exit animation.
  useEffect(() => {
    const t = setTimeout(() => setContentMounted(true), 800);
    return () => clearTimeout(t);
  }, []); // mount only

  // ── Refresh ScrollTrigger after webfonts load ──
  // Font loading causes text reflow → trigger positions shift.
  // This fires once when all fonts are ready (before or after boot exit).
  useEffect(() => {
    if (!document.fonts) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      ScrollTrigger.refresh();
    });
    return () => { cancelled = true; };
  }, []);

  // ── Scroll progress tracking (rAF-throttled — prevents 120 re-renders/sec) ──
  // Also writes to global scrollStore for R3F to read in useFrame (no React re-render).
  useEffect(() => {
    if (!started) return;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = document.body.scrollHeight - window.innerHeight;
        const pct = max > 0 ? window.scrollY / max : 0;
        setScrollProgress(pct * 100);
        setScrollState({ progress: pct });
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [started]);

  const handleStart = useCallback(async () => {
    requestOrientationPermission(); // iOS 13+: must be inside user gesture
    setBootPhase("exit"); // start GSAP cinematic exit (flash + scale + scramble)
    setStarted(true); // show post-launch UI + enable scroll tracking
    if (isPreloaded) {
      await engage();
    } else {
      await loadTrack(currentTrack);
    }
  }, [isPreloaded, engage, loadTrack, currentTrack]);

  const handleSelectTrack = useCallback(async (url: string) => {
    requestOrientationPermission(); // iOS 13+: must be inside user gesture
    setBootPhase("exit");
    setStarted(true);
    if (isPreloaded && url === currentTrack) {
      if (!isPlaying) await engage();
    } else {
      await loadTrack(url);
    }
  }, [isPreloaded, engage, loadTrack, currentTrack, isPlaying]);

  const handleExitComplete = useCallback(() => {
    setBootPhase("gone");
    // Recalculate all ScrollTriggers after boot overlay animates away.
    // Content was mounted 800ms after page load — fonts/layout may have
    // shifted since triggers were created. This ensures correct positions.
    ScrollTrigger.refresh();
  }, []);

  const handleSectionChange = useCallback((index: number) => {
    setActiveSection(index);
    setScrollState({ sectionIndex: index });
  }, []);

  const activeTrackName = TRACKS.find((t) => t.url === currentTrack)?.name ?? "";
  const bootPhaseNarrowed: "enter" | "exit" = bootPhase === "gone" ? "exit" : bootPhase;

  // ── Parallax: glass panels float as you scroll ──
  // Activates after LAUNCH when content is visible.
  useParallax(
    ".glass-panel",
    30,
    1.5,
    started,
  );

  return (
    <>
      {/* ── Layer 0: Fixed 3D canvas (vortex) ── */}
      <div className="canvas-layer">
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </div>

      {/* ── Section transition scan effect ── */}
      {started && <SectionTransition activeSection={activeSection} />}

      {/* ── Layer 1: Scrollable content (pre-mounted during boot) ── */}
      {contentMounted && (
        <Suspense fallback={<div className="content-layer" />}>
          <ScrollContainer ref={scrollRef} onSectionChange={handleSectionChange}>
            <HeroSection started={started} />
            <AboutSection />
            <ExperienceSection />
            <WorkSection started={started} />
            <ContactSection />
          </ScrollContainer>
        </Suspense>
      )}

      {/* ── Layer 2: HUD (always visible after start) ── */}
      {started && (
        <>
          <NavPill
            activeIndex={activeSection}
            onNavigate={(i) => scrollRef.current?.scrollToSection(i)}
          />
          <ScrollProgress progress={scrollProgress} />
          <HUD
            sectionIndex={activeSection}
            totalSections={TOTAL_SECTIONS}
            audioStatus={isPlaying ? "audio: on" : "audio: off"}
            trackName={activeTrackName}
            isPlaying={isPlaying}
          />
        </>
      )}

      {/* ── Psycommu Boot Sequence ── */}
      {bootPhase !== "gone" && (
        <PsycommuBoot
          phase={bootPhaseNarrowed}
          isLoading={isLoading}
          error={error}
          onStart={handleStart}
          onWarmUp={warmUp}
          onExitComplete={handleExitComplete}
        />
      )}

      {/* ── Layer 3: Cursor overlay (desktop only, self-gated) ── */}
      <CursorOverlay />

      {/* ── Audio control bar ── */}
      {started && (
        <AudioBar
          isPlaying={isPlaying}
          currentTrack={currentTrack}
          theme={theme}
          toggle={toggle}
          handleSelectTrack={handleSelectTrack}
          onToggleTheme={() => setTheme((t) => (t === "gquuuuuux" ? "gfreed" : "gquuuuuux"))}
        />
      )}
    </>
  );
}

export default App;
