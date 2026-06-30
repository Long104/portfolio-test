// ── NavPill — Clan Battle Terminal ──

import { RefractiveDiv, buildNavConfig } from "./Glass";
import { useCursorSpecular } from "../hooks/useCursorSpecular";
import { useGlassInteraction } from "../hooks/useGlassInteraction";

const SECTIONS = ["pilot", "about", "experience", "work", "contact"] as const;

interface NavPillProps {
  activeIndex: number;
  onNavigate: (index: number) => void;
}

export function NavPill({ activeIndex, onNavigate }: NavPillProps) {
  const specularAngle = useCursorSpecular();
  const { ref: glassRef } = useGlassInteraction({
    maxTilt: 0, // no tilt on nav pill — too small
    glowRadius: "30%",
    glowColor: "rgba(255, 79, 216, 0.06)",
  });

  return (
    <div ref={glassRef}>
      <RefractiveDiv
        className="nav-pill glass-interactive"
        refraction={buildNavConfig(specularAngle)}
      >
        <div className="nav-pill__segmented">
        {SECTIONS.map((name, i) => (
          <button
            key={name}
            className={
              "nav-pill__item" +
              (i === activeIndex ? " nav-pill__item--active" : "")
            }
            onClick={() => onNavigate(i)}
          >
            {name}
          </button>
        ))}
        </div>
      </RefractiveDiv>
    </div>
  );
}
