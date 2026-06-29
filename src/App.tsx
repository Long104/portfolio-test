import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import "./fonts.css";

const Scene = lazy(() => import("./Scene"));
import { useAudioEngine, TRACKS } from "./useAudioEngine";
import { HUD } from "./components/HUD";
import { PsycommuBoot } from "./components/PsycommuBoot";
import { PsycommuWaveform } from "./components/PsycommuWaveform";
import { ScrollContainer, type ScrollContainerHandle } from "./components/ScrollContainer";
import { NavPill } from "./components/NavPill";
import { CursorOverlay } from "./components/CursorOverlay";
import { RefractiveDiv, buildSmallConfig } from "./components/Glass";
import { useDeviceOrientation } from "./useDeviceOrientation";
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
  const specularAngle = useDeviceOrientation();

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
        <ScrollContainer ref={scrollRef} onSectionChange={handleSectionChange}>
          <HeroSection />
          <AboutSection />
          <ExperienceSection />
          <WorkSection />
          <ContactSection />
        </ScrollContainer>
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
        <RefractiveDiv
          className="audio-bar"
          refraction={buildSmallConfig(specularAngle)}
        >
          <button
            className="audio-bar__btn"
            onClick={toggle}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "\u23F8" : "\u25B6"}
          </button>

          <PsycommuWaveform />

          <div className="audio-bar__divider" />

          <div className="audio-bar__segmented">
          {TRACKS.map((track) => (
            <button
              key={track.url}
              className={
                "audio-bar__track" +
                (currentTrack === track.url ? " audio-bar__track--active" : "")
              }
              onClick={() => handleSelectTrack(track.url)}
            >
              {track.name}
            </button>
          ))}
          </div>

          <div className="audio-bar__divider" />

          <button
            className="audio-bar__theme"
            onClick={() => setTheme((t) => (t === "gquuuuuux" ? "gfreed" : "gquuuuuux"))}
            aria-label={`Switch to ${theme === "gquuuuuux" ? "GFreD" : "GQuuuuuuX"} theme`}
          >
            {theme === "gquuuuuux" ? "gMS-Ω" : "gMS-κ"}
          </button>
        </RefractiveDiv>
      )}
    </>
  );
}

export default App;
