import { useState, useCallback, useEffect } from "react";
import "@fontsource-variable/jetbrains-mono/index.css";

import Scene from "./Scene";
import { useAudioEngine, TRACKS } from "./useAudioEngine";
import { HUD } from "./components/HUD";
import { ScrollContainer } from "./components/ScrollContainer";
import { CursorOverlay } from "./components/CursorOverlay";
import {
  HeroSection,
  AboutSection,
  ExperienceSection,
  WorkSection,
  ContactSection,
} from "./components/Sections";

const TOTAL_SECTIONS = 5;

function App() {
  const [started, setStarted] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const {
    isLoading,
    error,
    isPlaying,
    toggle,
    currentTrack,
    loadTrack,
  } = useAudioEngine();

  // ── Scroll progress tracking ──
  useEffect(() => {
    if (!started) return;
    function onScroll() {
      const max = document.body.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
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
        <ScrollContainer onSectionChange={handleSectionChange}>
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

      {/* ── Click-to-start overlay ── */}
      {!started && (
        <div className="start-overlay" onClick={handleStart}>
          {error ? (
            <p style={{ color: "#ff6b6b", fontSize: "14px", fontFamily: "var(--mono)" }}>
              {error}
            </p>
          ) : (
            <>
              <p className="start-overlay__title">
                {isLoading ? "loading..." : "click to enter"}
              </p>
              <p className="start-overlay__subtitle">audio-reactive experience</p>
              <div className="track-pills">
                {TRACKS.map((track) => (
                  <button
                    key={track.url}
                    className={
                      "track-pill" +
                      (currentTrack === track.url ? " track-pill--active" : "")
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTrack(track.url);
                    }}
                  >
                    {track.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Layer 3: Cursor overlay (desktop only, self-gated) ── */}
      <CursorOverlay />

      {/* ── Audio control bar ── */}
      {started && (
        <div className="audio-bar">
          <button
            className="audio-bar__btn"
            onClick={toggle}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "\u23F8" : "\u25B6"}
          </button>

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
        </div>
      )}
    </>
  );
}

export default App;
