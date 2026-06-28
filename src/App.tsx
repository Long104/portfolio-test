import { useState, useCallback } from "react";
import Scene from "./Scene";
import { useAudioEngine, TRACKS } from "./useAudioEngine";

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 100,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0, 0, 0, 0.85)",
  backdropFilter: "blur(8px)",
  cursor: "pointer",
  userSelect: "none",
};

const titleStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.9)",
  fontSize: "13px",
  letterSpacing: "0.4em",
  textTransform: "uppercase",
  fontFamily: "monospace",
  margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.3)",
  fontSize: "10px",
  letterSpacing: "0.2em",
  fontFamily: "monospace",
  marginTop: "8px",
};

function pillStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
    border: active ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.1)",
    borderRadius: "20px",
    padding: "6px 16px",
    color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)",
    fontSize: "11px",
    fontFamily: "monospace",
    letterSpacing: "0.1em",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };
}

function App() {
  const [started, setStarted] = useState(false);
  const {
    isLoading, error, isPlaying,
    toggle, currentTrack, loadTrack,
  } = useAudioEngine();

  const handleStart = useCallback(async () => {
    await loadTrack(currentTrack);
    setStarted(true);
  }, [loadTrack, currentTrack]);

  const handleSelectTrack = useCallback(async (url: string) => {
    await loadTrack(url);
    setStarted(true);
  }, [loadTrack]);

  return (
    <>
      <Scene />

      {/* Click-to-start overlay */}
      {!started && (
        <div
          onClick={handleStart}
          style={overlayStyle}
        >
          {error ? (
            <p style={{ color: "#ff6b6b", fontSize: "14px", fontFamily: "monospace" }}>
              {error}
            </p>
          ) : (
            <>
              <p style={titleStyle}>
                {isLoading ? "Loading..." : "Click to Enter"}
              </p>
              <p style={subtitleStyle}>
                AUDIO-REACTIVE EXPERIENCE
              </p>
              {/* Song pills on start screen */}
              <div style={{ display: "flex", gap: "8px", marginTop: "24px" }}>
                {TRACKS.map((track) => (
                  <button
                    key={track.url}
                    onClick={(e) => { e.stopPropagation(); handleSelectTrack(track.url); }}
                    style={pillStyle(currentTrack === track.url)}
                  >
                    {track.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Control bar — bottom center */}
      {started && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            borderRadius: "24px",
            padding: "6px 12px",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Play/pause */}
          <button
            onClick={toggle}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontSize: "16px",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "\u23F8" : "\u25B6"}
          </button>

          <div style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.1)" }} />

          {/* Track pills */}
          {TRACKS.map((track) => (
            <button
              key={track.url}
              onClick={() => handleSelectTrack(track.url)}
              style={{
                background: currentTrack === track.url
                  ? "rgba(255,255,255,0.12)" : "transparent",
                border: "none",
                borderRadius: "16px",
                padding: "4px 12px",
                color: currentTrack === track.url
                  ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
                fontSize: "11px",
                fontFamily: "monospace",
                letterSpacing: "0.05em",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
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
