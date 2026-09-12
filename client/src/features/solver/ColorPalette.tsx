import { COLORS, type Color } from "@cube-coach/cube-engine";
import { Check } from "lucide-react";
import { STICKER_COLOR } from "../../three/materials.js";

const COLOR_LABEL: Record<Color, string> = {
  white: "White",
  yellow: "Yellow",
  red: "Red",
  orange: "Orange",
  blue: "Blue",
  green: "Green",
};

interface ColorPaletteProps {
  selected: Color;
  onSelect: (color: Color) => void;
}

export function ColorPalette({ selected, onSelect }: ColorPaletteProps) {
  return (
    <div role="radiogroup" aria-label="Sticker color" className="flex flex-wrap gap-2">
      {COLORS.map((color) => {
        const isSelected = color === selected;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={COLOR_LABEL[color]}
            onClick={() => onSelect(color)}
            className={`flex items-center gap-2 rounded-md border-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
              isSelected ? "border-sky-400 bg-slate-800" : "border-slate-700 bg-slate-900 hover:border-slate-500"
            }`}
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full border border-black/30"
              style={{ backgroundColor: STICKER_COLOR[color] }}
            >
              {isSelected && <Check size={14} strokeWidth={3} className="text-black/70" />}
            </span>
            <span className="text-slate-100">{COLOR_LABEL[color]}</span>
          </button>
        );
      })}
    </div>
  );
}
