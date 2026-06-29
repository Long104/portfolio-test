import { useState, useCallback, useEffect, useRef } from "react";
import "@fontsource-variable/jetbrains-mono/index.css";

import Scene from "./Scene";
import { useAudioEngine, TRACKS } from "./useAudioEngine";
import { HUD } from "./components/HUD";
import { PsycommuBoot } from "./components/PsycommuBoot";
import { PsycommuWaveform } from "./components/PsycommuWaveform";
import { ScrollContainer, type ScrollContainerHandle } from "./components/ScrollContainer";
import { NavPill } from "./components/NavPill";
import { CursorOverlay } from "./components/CursorOverlay";
import { RefractiveDiv } from "./components/Glass";
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
    toggle,
    currentTrack,
    loadTrack,
  } = useAudioEngine();

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
    await loadTrack(currentTrack);
    setStarted(true);
  }, [loadTrack, currentTrack]);

  const handleSelectTrack = useCallback(async (url: string) => {
    await loadTrack(url);
    setStarted(true);
  }, [loadTrack]);

  const handleSectionChange = useCallback((index: number) => {
    setActiveSection(index);
  }, []);

  const activeTrackName = TRACKS.find((t) => t.url === currentTrack)?.name ?? "";

  return (
    <>
      {/* ── Layer 0: Fixed 3D canvas (vortex) ── */}
      <div className="canvas-layer">
        <Scene />
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
          tracks={TRACKS}
        />
      )}

      {/* ── Layer 3: Cursor overlay (desktop only, self-gated) ── */}
      <CursorOverlay />

      {/* ── Audio control bar ── */}
      {started && (
        <RefractiveDiv
          className="audio-bar"
          refraction={{
            radius: 24,
            blur: 4,
            bezelWidth: 8,
            specularOpacity: 0.12,
          }}
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
