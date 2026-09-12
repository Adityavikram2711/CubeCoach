import { validateCube, type Color, type ValidationResult } from "@cube-coach/cube-engine";
import { useMemo, useRef, useState } from "react";
import {
  EDITABLE_INDICES,
  type EditableFacelets,
  colorCounts,
  countFilled,
  emptyEditableFacelets,
  isCenterIndex,
  isComplete,
  solvedEditableFacelets,
  toFaceletCube,
} from "./cubeInput.js";

export interface CubeInputState {
  facelets: EditableFacelets;
  selectedColor: Color;
  selectColor: (color: Color) => void;
  paintSticker: (index: number) => void;
  undo: () => void;
  canUndo: boolean;
  reset: () => void;
  clear: () => void;
  filledCount: number;
  totalEditable: number;
  complete: boolean;
  colorCounts: Record<Color, number>;
  /** null = not yet validated (or stale after an edit), otherwise the last validateCube() result. */
  validation: ValidationResult | null;
  validate: () => void;
}

/**
 * Owns the interactive cube-input form state. This is UI form state, not a second cube
 * engine: painting a sticker just writes into a 54-slot array using the exact same
 * indexing the shared engine uses, and the only place cube *rules* are ever checked is
 * a direct call to the shared engine's validateCube() -- nothing here re-derives or
 * approximates what makes a cube valid.
 */
export function useCubeInput(): CubeInputState {
  const [facelets, setFacelets] = useState<EditableFacelets>(() => solvedEditableFacelets());
  const [selectedColor, setSelectedColor] = useState<Color>("white");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const historyRef = useRef<EditableFacelets[]>([]);

  const applyChange = (next: EditableFacelets) => {
    historyRef.current.push(facelets);
    setFacelets(next);
    setValidation(null); // any edit invalidates the last validation result
  };

  const paintSticker = (index: number) => {
    if (isCenterIndex(index)) return; // centers establish orientation; never user-editable
    if (facelets[index] === selectedColor) return;
    const next = facelets.slice();
    next[index] = selectedColor;
    applyChange(next);
  };

  const undo = () => {
    const previous = historyRef.current.pop();
    if (previous) {
      setFacelets(previous);
      setValidation(null);
    }
  };

  const reset = () => applyChange(solvedEditableFacelets());
  const clear = () => applyChange(emptyEditableFacelets());

  const filledCount = useMemo(() => countFilled(facelets), [facelets]);
  const complete = useMemo(() => isComplete(facelets), [facelets]);
  const counts = useMemo(() => colorCounts(facelets), [facelets]);

  const validate = () => {
    if (!complete) {
      setValidation({
        valid: false,
        issues: [
          {
            code: "INCOMPLETE",
            message: `${filledCount} / ${EDITABLE_INDICES.length} stickers entered. Complete the remaining stickers.`,
          },
        ],
      });
      return;
    }
    setValidation(validateCube(toFaceletCube(facelets)));
  };

  return {
    facelets,
    selectedColor,
    selectColor: setSelectedColor,
    paintSticker,
    undo,
    canUndo: historyRef.current.length > 0,
    reset,
    clear,
    filledCount,
    totalEditable: EDITABLE_INDICES.length,
    complete,
    colorCounts: counts,
    validation,
    validate,
  };
}
