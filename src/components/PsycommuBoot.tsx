// ── Psycommu Boot Sequence ──
// Omega Psycommu activation screen.
// Terminal boot sequence → cassette key insert → SYSTEM ONLINE.
// Cinematic exit: white flash + scale-up + text scramble → content revealed.
// Tunnel background runs in an infinite loop underneath.

import { useState, useEffect, useCallback, useRef } from "react";
import { gsap } from "../lib/gsap";
import { TunnelCanvas, type TunnelPhase } from "./TunnelCanvas";

interface Props {
  phase: "enter" | "exit";
  isLoading: boolean;
  error: string | null;
  onStart: () => void;
  onWarmUp?: () => void;
  onExitComplete: () => void;
}

const BOOT_LINES = [
  { addr: "PSY", val: "OMEGA-TYPE v2.5.1 — booting" },
  { addr: "DEV", val: "boot device / limiter — DETECTED" },
  { addr: "PSW", val: "psychowave scan — NEWTYPE SIGNATURE FOUND" },
  { addr: "NLT", val: "neural link — synced 100%" },
  { addr: "RST", val: "restraints: ██ released" },
  { addr: "SYS", val: "SYSTEM ONLINE — omega psycommu active" },
];

const CHAR_MS = 4;
const LINE_PAUSE_MS = 30;

interface BootState {
  line: number;
  char: number;
  phase: "booting" | "flash" | "complete" | "skip";
  progress: number;
}

const INITIAL_BOOT: BootState = {
  line: 0,
  char: 0,
  phase: "booting",
  progress: 0,
};

export function PsycommuBoot({
  phase,
  isLoading,
  error,
  onStart,
  onWarmUp,
  onExitComplete,
}: Props) {
  const [boot, setBoot] = useState<BootState>(INITIAL_BOOT);
  const skipRef = useRef(false);
  const startedRef = useRef(false);
  const bootRef = useRef<HTMLDivElement>(null);
  const exitRan = useRef(false);

  // ── Boot sequence state machine (single state object = 1 render per tick) ──
  useEffect(() => {
    if (boot.phase === "complete" || boot.phase === "skip") return;

    const lineData = BOOT_LINES[boot.line];
    const text = lineData.val;

    if (boot.char < text.length) {
      const t = setTimeout(() => {
        setBoot((prev) => ({
          ...prev,
          char: prev.char + 1,
          progress: ((prev.line + (prev.char + 1) / text.length) / BOOT_LINES.length) * 100,
        }));
      }, CHAR_MS);
      return () => clearTimeout(t);
    }

    // Line fully typed — flash if restraint release, then advance
    if (boot.line === 4) {
      setBoot((prev) => ({ ...prev, phase: "flash" }));
      const t = setTimeout(() => {
        if (skipRef.current) return;
        setBoot((prev) => ({ ...prev, phase: "booting", line: prev.line + 1, char: 0 }));
      }, 100);
      return () => clearTimeout(t);
    }

    // Advance to next line, or complete if last line finished
    const t = setTimeout(() => {
      if (skipRef.current) return;
      setBoot((prev) => {
        if (prev.line >= BOOT_LINES.length - 1) {
          return { ...prev, phase: "complete" };
        }
        return { ...prev, line: prev.line + 1, char: 0 };
      });
    }, LINE_PAUSE_MS);
    return () => clearTimeout(t);
  }, [boot.line, boot.char, boot.phase]);

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

    // 1. Progress bar fills to 100% via GSAP (avoids setState in effect)
    const progressEl = el.querySelector(".psycommu-boot__progress-fill");
    if (progressEl) {
      gsap.to(progressEl, { width: "100%", duration: 0.3, ease: "power2.out" });
    }

    // 2. Brief white flash overlay (opacity 0 → 0.35 → 0)
    const flash = document.createElement("div");
    flash.className = "psycommu-flash";
    Object.assign(flash.style, {
      position: "fixed", inset: "0", zIndex: "101",
      background: "#fff", pointerEvents: "none",
      opacity: "0",
    });
    document.body.appendChild(flash);

    tl.to(flash, { opacity: 0.35, duration: 0.12, ease: "power2.out" }, 0)
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
    if (boot.phase === "complete" || phase === "exit") return;
    skipRef.current = true;
    setBoot({
      line: BOOT_LINES.length - 1,
      char: BOOT_LINES[BOOT_LINES.length - 1].val.length,
      progress: 100,
      phase: "complete",
    });
  }, [boot.phase, phase, onWarmUp]);

  // ── Engage (after boot complete) ──
  const handleEngage = useCallback(() => {
    if (isLoading || startedRef.current) return;
    onWarmUp?.();
    startedRef.current = true;
    onStart();
  }, [isLoading, onStart, onWarmUp]);

  const isComplete = boot.phase === "complete" || boot.phase === "skip";
  const isExiting = phase === "exit";

  // Tunnel keeps running until exit animation, then fades away
  const tunnelPhase: TunnelPhase = isExiting ? "done" : "running";

  return (
    <div
      ref={bootRef}
      className={`psycommu-boot ${isExiting ? "psycommu-boot--exiting" : ""}`}
      onClick={isComplete && !isExiting ? handleEngage : handleOverlayClick}
    >
      {/* ── Tunnel background (loops forever) ── */}
      <TunnelCanvas phase={tunnelPhase} />

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
            const isActive = i === boot.line;
            const isDone = i < boot.line;
            if (!isActive && !isDone) return null;

            const shown = isDone
              ? line.val
              : line.val.slice(0, boot.char);

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
                  {isActive && boot.char < line.val.length && !isExiting && (
                    <span className="psycommu-boot__cursor">█</span>
                  )}
                </span>
                {isDone && !isExiting && (
                  <span className="psycommu-boot__check">✓</span>
                )}
              </div>
            );
          })}

          {boot.phase === "flash" && (
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
            style={{ width: `${boot.progress}%` }}
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
