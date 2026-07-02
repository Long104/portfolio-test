// ── UI Sound Effects — Gundam cockpit aesthetic ──
// Procedural Web Audio tones. No audio files, zero network cost.
//
// Sound palette:
//   hover  → radar lock-on ping (short, high, subtle)
//   click  → cockpit switch pop (percussive, mechanical)
//   open   → system power-up arpeggio (rising 3-note chime)
//   close  → system shutdown (descending slide)
//   nav    → radar sweep (soft triangle whoosh)
//
// All sounds are whisper-quiet (~-24dB peak).
// Silently no-ops when prefers-reduced-motion is set.

// ── Gate: respect reduced motion (sensory sensitivity) ──
const PREFERS_REDUCED_MOTION =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Shared AudioContext singleton ──
let ctx: AudioContext | null = null;
let resumed = false;

function getCtx(): AudioContext | null {
  if (PREFERS_REDUCED_MOTION) return null;
  if (!ctx) ctx = new AudioContext();
  // First call after user gesture: resume if suspended.
  // Subsequent calls are no-ops.
  if (ctx.state === "suspended" && !resumed) {
    ctx.resume();
    resumed = true;
  }
  return ctx;
}

// ── Utility: quick tone ──
function tone(
  freq: number,
  endFreq: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
  startTime?: number,
) {
  const c = getCtx();
  if (!c) return;
  const t = startTime ?? c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (endFreq !== freq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 20), t + duration);
  }
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.01);
}

// ── Radar lock-on ping (hover) ──
// Very short sine blip with subtle vibrato — sounds like distant radar echo.
export function playHoverSound(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = "sine";
  // Base frequency with light vibrato (FM at ~40Hz)
  osc.frequency.setValueAtTime(1000, t);
  osc.frequency.linearRampToValueAtTime(1400, t + 0.04);
  const vibrato = c.createOscillator();
  vibrato.frequency.value = 40;
  vibrato.type = "sine";
  const vibratoGain = c.createGain();
  vibratoGain.gain.value = 15; // ±15Hz wobble
  vibrato.connect(vibratoGain).connect(osc.frequency);
  vibrato.start(t);
  vibrato.stop(t + 0.08);

  gain.gain.setValueAtTime(0.04, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.09);
}

// ── Cockpit switch click ──
// Short percussive pop — frequency drops quickly, like a mechanical switch.
export function playClickSound(): void {
  tone(600, 300, 0.06, 0.07, "sine");
}

// ── System power-up arpeggio (open overlay) ──
// Three rising notes: 300Hz → 600Hz → 1000Hz, each 50ms apart.
export function playOpenSound(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  tone(300, 300, 0.05, 0.05, "sine", t);
  tone(600, 600, 0.05, 0.05, "sine", t + 0.04);
  tone(1000, 1000, 0.08, 0.04, "sine", t + 0.08);
}

// ── System shutdown (close overlay) ──
// Slow descending slide — 800Hz → 200Hz over 150ms.
export function playCloseSound(): void {
  tone(800, 200, 0.15, 0.04, "sine");
}

// ── Radar sweep (nav section change) ──
// Soft triangle whoosh — low volume, warm character.
export function playNavSound(): void {
  tone(500, 700, 0.1, 0.025, "triangle");
}
