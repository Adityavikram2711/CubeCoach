import { describe, expect, it } from "vitest";
import { createSolvedCube, isSolved } from "../cube/facelet.js";
import { applyMoves } from "../moves/apply.js";
import { invertAlgorithm } from "../moves/inverse.js";
import { isValidMove } from "../moves/types.js";
import { validateCube } from "../validation/validate.js";
import { generateScramble } from "./scramble.js";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("generateScramble", () => {
  it("defaults to a 20-move scramble of only valid moves", () => {
    const scramble = generateScramble(20, mulberry32(1));
    expect(scramble).toHaveLength(20);
    for (const move of scramble) expect(isValidMove(move)).toBe(true);
  });

  it("respects a custom length", () => {
    expect(generateScramble(15, mulberry32(2))).toHaveLength(15);
    expect(generateScramble(25, mulberry32(3))).toHaveLength(25);
  });

  it("never repeats the same face on consecutive moves", () => {
    for (let seed = 0; seed < 20; seed++) {
      const scramble = generateScramble(30, mulberry32(seed));
      for (let i = 1; i < scramble.length; i++) {
        expect(scramble[i]![0]).not.toBe(scramble[i - 1]![0]);
      }
    }
  });

  it("never does 3 consecutive moves on the same axis", () => {
    const axisOf: Record<string, string> = { U: "y", D: "y", L: "x", R: "x", F: "z", B: "z" };
    for (let seed = 0; seed < 20; seed++) {
      const scramble = generateScramble(30, mulberry32(seed));
      let run = 1;
      for (let i = 1; i < scramble.length; i++) {
        const prevAxis = axisOf[scramble[i - 1]![0]!];
        const curAxis = axisOf[scramble[i]![0]!];
        run = curAxis === prevAxis ? run + 1 : 1;
        expect(run, `run of ${run} at index ${i} in ${scramble.join(" ")}`).toBeLessThanOrEqual(2);
      }
    }
  });

  it("produces a reachable, valid cube state", () => {
    for (let seed = 0; seed < 10; seed++) {
      const scramble = generateScramble(20, mulberry32(seed));
      const cube = applyMoves(createSolvedCube(), scramble);
      expect(validateCube(cube)).toEqual({ valid: true });
    }
  });

  it("is not a no-op: a scramble followed by its inverse restores solved", () => {
    const scramble = generateScramble(20, mulberry32(42));
    const cube = applyMoves(createSolvedCube(), scramble);
    expect(isSolved(cube)).toBe(false);
    expect(isSolved(applyMoves(cube, invertAlgorithm(scramble)))).toBe(true);
  });

  it("different seeds produce different scrambles", () => {
    const a = generateScramble(20, mulberry32(1));
    const b = generateScramble(20, mulberry32(2));
    expect(a).not.toEqual(b);
  });
});
