// ── NavPill — liquid glass section navigation ──
// Top-center pill matching audio-bar glass style.

import { RefractiveDiv } from "./Glass";

const SECTIONS = ["hero", "about", "experience", "work", "contact"] as const;

interface NavPillProps {
  activeIndex: number;
  onNavigate: (index: number) => void;
}

export function NavPill({ activeIndex, onNavigate }: NavPillProps) {
  return (
    <RefractiveDiv
      className="nav-pill"
      refraction={{
        radius: 24,
        blur: 4,
        bezelWidth: 8,
        specularOpacity: 0.12,
      }}
    >
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
    </RefractiveDiv>
  );
}
