import { applyMoves, createSolvedCube, generateScramble } from "@cube-coach/cube-engine";
import { describe, expect, it } from "vitest";
import { faceletToCubie } from "../cube/conversions.js";
import { createSolvedCubieCube } from "../cube/cubie.js";
import { encodeCornerOrientation, encodeEdgeOrientation, encodeUdSlice, UD_SLICE_STATES } from "./coordinates.js";
import { solvePhase1 } from "./phase1.js";

function isPhase1Solved(cubie: ReturnType<typeof createSolvedCubieCube>): boolean {
  return (
    encodeCornerOrientation(cubie.co) === 0 &&
    encodeEdgeOrientation(cubie.eo) === 0 &&
    encodeUdSlice(cubie.ep) === UD_SLICE_STATES - 1
  );
}

describe("solvePhase1", () => {
  it("the solved cube needs 0 moves", () => {
    const result = solvePhase1(createSolvedCubieCube());
    expect(result).not.toBeNull();
    expect(result!.moves).toEqual([]);
  });

  it("reaches the phase-1 subgroup for a simple scramble, verified via the real engine", () => {
    const scramble = ["R", "U", "R'", "U'"];
    const cubie = faceletToCubie(applyMoves(createSolvedCube(), scramble));
    const result = solvePhase1(cubie);
    expect(result).not.toBeNull();

    const finalFacelets = applyMoves(applyMoves(createSolvedCube(), scramble), result!.moves);
    const finalCubie = faceletToCubie(finalFacelets);
    expect(isPhase1Solved(finalCubie)).toBe(true);
    expect(finalCubie).toEqual(result!.resultCubie);
  });

  it("reaches the phase-1 subgroup for 20 random scrambles, each independently verified", () => {
    for (let i = 0; i < 20; i++) {
      const scramble = generateScramble(20);
      const cubie = faceletToCubie(applyMoves(createSolvedCube(), scramble));
      const result = solvePhase1(cubie);
      expect(result, scramble.join(" ")).not.toBeNull();

      const finalFacelets = applyMoves(applyMoves(createSolvedCube(), scramble), result!.moves);
      expect(isPhase1Solved(faceletToCubie(finalFacelets)), scramble.join(" ")).toBe(true);
    }
  });

  it("phase-1 solutions are never longer than the standard bound (12 moves for this subgroup)", () => {
    for (let i = 0; i < 10; i++) {
      const scramble = generateScramble(25);
      const cubie = faceletToCubie(applyMoves(createSolvedCube(), scramble));
      const result = solvePhase1(cubie);
      expect(result, scramble.join(" ")).not.toBeNull();
      expect(result!.moves.length, scramble.join(" ")).toBeLessThanOrEqual(12);
    }
  });
});
