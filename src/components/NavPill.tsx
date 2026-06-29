// ── NavPill — Clan Battle Terminal ──

import { RefractiveDiv, buildNavConfig } from "./Glass";
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
  );
}
