import type { CSSProperties, JSX } from "react";

type GeometryKind = "gomboc" | "toroid" | "cube" | "icosahedron" | "dodecahedron";

const ROTATION_SPEED_FACTOR = 0.65;

interface GeometryItem {
  id: string;
  kind: GeometryKind;
  top: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  tone: string;
  reverse?: boolean;
  warm?: boolean;
  desktopOnly?: boolean;
}

const geometryItems: GeometryItem[] = [
  { id: "gomboc-1", kind: "gomboc", top: "4%", left: "4%", size: 128, duration: 150, delay: -8, opacity: 0.24, tone: "rgba(14, 165, 233, 0.68)" },
  { id: "cube-1", kind: "cube", top: "6%", left: "18%", size: 110, duration: 136, delay: -26, opacity: 0.22, tone: "rgba(2, 132, 199, 0.64)", reverse: true },
  { id: "icosahedron-1", kind: "icosahedron", top: "3%", left: "34%", size: 124, duration: 162, delay: -14, opacity: 0.24, tone: "rgba(14, 165, 233, 0.7)" },
  { id: "toroid-1", kind: "toroid", top: "7%", left: "52%", size: 134, duration: 176, delay: -32, opacity: 0.21, tone: "rgba(3, 105, 161, 0.62)", reverse: true },
  { id: "dodecahedron-1", kind: "dodecahedron", top: "5%", left: "69%", size: 120, duration: 158, delay: -22, opacity: 0.22, tone: "rgba(14, 165, 233, 0.64)" },
  { id: "cube-2", kind: "cube", top: "4%", left: "86%", size: 100, duration: 148, delay: -40, opacity: 0.2, tone: "rgba(14, 165, 233, 0.58)", desktopOnly: true, reverse: true },

  { id: "toroid-2", kind: "toroid", top: "23%", left: "7%", size: 124, duration: 168, delay: -10, opacity: 0.2, tone: "rgba(14, 165, 233, 0.62)", desktopOnly: true },
  { id: "gomboc-2", kind: "gomboc", top: "29%", left: "23%", size: 112, duration: 152, delay: -30, opacity: 0.2, tone: "rgba(14, 165, 233, 0.6)", desktopOnly: true, reverse: true },
  { id: "dodecahedron-2", kind: "dodecahedron", top: "26%", left: "39%", size: 118, duration: 174, delay: -20, opacity: 0.2, tone: "rgba(3, 105, 161, 0.62)", desktopOnly: true },
  { id: "icosahedron-2", kind: "icosahedron", top: "31%", left: "56%", size: 112, duration: 160, delay: -36, opacity: 0.2, tone: "rgba(14, 165, 233, 0.64)", desktopOnly: true, reverse: true },
  { id: "cube-3", kind: "cube", top: "24%", left: "74%", size: 102, duration: 142, delay: -12, opacity: 0.19, tone: "rgba(14, 165, 233, 0.58)", desktopOnly: true },
  { id: "gomboc-5", kind: "gomboc", top: "34%", left: "88%", size: 98, duration: 148, delay: -5, opacity: 0.18, tone: "rgba(14, 165, 233, 0.54)", desktopOnly: true },

  { id: "dodecahedron-3", kind: "dodecahedron", top: "52%", left: "6%", size: 112, duration: 170, delay: -18, opacity: 0.19, tone: "rgba(14, 165, 233, 0.6)", desktopOnly: true },
  { id: "toroid-3", kind: "toroid", top: "57%", left: "21%", size: 130, duration: 182, delay: -42, opacity: 0.2, tone: "rgba(2, 132, 199, 0.6)", desktopOnly: true, reverse: true },
  { id: "cube-4", kind: "cube", top: "55%", left: "38%", size: 104, duration: 144, delay: -6, opacity: 0.18, tone: "rgba(14, 165, 233, 0.56)", desktopOnly: true },
  { id: "gomboc-3", kind: "gomboc", top: "60%", left: "53%", size: 114, duration: 166, delay: -28, opacity: 0.19, tone: "rgba(3, 105, 161, 0.6)", desktopOnly: true, reverse: true },
  { id: "icosahedron-3", kind: "icosahedron", top: "53%", left: "69%", size: 108, duration: 156, delay: -16, opacity: 0.18, tone: "rgba(14, 165, 233, 0.56)", desktopOnly: true },
  { id: "cube-6", kind: "cube", top: "63%", left: "84%", size: 96, duration: 146, delay: -11, opacity: 0.18, tone: "rgba(14, 165, 233, 0.54)", desktopOnly: true },

  { id: "toroid-4", kind: "toroid", top: "72%", left: "8%", size: 118, duration: 176, delay: -38, opacity: 0.22, tone: "rgba(14, 165, 233, 0.62)", desktopOnly: true },
  { id: "dodecahedron-4", kind: "dodecahedron", top: "81%", left: "22%", size: 104, duration: 146, delay: -8, opacity: 0.2, tone: "rgba(2, 132, 199, 0.58)", desktopOnly: true, reverse: true },
  { id: "cube-5", kind: "cube", top: "78%", left: "38%", size: 98, duration: 140, delay: -24, opacity: 0.2, tone: "rgba(14, 165, 233, 0.58)", desktopOnly: true },
  { id: "icosahedron-4", kind: "icosahedron", top: "83%", left: "54%", size: 104, duration: 164, delay: -33, opacity: 0.2, tone: "rgba(14, 165, 233, 0.6)", desktopOnly: true, reverse: true },
  { id: "gomboc-4", kind: "gomboc", top: "76%", left: "70%", size: 100, duration: 154, delay: -14, opacity: 0.2, tone: "rgba(3, 105, 161, 0.58)", desktopOnly: true },
  { id: "toroid-5", kind: "toroid", top: "85%", left: "84%", size: 108, duration: 166, delay: -19, opacity: 0.19, tone: "rgba(14, 165, 233, 0.58)", desktopOnly: true },
  { id: "cube-7", kind: "cube", top: "92%", left: "8%", size: 90, duration: 144, delay: -17, opacity: 0.18, tone: "rgba(14, 165, 233, 0.54)", desktopOnly: true },
  { id: "dodecahedron-5", kind: "dodecahedron", top: "92%", left: "44%", size: 94, duration: 152, delay: -31, opacity: 0.18, tone: "rgba(14, 165, 233, 0.54)", desktopOnly: true, reverse: true },
  { id: "icosahedron-5", kind: "icosahedron", top: "94%", left: "78%", size: 96, duration: 160, delay: -13, opacity: 0.18, tone: "rgba(3, 105, 161, 0.54)", desktopOnly: true },

  { id: "red-glow-1", kind: "icosahedron", top: "66%", left: "31%", size: 122, duration: 170, delay: -9, opacity: 0.24, tone: "rgba(239, 68, 68, 0.8)", warm: true, desktopOnly: true },
  { id: "red-glow-2", kind: "toroid", top: "88%", left: "68%", size: 104, duration: 180, delay: -27, opacity: 0.22, tone: "rgba(244, 63, 94, 0.76)", warm: true, desktopOnly: true, reverse: true },
];

function GeometryGlyph({ kind }: { kind: GeometryKind }): JSX.Element {
  switch (kind) {
    case "cube":
      return (
        <svg viewBox="0 0 120 120" className="geo-svg">
          <g className="geo-stroke-primary">
            <polygon points="30,34 76,34 76,80 30,80" />
            <polygon points="44,22 90,22 90,68 44,68" />
            <line x1="30" y1="34" x2="44" y2="22" />
            <line x1="76" y1="34" x2="90" y2="22" />
            <line x1="76" y1="80" x2="90" y2="68" />
            <line x1="30" y1="80" x2="44" y2="68" />
          </g>
          <g className="geo-stroke-secondary">
            <line x1="53" y1="34" x2="53" y2="80" />
            <line x1="67" y1="22" x2="67" y2="68" />
          </g>
        </svg>
      );
    case "toroid":
      return (
        <svg viewBox="0 0 120 120" className="geo-svg">
          <g className="geo-stroke-primary">
            <ellipse cx="60" cy="60" rx="44" ry="26" />
            <ellipse cx="60" cy="60" rx="24" ry="13" />
          </g>
          <g className="geo-stroke-secondary">
            <ellipse cx="60" cy="60" rx="44" ry="10" />
            <ellipse cx="60" cy="60" rx="34" ry="6" />
          </g>
        </svg>
      );
    case "icosahedron":
      return (
        <svg viewBox="0 0 120 120" className="geo-svg">
          <g className="geo-stroke-primary">
            <polygon points="60,14 92,34 92,86 60,106 28,86 28,34" />
            <line x1="60" y1="14" x2="28" y2="34" />
            <line x1="60" y1="14" x2="92" y2="34" />
            <line x1="60" y1="106" x2="28" y2="86" />
            <line x1="60" y1="106" x2="92" y2="86" />
            <line x1="28" y1="34" x2="92" y2="86" />
            <line x1="92" y1="34" x2="28" y2="86" />
          </g>
          <g className="geo-stroke-secondary">
            <line x1="60" y1="14" x2="60" y2="106" />
            <line x1="28" y1="60" x2="92" y2="60" />
          </g>
        </svg>
      );
    case "dodecahedron":
      return (
        <svg viewBox="0 0 120 120" className="geo-svg">
          <g className="geo-stroke-primary">
            <polygon points="60,10 86,20 102,44 98,72 76,94 44,94 22,72 18,44 34,20" />
            <polygon points="60,24 78,31 88,48 84,66 69,80 51,80 36,66 32,48 42,31" />
          </g>
          <g className="geo-stroke-secondary">
            <line x1="34" y1="20" x2="42" y2="31" />
            <line x1="86" y1="20" x2="78" y2="31" />
            <line x1="22" y1="72" x2="36" y2="66" />
            <line x1="98" y1="72" x2="84" y2="66" />
            <line x1="44" y1="94" x2="51" y2="80" />
            <line x1="76" y1="94" x2="69" y2="80" />
          </g>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 120 120" className="geo-svg">
          <g className="geo-stroke-primary">
            <ellipse cx="62" cy="58" rx="38" ry="30" transform="rotate(-18 62 58)" />
            <ellipse cx="56" cy="62" rx="22" ry="16" transform="rotate(-18 56 62)" />
          </g>
          <g className="geo-stroke-secondary">
            <line x1="28" y1="57" x2="92" y2="57" />
            <line x1="34" y1="70" x2="84" y2="70" />
          </g>
        </svg>
      );
  }
}

export function AnimatedGeometryBackground(): JSX.Element {
  return (
    <div aria-hidden className="geo-scene">
      <div className="geo-mist geo-mist--one" />
      <div className="geo-mist geo-mist--two" />
      <div className="geo-mist geo-mist--three" />

      {geometryItems.map((item) => {
        const style: CSSProperties = {
          top: item.top,
          left: item.left,
          width: `${item.size}px`,
          height: `${item.size}px`,
          animationDuration: `${Math.round(item.duration * ROTATION_SPEED_FACTOR)}s`,
          animationDelay: `${item.delay}s`,
          opacity: item.opacity,
          color: item.tone,
        };

        return (
          <div
            key={item.id}
            className={`geo-item${item.desktopOnly ? " geo-item--desktop" : ""}${item.reverse ? " geo-item--reverse" : ""}${
              item.warm ? " geo-item--warm" : ""
            }`}
            style={style}
          >
            <GeometryGlyph kind={item.kind} />
          </div>
        );
      })}
    </div>
  );
}
