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
        radius: 24,
        blur: 12,
        glassThickness: 20,
        bezelWidth: 24,
        refractiveIndex: 1.05,
        specularOpacity: 0.08,
        specularAngle: Math.PI / 3,
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
