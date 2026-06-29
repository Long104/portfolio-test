import { useCallback, useRef, useState } from "react";
import { AudioEngine, type AudioData } from "./audio";

export const TRACKS = [
  { name: "Instrumental", url: "/far-beyond-the-starts-instrusmental.mp3" },
  { name: "Original", url: "/far_beyond-the-stars.mp3" },
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
  const [currentTrack, setCurrentTrack] = useState(TRACKS[0].url);

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

  const start = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await engineRef.current.start();
      setIsPlaying(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start audio";
      setError(msg);
      console.error("[AudioEngine]", msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pause = useCallback(() => {
    engineRef.current.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else start();
  }, [isPlaying, start, pause]);

  const getData = useCallback((): AudioData => {
    return engineRef.current.getData();
  }, []);

  return {
    isPlaying, isLoading, error,
    currentTrack, loadTrack,
    start, pause, toggle, getData,
  };
}
