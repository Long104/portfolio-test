// ── NavPill — Clan Battle Terminal ──
// Top-center pill. Each section gets a Japanese Gundam OS-style label.

import { RefractiveDiv } from "./Glass";

const SECTIONS = [
  { name: "hero", code: "覚醒" },
  { name: "about", code: "概要" },
  { name: "experience", code: "戦歴" },
  { name: "work", code: "作品" },
  { name: "contact", code: "通信" },
] as const;

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
      {SECTIONS.map((section, i) => (
        <button
          key={section.name}
          className={
            "nav-pill__item" +
            (i === activeIndex ? " nav-pill__item--active" : "")
          }
          onClick={() => onNavigate(i)}
        >
          <span className="nav-pill__name">{section.name}</span>
          <span className="nav-pill__code">{section.code}</span>
        </button>
      ))}
    </RefractiveDiv>
  );
}
