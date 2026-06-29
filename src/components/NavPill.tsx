// ── NavPill — Clan Battle Terminal ──

import { RefractiveDiv } from "./Glass";

const SECTIONS = ["pilot", "about", "experience", "work", "contact"] as const;

interface NavPillProps {
  activeIndex: number;
  onNavigate: (index: number) => void;
}

export function NavPill({ activeIndex, onNavigate }: NavPillProps) {
  return (
    <RefractiveDiv
      className="nav-pill"
      refraction={{
        radius: 28,
        blur: 4,
        glassThickness: 80,
        bezelWidth: 24,
        refractiveIndex: 1.45,
        specularOpacity: 0.72,
        specularAngle: 2.007,
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
