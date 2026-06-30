// ── Psycommu Boot Sequence ──
// Omega Psycommu activation screen.
// Terminal boot sequence → cassette key insert → SYSTEM ONLINE.
// Cinematic exit: white flash + scale-up + text scramble → content revealed.

import { useState, useEffect, useCallback, useRef } from "react";
import { gsap } from "../lib/gsap";

interface Props {
  phase: "enter" | "exit";
  isLoading: boolean;
  error: string | null;
  currentTrack: string;
  onStart: () => void;
  onSelectTrack: (url: string) => void;
  onWarmUp?: () => void;
  onExitComplete: () => void;
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

const CHAR_MS = 4;
const LINE_PAUSE_MS = 30;

export function PsycommuBoot({
  phase,
  isLoading,
  error,
  currentTrack,
  onStart,
  onSelectTrack,
  onWarmUp,
  onExitComplete,
  tracks,
}: Props) {
  const [bootLine, setBootLine] = useState(0);
  const [bootChar, setBootChar] = useState(0);
  const [bootPhase, setBootPhase] = useState<"booting" | "flash" | "complete" | "skip">("booting");
  const [progress, setProgress] = useState(0);
  const skipRef = useRef(false);
  const startedRef = useRef(false);
  const bootRef = useRef<HTMLDivElement>(null);
  const exitRan = useRef(false);

  // ── Boot sequence state machine ──
  useEffect(() => {
    if (bootPhase === "complete" || bootPhase === "skip") return;

    const line = BOOT_LINES[bootLine];
    if (!line) {
      setBootPhase("complete");
      return;
    }

    const text = line.val;

    if (bootChar < text.length) {
      const t = setTimeout(() => {
        setBootChar((c) => c + 1);
        setProgress(
          ((bootLine + (bootChar + 1) / text.length) / BOOT_LINES.length) * 100,
        );
      }, CHAR_MS);
      return () => clearTimeout(t);
    }

    if (bootLine === 5) {
      setBootPhase("flash");
      const t = setTimeout(() => {
        if (skipRef.current) return;
        setBootPhase("booting");
        setBootLine((l) => l + 1);
        setBootChar(0);
      }, 100);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      if (skipRef.current) return;
      setBootLine((l) => l + 1);
      setBootChar(0);
    }, LINE_PAUSE_MS);
    return () => clearTimeout(t);
  }, [bootLine, bootChar, bootPhase]);

  // ── Cinematic exit animation (runs once when phase → "exit") ──
  useEffect(() => {
    if (phase !== "exit" || exitRan.current) return;
    exitRan.current = true;
    const el = bootRef.current;
    if (!el) { onExitComplete(); return; }

    // Build a GSAP timeline for the cinematic exit
    const tl = gsap.timeline({
      onComplete: onExitComplete,
    });

    // 1. Progress bar fills to 100%
    setProgress(100);

    // 2. Brief white flash overlay (opacity 0 → 0.7 → 0)
    const flash = document.createElement("div");
    flash.className = "psycommu-flash";
    Object.assign(flash.style, {
      position: "fixed", inset: "0", zIndex: "101",
      background: "#fff", pointerEvents: "none",
      opacity: "0",
    });
    document.body.appendChild(flash);

    tl.to(flash, { opacity: 0.7, duration: 0.12, ease: "power2.out" }, 0)
      .to(flash, { opacity: 0, duration: 0.35, ease: "power2.in" }, 0.12);

    // 3. Boot content scales up + fades
    tl.to(el, {
      scale: 1.08,
      opacity: 0,
      duration: 0.6,
      ease: "power3.in",
    }, 0.15);

    // 4. Glitch: scramble text with rapid random chars (CSS handles the visual)
    el.classList.add("psycommu-boot--exiting");

    // Cleanup: remove flash after animation
    tl.call(() => { flash.remove(); }, undefined, 0.5);

    return () => {
      tl.kill();
      flash.remove();
    };
  }, [phase, onExitComplete]);

  // ── Click anywhere during boot → skip to end + warm up AudioContext ──
  const handleOverlayClick = useCallback(() => {
    onWarmUp?.();
    if (bootPhase === "complete" || phase === "exit") return;
    skipRef.current = true;
    setBootLine(BOOT_LINES.length - 1);
    setBootChar(BOOT_LINES[BOOT_LINES.length - 1].val.length);
    setProgress(100);
    setBootPhase("complete");
  }, [bootPhase, phase, onWarmUp]);

  // ── Engage (after boot complete) ──
  const handleEngage = useCallback(() => {
    if (isLoading || startedRef.current) return;
    onWarmUp?.();
    startedRef.current = true;
    onStart(); // parent sets phase → "exit" which triggers the cinematic animation
  }, [isLoading, onStart, onWarmUp]);

  const handleSelect = useCallback(
    (url: string) => {
      if (isLoading || startedRef.current) return;
      onWarmUp?.();
      startedRef.current = true;
      onSelectTrack(url);
    },
    [isLoading, onSelectTrack, onWarmUp],
  );

  const isComplete = bootPhase === "complete" || bootPhase === "skip";
  const isExiting = phase === "exit";

  return (
    <div
      ref={bootRef}
      className={`psycommu-boot ${isExiting ? "psycommu-boot--exiting" : ""}`}
      onClick={isComplete && !isExiting ? handleEngage : handleOverlayClick}
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
                  isExiting ? "psycommu-boot__line--scramble" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="psycommu-boot__addr">{line.addr} ▸</span>
                <span className="psycommu-boot__val">
                  {isExiting && isDone
                    ? scrambleText(shown)
                    : shown}
                  {isActive && bootChar < line.val.length && !isExiting && (
                    <span className="psycommu-boot__cursor">█</span>
                  )}
                </span>
                {isDone && !isExiting && (
                  <span className="psycommu-boot__check">✓</span>
                )}
              </div>
            );
          })}

          {bootPhase === "flash" && (
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
        {isComplete && !isExiting && (
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
        {!isComplete && !isExiting && (
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

// ── Scramble: replace most chars with random garbage ──
const GLITCH_CHARS = "!@#$%^&*()_+-=[]{}|;':\",./<>?~`0123456789";

function scrambleText(text: string): string {
  return text
    .split("")
    .map((ch) => {
      // Keep spaces intact, scramble everything else with 80% probability
      if (ch === " ") return " ";
      return Math.random() < 0.8
        ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
        : ch;
    })
    .join("");
}
