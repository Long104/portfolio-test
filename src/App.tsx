import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import "./fonts.css";
import type { ScrollContainerHandle } from "./components/ScrollContainer";

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

  // ── Scroll progress tracking (rAF-throttled — prevents 120 re-renders/sec) ──
  useEffect(() => {
    if (!started) return;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = document.body.scrollHeight - window.innerHeight;
        setScrollProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [started]);

  const handleStart = useCallback(async () => {
    setStarted(true); // show HUD/content immediately — don't wait for audio
    if (isPreloaded) {
      await engage();
    } else {
      await loadTrack(currentTrack);
    }
  }, [isPreloaded, engage, loadTrack, currentTrack]);

  const handleSelectTrack = useCallback(async (url: string) => {
    setStarted(true);
    if (isPreloaded && url === currentTrack) {
      if (!isPlaying) await engage(); // resume if paused; no-op if already playing
    } else {
      await loadTrack(url);
    }
  }, [isPreloaded, engage, loadTrack, currentTrack, isPlaying]);

  const handleSectionChange = useCallback((index: number) => {
    setActiveSection(index);
  }, []);

  const activeTrackName = TRACKS.find((t) => t.url === currentTrack)?.name ?? "";

  return (
    <>
      {/* ── Layer 0: Fixed 3D canvas (vortex) ── */}
      <div className="canvas-layer">
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </div>

      {/* ── Layer 1: Scrollable content ── */}
      {started && (
        <Suspense fallback={<div className="content-layer" />}>
          <ScrollContainer ref={scrollRef} onSectionChange={handleSectionChange}>
            <HeroSection />
            <AboutSection />
            <ExperienceSection />
            <WorkSection />
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
          <div
            className="scroll-progress"
            style={{ width: `${scrollProgress}%` }}
          />
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
      {!started && (
        <PsycommuBoot
          isLoading={isLoading}
          error={error}
          currentTrack={currentTrack}
          onStart={handleStart}
          onSelectTrack={handleSelectTrack}
          onWarmUp={warmUp}
          tracks={TRACKS}
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
