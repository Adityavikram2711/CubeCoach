import { applyMoves, createSolvedCube, generateScramble } from "@cube-coach/cube-engine";
import { describe, expect, it } from "vitest";
import { faceletToCubie } from "../cube/conversions.js";
import { createSolvedCubieCube } from "../cube/cubie.js";
import { applyMoveToCubie, applyMoveToCubieSlow, PHASE1_MOVES, PHASE2_MOVES } from "./cubieMoves.js";

// The fast path only supports the 6 outer-face moves the solver actually needs (see
// cubieMoves.ts for why x/y/z can't use the same trick); that's exactly what's tested here.
const ALL_MOVE_TOKENS = ["U", "D", "L", "R", "F", "B"].flatMap((base) => [base, `${base}2`, `${base}'`]);

describe("applyMoveToCubie (fast) agrees with applyMoveToCubieSlow (proven facelet round-trip)", () => {
  it("on the solved cube, for every move token", () => {
    const solved = createSolvedCubieCube();
    for (const move of ALL_MOVE_TOKENS) {
      expect(applyMoveToCubie(solved, move), move).toEqual(applyMoveToCubieSlow(solved, move));
    }
  });

  it("on 30 random scrambled states, for every move token", () => {
    for (let i = 0; i < 30; i++) {
      const scramble = generateScramble(15);
      const cubie = faceletToCubie(applyMoves(createSolvedCube(), scramble));
      for (const move of ALL_MOVE_TOKENS) {
        expect(applyMoveToCubie(cubie, move), `${scramble.join(" ")} + ${move}`).toEqual(
          applyMoveToCubieSlow(cubie, move),
        );
      }
    }
  });

  it("chained across a long random sequence, state matches at every step", () => {
    let fast = createSolvedCubieCube();
    let slow = createSolvedCubieCube();
    const scramble = generateScramble(40);
    for (const move of scramble) {
      fast = applyMoveToCubie(fast, move);
      slow = applyMoveToCubieSlow(slow, move);
      expect(fast, scramble.join(" ")).toEqual(slow);
    }
  });
});

describe("applyMoveToCubie throughput", () => {
  it("is fast enough for move-table generation (>100k calls/sec)", () => {
    const cubie = createSolvedCubieCube();
    const n = 50_000;
    const start = performance.now();
    for (let i = 0; i < n; i++) applyMoveToCubie(cubie, "R");
    const elapsedMs = performance.now() - start;
    const callsPerSecond = n / (elapsedMs / 1000);
    expect(callsPerSecond).toBeGreaterThan(100_000);
  });
});

describe("unsupported moves", () => {
  it("throws a descriptive error rather than silently producing a wrong result", () => {
    const solved = createSolvedCubieCube();
    for (const move of ["x", "y", "z", "M", "E", "S", "Rw", "Q"]) {
      expect(() => applyMoveToCubie(solved, move), move).toThrow(/only supports the 6 outer-face moves|not a recognized/);
    }
  });
});

describe("PHASE1_MOVES / PHASE2_MOVES", () => {
  it("phase 2 moves never move a slice edge out of slots 8-11", () => {
    const solved = createSolvedCubieCube();
    for (const move of PHASE2_MOVES) {
      const moved = applyMoveToCubie(solved, move);
      for (let slot = 8; slot < 12; slot++) {
        expect(moved.ep[slot]! >= 8, `${move} slot ${slot}`).toBe(true);
      }
      expect(moved.co.every((o) => o === 0), move).toBe(true);
      expect(moved.eo.every((o) => o === 0), move).toBe(true);
    }
  });

  it("phase 1 includes all 18 standard quarter/half turns", () => {
    expect(PHASE1_MOVES).toHaveLength(18);
  });
});
