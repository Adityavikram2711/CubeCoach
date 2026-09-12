import { applyMoves, createSolvedCube, generateScramble, isSolved } from "@cube-coach/cube-engine";
import { describe, expect, it } from "vitest";
import { faceletToCubie } from "../cube/conversions.js";
import { createSolvedCubieCube, isCubieSolved } from "../cube/cubie.js";
import { solvePhase1 } from "./phase1.js";
import { solvePhase2 } from "./phase2.js";

describe("solvePhase2", () => {
  it("the solved cube needs 0 moves", () => {
    const result = solvePhase2(createSolvedCubieCube());
    expect(result).not.toBeNull();
    expect(result!.moves).toEqual([]);
  });

  it("finishes a phase-1-solved simple scramble, verified via the real engine end to end", () => {
    const scramble = ["R", "U", "R'", "U'"];
    const scrambledFacelets = applyMoves(createSolvedCube(), scramble);
    const phase1 = solvePhase1(faceletToCubie(scrambledFacelets));
    expect(phase1).not.toBeNull();

    const phase2 = solvePhase2(phase1!.resultCubie);
    expect(phase2).not.toBeNull();

    const allMoves = [...phase1!.moves, ...phase2!.moves];
    const finalFacelets = applyMoves(scrambledFacelets, allMoves);
    expect(isSolved(finalFacelets)).toBe(true);
  });

  it("solves 20 random scrambles end to end (phase 1 + phase 2), each independently verified", () => {
    for (let i = 0; i < 20; i++) {
      const scramble = generateScramble(20);
      const scrambledFacelets = applyMoves(createSolvedCube(), scramble);
      const phase1 = solvePhase1(faceletToCubie(scrambledFacelets));
      expect(phase1, scramble.join(" ")).not.toBeNull();

      const phase2 = solvePhase2(phase1!.resultCubie);
      expect(phase2, scramble.join(" ")).not.toBeNull();
      expect(isCubieSolved(phase2!.resultCubie), scramble.join(" ")).toBe(true);

      const allMoves = [...phase1!.moves, ...phase2!.moves];
      const finalFacelets = applyMoves(scrambledFacelets, allMoves);
      expect(isSolved(finalFacelets), `${scramble.join(" ")} -> ${allMoves.join(" ")}`).toBe(true);
    }
  });

  it("phase-2 solutions are never longer than the standard bound (18 moves for this subgroup)", () => {
    for (let i = 0; i < 10; i++) {
      const scramble = generateScramble(25);
      const phase1 = solvePhase1(faceletToCubie(applyMoves(createSolvedCube(), scramble)));
      const phase2 = solvePhase2(phase1!.resultCubie);
      expect(phase2, scramble.join(" ")).not.toBeNull();
      expect(phase2!.moves.length, scramble.join(" ")).toBeLessThanOrEqual(18);
    }
  });
});
