import { describe, expect, it } from "vitest";
import { createSolvedCube, isSolved } from "../cube/facelet.js";
import { BASE_MOVE_NAMES } from "./definitions.js";
import { applyMove, applyMoves } from "./apply.js";
import { invertAlgorithm, invertMove } from "./inverse.js";

const ALL_BASE_MOVES = BASE_MOVE_NAMES;

describe("face turns", () => {
  it("every base move applied 4 times returns to solved", () => {
    for (const base of ALL_BASE_MOVES) {
      let cube = createSolvedCube();
      for (let i = 0; i < 4; i++) cube = applyMove(cube, base);
      expect(isSolved(cube), `${base} x4`).toBe(true);
    }
  });

  it("every base move followed by its inverse returns to solved", () => {
    for (const base of ALL_BASE_MOVES) {
      const cube = applyMoves(createSolvedCube(), [base, invertMove(base)]);
      expect(isSolved(cube), `${base} ${invertMove(base)}`).toBe(true);
    }
  });

  it("every base move2 applied twice returns to solved", () => {
    for (const base of ALL_BASE_MOVES) {
      const move2 = `${base}2`;
      const cube = applyMoves(createSolvedCube(), [move2, move2]);
      expect(isSolved(cube), `${move2} x2`).toBe(true);
    }
  });

  it("move2 equals move applied twice", () => {
    for (const base of ALL_BASE_MOVES) {
      const viaDouble = applyMoves(createSolvedCube(), [base, base]);
      const viaTwoToken = applyMove(createSolvedCube(), `${base}2`);
      expect(viaTwoToken, base).toEqual(viaDouble);
    }
  });

  it("prime is the inverse of the base move for all 18 standard face/slice/wide moves", () => {
    for (const base of ALL_BASE_MOVES) {
      const cube = applyMoves(createSolvedCube(), [base, `${base}'`]);
      expect(isSolved(cube), `${base} ${base}'`).toBe(true);
    }
  });

  it("a random scramble followed by its inverse algorithm returns to solved", () => {
    const scramble = ["R", "U", "R'", "F2", "L'", "D", "B", "M'", "x", "y2", "Rw", "E'"];
    const cube = applyMoves(createSolvedCube(), scramble);
    const restored = applyMoves(cube, invertAlgorithm(scramble));
    expect(isSolved(restored)).toBe(true);
  });
});

describe("known cube group-theory facts (independent of our own tables)", () => {
  it("the sexy move (R U R' U') has order 6", () => {
    const sexyMove = ["R", "U", "R'", "U'"];
    let cube = createSolvedCube();
    for (let i = 0; i < 5; i++) {
      cube = applyMoves(cube, sexyMove);
      expect(isSolved(cube), `after ${i + 1} reps`).toBe(false);
    }
    cube = applyMoves(cube, sexyMove);
    expect(isSolved(cube), "after 6 reps").toBe(true);
  });

  it("Sune (R U R' U R U2 R') has order 6", () => {
    const sune = ["R", "U", "R'", "U", "R", "U2", "R'"];
    let cube = createSolvedCube();
    for (let i = 0; i < 5; i++) {
      cube = applyMoves(cube, sune);
      expect(isSolved(cube), `after ${i + 1} reps`).toBe(false);
    }
    cube = applyMoves(cube, sune);
    expect(isSolved(cube), "after 6 reps").toBe(true);
  });

  it("a full cube rotation (x) does not change solved-ness and x4 = identity", () => {
    let cube = createSolvedCube();
    for (let i = 0; i < 4; i++) cube = applyMove(cube, "x");
    expect(isSolved(cube)).toBe(true);
  });
});

describe("invalid moves", () => {
  it("throws a descriptive error for an unknown move token", () => {
    expect(() => applyMove(createSolvedCube(), "Q")).toThrow(/Invalid move/);
  });
});
