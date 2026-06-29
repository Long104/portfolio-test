// ── NavPill — Clan Battle Terminal ──

import { RefractiveDiv, buildGlassConfig } from "./Glass";
import { useDeviceOrientation } from "../useDeviceOrientation";

const SECTIONS = ["pilot", "about", "experience", "work", "contact"] as const;

interface NavPillProps {
  activeIndex: number;
  onNavigate: (index: number) => void;
}

export function NavPill({ activeIndex, onNavigate }: NavPillProps) {
  const specularAngle = useDeviceOrientation();
  return (
    <RefractiveDiv
      className="nav-pill"
      refraction={buildGlassConfig(specularAngle)}
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
