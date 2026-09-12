/**
 * Mandatory round-trip and orientation tests (see the Phase 4 spec's own emphasis on
 * these): CubeState -> facelets -> simulated user input -> CubeState must be an exact
 * match, for the solved cube, a single scramble, and many random scrambles. This is
 * the test most likely to catch a face-order or row/col bug in the net mapping.
 */
import {
  FACES,
  applyMoves,
  createSolvedCube,
  faceletIndex,
  generateScramble,
  type FaceletCube,
} from "@cube-coach/cube-engine";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EDITABLE_INDICES, isCenterIndex } from "./cubeInput.js";
import { useCubeInput } from "./useCubeInput.js";

/** Simulates a user painting every visible sticker of `target` into the input, via the real hook. */
function paintCubeIntoInput(target: FaceletCube) {
  const { result } = renderHook(() => useCubeInput());
  for (const index of EDITABLE_INDICES) {
    const color = target[index]!;
    act(() => result.current.selectColor(color));
    act(() => result.current.paintSticker(index));
  }
  return result;
}

describe("round-trip: CubeState -> facelets -> input -> CubeState", () => {
  it("solved cube round-trips exactly", () => {
    const solved = createSolvedCube();
    const result = paintCubeIntoInput(solved);
    expect(result.current.complete).toBe(true);
    expect(result.current.facelets).toEqual(solved);
    act(() => result.current.validate());
    expect(result.current.validation).toEqual({ valid: true });
  });

  it("a single scramble (R U R' U') round-trips exactly", () => {
    const scrambled = applyMoves(createSolvedCube(), ["R", "U", "R'", "U'"]);
    const result = paintCubeIntoInput(scrambled);
    expect(result.current.facelets).toEqual(scrambled);
    act(() => result.current.validate());
    expect(result.current.validation).toEqual({ valid: true });
  });

  it("a longer engine-generated scramble round-trips exactly", () => {
    const scramble = generateScramble(25);
    const scrambled = applyMoves(createSolvedCube(), scramble);
    const result = paintCubeIntoInput(scrambled);
    expect(result.current.facelets).toEqual(scrambled);
    act(() => result.current.validate());
    expect(result.current.validation).toEqual({ valid: true });
  });

  it("50 random scrambles all round-trip exactly and validate", () => {
    for (let i = 0; i < 50; i++) {
      const scramble = generateScramble(20);
      const scrambled = applyMoves(createSolvedCube(), scramble);
      const result = paintCubeIntoInput(scrambled);
      expect(result.current.facelets, scramble.join(" ")).toEqual(scrambled);
      act(() => result.current.validate());
      expect(result.current.validation, scramble.join(" ")).toEqual({ valid: true });
    }
  });
});

describe("orientation: the net's face blocks agree with the engine face-by-face", () => {
  it("each face's 8 editable stickers round-trip to exactly that face's own indices, not a neighbor's", () => {
    // A scramble that disturbs every face differently, so each face carries distinguishable data.
    const scrambled = applyMoves(createSolvedCube(), generateScramble(20));
    const result = paintCubeIntoInput(scrambled);

    for (const face of FACES) {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const index = faceletIndex(face, row, col);
          if (isCenterIndex(index)) continue;
          expect(result.current.facelets[index], `${face}(${row},${col})`).toBe(scrambled[index]);
        }
      }
    }
  });
});
