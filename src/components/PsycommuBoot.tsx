// ── Psycommu Boot Sequence ──
// Omega Psycommu activation screen.
// Terminal boot sequence → cassette key insert → SYSTEM ONLINE.
// Replaces the plain "click to enter" overlay.

import { useState, useEffect, useCallback, useRef } from "react";
import { TunnelCanvas, type TunnelPhase } from "./TunnelCanvas";

interface Props {
  isLoading: boolean;
  error: string | null;
  currentTrack: string;
  onStart: () => void;
  onSelectTrack: (url: string) => void;
  onWarmUp?: () => void;
  tracks: { name: string; url: string }[];
}

const BOOT_LINES = [
  { addr: "PSY", val: "OMEGA-TYPE v2.5.1 — booting" },
  { addr: "DEV", val: "boot device / limiter — DETECTED" },
  { addr: "PSW", val: "psychowave scan — NEWTYPE SIGNATURE FOUND" },
  { addr: "NLT", val: "neural link — synced 100%" },
  { addr: "SYN", val: "frame coherence — 99.2%" },
  { addr: "RST", val: "restraints: ██ released" },
  { addr: "SYS", val: "SYSTEM ONLINE — omega psycommu active" },
];

const CHAR_MS = 4;        // ms per character (was 8)
const LINE_PAUSE_MS = 30;  // pause between lines (was 60)
const LAUNCH_RUSH_MS = 400; // tunnel rush duration after boot completes
const SKIP_RUSH_MS = 150;   // faster rush when user clicks to skip

export function PsycommuBoot({
  isLoading,
  error,
  currentTrack,
  onStart,
  onSelectTrack,
  onWarmUp,
  tracks,
}: Props) {
  const [bootLine, setBootLine] = useState(0);
  const [bootChar, setBootChar] = useState(0);
  const [phase, setPhase] = useState<"booting" | "flash" | "launching" | "complete" | "skip">("booting");
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const skipRef = useRef(false);
  const startedRef = useRef(false); // prevent double-start

  // ── Boot sequence state machine ──
  useEffect(() => {
    if (phase === "complete" || phase === "skip" || phase === "launching") return;

    const line = BOOT_LINES[bootLine];
    if (!line) {
      // Boot text done → trigger tunnel launch rush
      setPhase("launching");
      return;
    }

    const text = line.val;

    if (bootChar < text.length) {
      // Typewriter: advance one character
      const t = setTimeout(() => {
        setBootChar((c) => c + 1);
        setProgress(
          ((bootLine + (bootChar + 1) / text.length) / BOOT_LINES.length) * 100,
        );
      }, CHAR_MS);
      return () => clearTimeout(t);
    }

    // Line fully typed — flash if restraint release, then advance
    if (bootLine === 5) {
      // "restraints released" flash
      setPhase("flash");
      const t = setTimeout(() => {
        if (skipRef.current) return;
        setPhase("booting");
        setBootLine((l) => l + 1);
        setBootChar(0);
      }, 100); // was 180
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      if (skipRef.current) return;
      setBootLine((l) => l + 1);
      setBootChar(0);
    }, LINE_PAUSE_MS);
    return () => clearTimeout(t);
  }, [bootLine, bootChar, phase]);

  // ── Launch rush: wait for tunnel animation, then show LAUNCH ──
  useEffect(() => {
    if (phase !== "launching") return;
    const rushMs = skipRef.current ? SKIP_RUSH_MS : LAUNCH_RUSH_MS;
    const t = setTimeout(() => setPhase("complete"), rushMs);
    return () => clearTimeout(t);
  }, [phase]);

  // ── Click anywhere during boot → skip to end + warm up AudioContext ──
  const handleOverlayClick = useCallback(() => {
    onWarmUp?.(); // user gesture → AudioContext can resume
    if (phase === "complete" || phase === "launching" || fadeOut) return;
    skipRef.current = true;
    setBootLine(BOOT_LINES.length - 1);
    setBootChar(BOOT_LINES[BOOT_LINES.length - 1].val.length);
    setProgress(100);
    setPhase("launching"); // go through tunnel rush even on skip
  }, [phase, fadeOut, onWarmUp]);

  // ── Engage (after boot complete) ──
  const handleEngage = useCallback(() => {
    if (isLoading || startedRef.current) return;
    onWarmUp?.(); // user gesture → AudioContext can resume
    startedRef.current = true;
    setFadeOut(true);
    onStart(); // mount content immediately — entrance animations play under fading overlay
  }, [isLoading, onStart, onWarmUp]);

  const handleSelect = useCallback(
    (url: string) => {
      if (isLoading || startedRef.current) return;
      onWarmUp?.(); // user gesture → AudioContext can resume
      startedRef.current = true;
      setFadeOut(true);
      onSelectTrack(url); // mount content immediately
    },
    [isLoading, onSelectTrack, onWarmUp],
  );

  const isComplete = phase === "complete" || phase === "skip";
  const isLaunching = phase === "launching";

  // Map boot phase → tunnel phase
  const tunnelPhase: TunnelPhase = isLaunching
    ? "launching"
    : isComplete
      ? "done"
      : "idle";

  // Terminal text fades out during launch rush, reappears for LAUNCH button
  const textHidden = isLaunching;

  return (
    <div
      className={`psycommu-boot ${fadeOut ? "psycommu-boot--fadeout" : ""}`}
      onClick={isComplete ? handleEngage : handleOverlayClick}
    >
      {/* ── Tunnel background ── */}
      <TunnelCanvas phase={tunnelPhase} />

      <div
        className={`psycommu-boot__inner ${textHidden ? "psycommu-boot__inner--hidden" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="psycommu-boot__header">
          <span className="psycommu-boot__sysname">
            ══ PSYCOMMU SYSTEM ══
          </span>
          <span className="psycommu-boot__subsys">OMEGA-TYPE // ENDYMION UNIT</span>
        </div>

        {/* ── Register output ── */}
        <div className="psycommu-boot__registers">
          {BOOT_LINES.map((line, i) => {
            const isActive = i === bootLine;
            const isDone = i < bootLine;
            if (!isActive && !isDone) return null;

            const shown = isDone
              ? line.val
              : line.val.slice(0, bootChar);

            return (
              <div
                key={line.addr}
                className={[
                  "psycommu-boot__line",
                  isActive ? "psycommu-boot__line--active" : "",
                  isDone ? "psycommu-boot__line--done" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="psycommu-boot__addr">{line.addr} ▸</span>
                <span className="psycommu-boot__val">
                  {shown}
                  {isActive && bootChar < line.val.length && (
                    <span className="psycommu-boot__cursor">█</span>
                  )}
                </span>
                {isDone && (
                  <span className="psycommu-boot__check">✓</span>
                )}
              </div>
            );
          })}

          {/* ── Flash: RESTRAINTS RELEASED ── */}
          {phase === "flash" && (
            <div className="psycommu-boot__flash">
              <span className="psycommu-boot__flash-text">
                RESTRAINTS: ██ RELEASED
              </span>
            </div>
          )}
        </div>

        {/* ── Progress bar ── */}
        <div className="psycommu-boot__progress-track">
          <div
            className="psycommu-boot__progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* ── Ready state ── */}
        {isComplete && !fadeOut && (
          <div className="psycommu-boot__ready">
            <div className="psycommu-boot__ready-text">
              SYSTEM ONLINE — NEURAL LINK ESTABLISHED
            </div>

            {error ? (
              <p className="psycommu-boot__error">{error}</p>
            ) : (
              <>
                <div className="psycommu-boot__launch">
                  <button
                    className="psycommu-boot__launch-btn"
                    onClick={handleEngage}
                    disabled={isLoading}
                  >
                    {isLoading ? "LOADING" : "LAUNCH"}
                  </button>
                  <div className="psycommu-boot__launch-sub">
                    click to deploy mobile suit
                  </div>
                </div>

                <div className="track-pills">
                  {tracks.map((track) => (
                    <button
                      key={track.url}
                      className={
                        "track-pill" +
                        (currentTrack === track.url
                          ? " track-pill--active"
                          : "")
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(track.url);
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

        {/* ── Skip hint during boot ── */}
        {!isComplete && !fadeOut && (
          <div className="psycommu-boot__skip-hint">click to skip ›</div>
        )}
      </div>

      {/* ── Cassette key visual ── */}
      <div className="psycommu-boot__cassette">
        <div
          className={[
            "psycommu-boot__slot",
            isComplete ? "psycommu-boot__slot--active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="psycommu-boot__key" />
        </div>
        <span className="psycommu-boot__slot-label">
          BOOT DEVICE / LIMITER
        </span>
      </div>
    </div>
  );
}
