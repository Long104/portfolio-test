// ── AudioBar — Psycommu Control Panel ──
// Sliding active indicator + play/pause/track switch micro-interactions.

import { useRef, useEffect } from "react";
import { RefractiveDiv, buildSmallConfig } from "./Glass";
import { useDeviceOrientation } from "../useDeviceOrientation";
import { PsycommuWaveform } from "./PsycommuWaveform";
import { TRACKS } from "../useAudioEngine";
import { gsap } from "../lib/gsap";

interface AudioBarProps {
  isPlaying: boolean;
  currentTrack: string;
  theme: string;
  toggle: () => void;
  handleSelectTrack: (url: string) => void;
  onToggleTheme: () => void;
}

export function AudioBar({
  isPlaying,
  currentTrack,
  theme,
  toggle,
  handleSelectTrack,
  onToggleTheme,
}: AudioBarProps) {
  const specularAngle = useDeviceOrientation();
  const indicatorRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLButtonElement[]>([]);
  const initialised = useRef(false);

  // ── Slide indicator to active track ──
  useEffect(() => {
    const indicator = indicatorRef.current;
    const activeIdx = TRACKS.findIndex((t) => t.url === currentTrack);
    const target = itemsRef.current[activeIdx];
    if (!indicator || !target) return;

    const bar = indicator.parentElement;
    if (!bar) return;

    const barRect = bar.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const left = targetRect.left - barRect.left;
    const w = targetRect.width;

    if (!initialised.current) {
      initialised.current = true;
      gsap.set(indicator, { left, width: w });
      return;
    }

    const anim = gsap.to(indicator, {
      left,
      width: w,
      duration: 0.4,
      ease: "power3.out",
      overwrite: "auto",
    });

    return () => { anim.kill(); };
  }, [currentTrack]);

  return (
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
        {/* Sliding active indicator */}
        <div ref={indicatorRef} className="audio-bar__indicator" />
        {TRACKS.map((track, i) => (
          <button
            key={track.url}
            ref={(el) => { if (el) itemsRef.current[i] = el; }}
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
        onClick={onToggleTheme}
        aria-label={`Switch to ${theme === "gquuuuuux" ? "GFreD" : "GQuuuuuuX"} theme`}
      >
        {theme === "gquuuuuux" ? "gMS-Ω" : "gMS-κ"}
      </button>
    </RefractiveDiv>
  );
}
