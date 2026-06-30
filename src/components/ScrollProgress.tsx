// ── ScrollProgress — Audio-reactive progress bar ──
// Smooth GSAP-driven scroll indicator with bass-reactive glow pulse.

import { useRef, useEffect } from "react";
import { gsap } from "../lib/gsap";
import { getAudioData } from "../useAudioEngine";

interface ScrollProgressProps {
  progress: number; // 0–100
}

export function ScrollProgress({ progress }: ScrollProgressProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const currentWidth = useRef(0);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    const bar = barRef.current;
    const glow = glowRef.current;
    if (!bar || !glow) return;

    const ticker = gsap.ticker.add(() => {
      const target = progressRef.current;

      // Smooth width toward target (lerp)
      currentWidth.current += (target - currentWidth.current) * 0.08;
      bar.style.width = `${currentWidth.current}%`;

      // Audio-reactive glow
      const audio = getAudioData();
      const bass = audio.bass;
      const level = audio.level;
      const glowIntensity = 0.3 + bass * 0.7 + level * 0.3;

      glow.style.opacity = String(Math.min(1, glowIntensity));
      glow.style.width = `${Math.min(100, currentWidth.current + 3)}%`;
      glow.style.filter = `blur(${4 + bass * 10}px)`;
    });

    return () => {
      gsap.ticker.remove(ticker);
    };
  }, []); // mount only — progressRef avoids stale closure

  return (
    <div className="scroll-progress" ref={barRef}>
      <div className="scroll-progress__glow" ref={glowRef} />
    </div>
  );
}
