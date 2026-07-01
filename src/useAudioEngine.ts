import { useCallback, useRef, useState } from "react";
import { AudioEngine, type AudioData } from "./audio";

export const TRACKS = [
  { name: "Instrumental", url: "/far-beyond-the-stars-instrumental.opus" },
  { name: "Original", url: "/far_beyond-the-stars.opus" },
];

// Singleton — one AudioEngine shared across all components.
let engineSingleton: AudioEngine | null = null;

function getEngine() {
  if (!engineSingleton) engineSingleton = new AudioEngine();
  return engineSingleton;
}

// Standalone accessor for non-React consumers (e.g. cursor overlay).
// Avoids creating a second React state instance in components that only need data.
export function getAudioData(): AudioData {
  return getEngine().getData();
}

export function useAudioEngine() {
  const engineRef = useRef<AudioEngine>(getEngine());
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(TRACKS[0].url);

  /** Warm up AudioContext (call from user gesture handler during boot). */
  const warmUp = useCallback(async () => {
    await engineRef.current.warmUp();
  }, []);

  /** Preload default track in background during boot — no playback. */
  const preload = useCallback(async (url: string) => {
    if (isPreloaded) return;
    setError(null);
    try {
      await engineRef.current.preloadTrack(url);
      setCurrentTrack(url);
      setIsPreloaded(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to preload";
      setError(msg);
      console.error("[AudioEngine]", msg);
    }
  }, [isPreloaded]);

  /** Full load + immediate playback (fallback if not preloaded). */
  const loadTrack = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await engineRef.current.loadTrack(url);
      setCurrentTrack(url);
      await engineRef.current.start();
      setIsPlaying(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load track";
      setError(msg);
      console.error("[AudioEngine]", msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Start playback from preloaded buffer — near-instant. */
  const engage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await engineRef.current.start();
      setIsPlaying(true);
    } catch (e) {
      // Browser likely blocked AudioContext.resume() (autoplay policy).
      // That's fine — user can click play on the audio bar to start.
      console.warn("[AudioEngine] Autoplay blocked — user will need to click play", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pause = useCallback(() => {
    engineRef.current.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isLoading) return; // Don't toggle while loading
    if (isPlaying) pause();
    else engage();
  }, [isPlaying, isLoading, engage, pause]);

  const getData = useCallback((): AudioData => {
    return engineRef.current.getData();
  }, []);

  return {
    isPlaying, isLoading, error,
    isPreloaded, currentTrack,
    warmUp, preload, loadTrack, engage,
    pause, toggle, getData,
  };
}
