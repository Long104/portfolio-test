import { useState, useCallback, useRef } from "react";
import Scene from "./Scene";
import PortfolioContent from "./components/PortfolioContent";
import Cursor from "./components/Cursor";
import { useAudioEngine } from "./useAudioEngine";

function App() {
  const [started, setStarted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { start, isLoading, error, isPlaying, toggle } = useAudioEngine();

  const handleStart = useCallback(async () => {
    await start();
    setStarted(true);
  }, [start]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const progress = el.scrollTop / (el.scrollHeight - el.clientHeight);
    setScrollProgress(Math.min(Math.max(progress, 0), 1));
  }, []);

  return (
    <>
      {/* Fixed 3D background — always rendering, now scroll-reactive */}
      <Scene scrollProgress={scrollProgress} />

      {/* Scrollable portfolio content — visible only after start */}
      {started && <PortfolioContent scrollRef={scrollRef} onScroll={handleScroll} />}

      {/* Click-to-start overlay — blocks everything until user interacts */}
      {!started && (
        <div
          onClick={handleStart}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            cursor: isLoading ? "wait" : "pointer",
            transition: "opacity 0.8s ease-out",
            userSelect: "none",
          }}
        >
          {error ? (
            <p style={{ color: "#ff6b6b", fontSize: "14px", fontFamily: "monospace" }}>
              {error}
            </p>
          ) : (
            <>
              <p
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: "13px",
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                  margin: 0,
                }}
              >
                {isLoading ? "Loading..." : "Click to Enter"}
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  fontFamily: "monospace",
                  marginTop: "8px",
                }}
              >
                AUDIO-REACTIVE PORTFOLIO
              </p>
            </>
          )}
        </div>
      )}

      {/* 2D smooth cursor — only after start to avoid overlay conflicts */}
      {started && <Cursor />}

      {/* Mute/unmute toggle */}
      {started && (
        <button
          onClick={toggle}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 50,
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            color: "rgba(255,255,255,0.7)",
            cursor: "pointer",
            backdropFilter: "blur(4px)",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.7)";
            e.currentTarget.style.color = "rgba(255,255,255,0.9)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.5)";
            e.currentTarget.style.color = "rgba(255,255,255,0.7)";
          }}
          aria-label={isPlaying ? "Pause music" : "Play music"}
        >
          {isPlaying ? "\u266A" : "\u23F8"}
        </button>
      )}
    </>
  );
}

export default App;
