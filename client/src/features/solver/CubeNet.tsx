/**
 * A 2D cube net for precise sticker entry: U above F, L-F-R-B in a row, D below F --
 * exactly the net the shared engine's own faceGrid.ts documents and derives its facelet
 * indexing from (see that file's header comment). Every button's data index comes
 * straight from ALL_FACELET_POSITIONS (itself built from the engine's faceletIndex), so
 * there is no independent per-face array here that could drift out of sync.
 */
import type { Face } from "@cube-coach/cube-engine";
import { Lock } from "lucide-react";
import { STICKER_COLOR } from "../../three/materials.js";
import { ALL_FACELET_POSITIONS, isCenterIndex, type EditableFacelets } from "./cubeInput.js";

/** Which 3x3 block (in units of 3 cells) each face occupies in the net. */
const FACE_BLOCK: Record<Face, { rowStart: number; colStart: number }> = {
  U: { rowStart: 0, colStart: 1 },
  L: { rowStart: 1, colStart: 0 },
  F: { rowStart: 1, colStart: 1 },
  R: { rowStart: 1, colStart: 2 },
  B: { rowStart: 1, colStart: 3 },
  D: { rowStart: 2, colStart: 1 },
};

interface CubeNetProps {
  facelets: EditableFacelets;
  onPaint: (index: number) => void;
}

export function CubeNet({ facelets, onPaint }: CubeNetProps) {
  return (
    <div
      className="grid aspect-[4/3] w-full max-w-xl gap-[3px]"
      style={{ gridTemplateColumns: "repeat(12, 1fr)", gridTemplateRows: "repeat(9, 1fr)" }}
    >
      {ALL_FACELET_POSITIONS.map(({ face, row, col, index }) => {
        const block = FACE_BLOCK[face];
        const gridRow = block.rowStart * 3 + row + 1;
        const gridColumn = block.colStart * 3 + col + 1;
        const color = facelets[index];
        const isCenter = isCenterIndex(index);

        return (
          <button
            key={index}
            type="button"
            disabled={isCenter}
            onClick={() => onPaint(index)}
            aria-label={
              isCenter
                ? `${face} center, fixed color, establishes orientation`
                : `${face} face sticker, row ${row + 1}, column ${col + 1}, currently ${color ?? "unfilled"}`
            }
            style={{
              gridRow,
              gridColumn,
              backgroundColor: color ? STICKER_COLOR[color] : "transparent",
            }}
            className={`flex items-center justify-center rounded-sm border transition-colors ${
              isCenter
                ? "cursor-default border-slate-600"
                : color
                  ? "border-black/30 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-400"
                  : "border-dashed border-slate-600 bg-slate-800/60 hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-400"
            }`}
          >
            {isCenter && <Lock size={14} className="text-black/50" />}
          </button>
        );
      })}
    </div>
  );
}
