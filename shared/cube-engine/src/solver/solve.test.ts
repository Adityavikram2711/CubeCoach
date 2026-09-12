import {
  applyMoves,
  createSolvedCube,
  generateScramble,
  invertAlgorithm,
  isSolved,
  type FaceletCube,
} from "@cube-coach/cube-engine";
import { describe, expect, it } from "vitest";
import { solve } from "./solve.js";

function scrambleFrom(moves: string[]): FaceletCube {
  return applyMoves(createSolvedCube(), moves);
}

function expectVerifiedSolve(cube: FaceletCube, label: string) {
  const result = solve(cube);
  expect(result.success, label).toBe(true);
  if (!result.success) return;
  expect(result.verified, label).toBe(true);
  expect(result.moveCount, label).toBe(result.moves.length);
  const replayed = applyMoves(cube, result.moves);
  expect(isSolved(replayed), `${label}: ${result.moves.join(" ")}`).toBe(true);
  return result;
}

describe("solve: solved cube", () => {
  it("returns zero moves and verified for an already-solved cube", () => {
    const result = solve(createSolvedCube());
    expect(result).toEqual({ success: true, moves: [], moveCount: 0, verified: true, searchTimeMs: expect.any(Number) });
  });
});

describe("solve: invalid cube", () => {
  it("rejects a cube with a broken color count and never attempts to search", () => {
    const cube = createSolvedCube();
    cube[0] = "yellow"; // breaks the 9-of-each invariant
    const result = solve(cube);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("INVALID_CUBE");
      expect(result.error.message).toMatch(/impossible/);
    }
  });
});

describe("solve: known states", () => {
  const knownScrambles = ["R", "R U", "R U R'", "R U R' U'", "U D", "R2 U2 R2", "F R U' R' U' R U R' F'"];

  it.each(knownScrambles)("solves and verifies: %s", (scramble) => {
    const cube = scrambleFrom(scramble.split(" "));
    expectVerifiedSolve(cube, scramble);
  });
});

describe("solve: inverse-algorithm cross-check", () => {
  it("the solver's own solution and the known inverse both independently solve the same scramble", () => {
    const scramble = generateScramble(20);
    const cube = scrambleFrom(scramble);

    const inverse = invertAlgorithm(scramble);
    expect(isSolved(applyMoves(cube, inverse))).toBe(true); // sanity: the reference solution is valid

    const result = expectVerifiedSolve(cube, scramble.join(" "));
    // Not required to be the same length or sequence as the inverse -- just also valid.
    expect(result).toBeDefined();
  });
});

describe("solve: random scramble verification", () => {
  it("10 random scrambles", () => {
    for (let i = 0; i < 10; i++) {
      const scramble = generateScramble(20);
      expectVerifiedSolve(scrambleFrom(scramble), scramble.join(" "));
    }
  });

  it("50 random scrambles", () => {
    for (let i = 0; i < 50; i++) {
      const scramble = generateScramble(20);
      expectVerifiedSolve(scrambleFrom(scramble), scramble.join(" "));
    }
  });

  it("100 random scrambles", () => {
    for (let i = 0; i < 100; i++) {
      const scramble = generateScramble(20);
      expectVerifiedSolve(scrambleFrom(scramble), scramble.join(" "));
    }
  });
});

describe("solve: scramble depth range", () => {
  it.each([1, 2, 3, 5, 10, 20, 30, 45])("solves a %i-move scramble", (length) => {
    const scramble = generateScramble(length);
    expectVerifiedSolve(scrambleFrom(scramble), scramble.join(" "));
  });
});

describe("solve: regression cases", () => {
  // A small, fixed collection of scrambles kept around to catch future regressions.
  // The only assertion that matters is that the final state is solved -- not the
  // specific moves returned, which the solver is free to change.
  const regressionScrambles = [
    "U2 F2 D2 B2 L2 R2 U2 D2",
    "R U2 R' D R U2 R' D'",
    "M2 U M2 U2 M2 U M2", // exercises a state reached via slice moves, not just outer turns
    "L R U D F B L' R' U' D' F' B'",
    "R' U' F U R U' R' F' R U R' U' R' F R F'",
  ];

  it.each(regressionScrambles)("regression: %s", (scramble) => {
    const cube = scrambleFrom(scramble.split(" ").filter(Boolean));
    expectVerifiedSolve(cube, scramble);
  });
});

describe("solve: property-based checks", () => {
  it("property: every scramble the engine generates produces a valid state the solver accepts", () => {
    for (let i = 0; i < 20; i++) {
      const scramble = generateScramble(20);
      const cube = scrambleFrom(scramble);
      const result = solve(cube);
      expect(result.success, scramble.join(" ")).toBe(true);
    }
  });

  it("property: the solver's result always actually solves its exact input (not a different cube)", () => {
    for (let i = 0; i < 20; i++) {
      const scramble = generateScramble(15);
      const cube = scrambleFrom(scramble);
      const cubeCopy = cube.slice();
      const result = solve(cube);
      expect(cube).toEqual(cubeCopy); // solve() must not mutate its input
      if (result.success) {
        expect(isSolved(applyMoves(cube, result.moves))).toBe(true);
      }
    }
  });
});
