// ── HUD Layer ──
// Always-visible corner labels. Fixed position. Non-interactive.
// Monospace, dim, terminal-style system readout.

interface HUDProps {
  sectionIndex: number;
  totalSections: number;
  audioStatus: string;
  trackName: string;
}

export function HUD({
  sectionIndex,
  totalSections,
  audioStatus,
  trackName,
}: HUDProps) {
  const counter = `${String(sectionIndex + 1).padStart(2, "0")}/${String(totalSections).padStart(2, "0")}`;

  return (
    <>
      {/* Top-left: identity */}
      <div className="hud hud--tl">
        <div className="hud__name">pantorn</div>
        <div className="hud__role">software engineer</div>
      </div>

      {/* Top-right: audio status */}
      <div className="hud hud--tr">
        <div>{audioStatus}</div>
        <div className="hud__hint">{trackName}</div>
      </div>

      {/* Bottom-right: section counter */}
      <div className="hud hud--br">
        <div className="hud__counter">{counter}</div>
        {sectionIndex === 0 && (
          <div className="hud__hint">scroll to begin</div>
        )}
      </div>
    </>
  );
}
