// ── Psycommu Boot Sequence ──
// Omega Psycommu activation screen.
// Terminal boot sequence → cassette key insert → SYSTEM ONLINE.
// Replaces the plain "click to enter" overlay.

import { useState, useEffect, useCallback, useRef } from "react";

interface Props {
  isLoading: boolean;
  error: string | null;
  currentTrack: string;
  onStart: () => void;
  onSelectTrack: (url: string) => void;
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

const CHAR_MS = 15;       // ms per character (was 28)
const LINE_PAUSE_MS = 120; // pause between lines (was 300)

export function PsycommuBoot({
  isLoading,
  error,
  currentTrack,
  onStart,
  onSelectTrack,
  tracks,
}: Props) {
  const [bootLine, setBootLine] = useState(0);
  const [bootChar, setBootChar] = useState(0);
  const [phase, setPhase] = useState<"booting" | "flash" | "complete" | "skip">("booting");
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const skipRef = useRef(false);
  const startedRef = useRef(false); // prevent double-start

  // ── Boot sequence state machine ──
  useEffect(() => {
    if (phase === "complete" || phase === "skip") return;

    const line = BOOT_LINES[bootLine];
    if (!line) {
      setPhase("complete");
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
      }, 350); // was 600
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      if (skipRef.current) return;
      setBootLine((l) => l + 1);
      setBootChar(0);
    }, LINE_PAUSE_MS);
    return () => clearTimeout(t);
  }, [bootLine, bootChar, phase]);

  // ── Click anywhere during boot → skip to end ──
  const handleOverlayClick = useCallback(() => {
    if (phase === "complete" || fadeOut) return;
    skipRef.current = true;
    setBootLine(BOOT_LINES.length - 1);
    setBootChar(BOOT_LINES[BOOT_LINES.length - 1].val.length);
    setProgress(100);
    setPhase("complete");
  }, [phase, fadeOut]);

  // ── Engage (after boot complete) ──
  const handleEngage = useCallback(() => {
    if (isLoading || startedRef.current) return;
    startedRef.current = true;
    setFadeOut(true);
    setTimeout(() => onStart(), 600);
  }, [isLoading, onStart]);

  const handleSelect = useCallback(
    (url: string) => {
      if (isLoading || startedRef.current) return;
      startedRef.current = true;
      setFadeOut(true);
      setTimeout(() => onSelectTrack(url), 600);
    },
    [isLoading, onSelectTrack],
  );

  const isComplete = phase === "complete" || phase === "skip";

  return (
    <div
      className={`psycommu-boot ${fadeOut ? "psycommu-boot--fadeout" : ""}`}
      onClick={isComplete ? handleEngage : handleOverlayClick}
    >
      <div className="psycommu-boot__inner" onClick={(e) => e.stopPropagation()}>
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
                <div className="psycommu-boot__hint">
                  {isLoading ? "loading…" : "select track or click to engage ›"}
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
