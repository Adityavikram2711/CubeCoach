import { describe, expect, it } from "vitest";
import { applyMoves } from "../moves/apply.js";
import { cubieToFacelet, faceletToCubie } from "./conversions.js";
import { createSolvedCubieCube, isCubieSolved } from "./cubie.js";
import { createSolvedCube } from "./facelet.js";

// No net x/y/z rotation in these: cubieToFacelet always reconstructs into the
// canonical (fixed-center) orientation, so an exact round-trip is only guaranteed
// when the input was already in that orientation. Rotation-aware behavior is covered
// separately below.
const SCRAMBLES = [
  ["R", "U", "R'", "U'"],
  ["R", "U2", "R'", "D", "R", "U'", "R'"],
  ["F", "R", "U'", "R'", "U'", "R", "U", "R'", "F'"],
  ["M2", "U", "M2", "U2", "M2", "U", "M2"],
  ["Rw", "U", "Rw'", "F", "Dw", "B2", "Lw'"],
  ["x", "R", "U", "R'", "x'"],
  ["y", "R", "U", "R'", "U'", "y'"],
];

describe("facelet <-> cubie conversion", () => {
  it("solved facelet cube converts to the solved cubie cube", () => {
    expect(faceletToCubie(createSolvedCube())).toEqual(createSolvedCubieCube());
  });

  it("solved cubie cube converts to the solved facelet cube", () => {
    expect(cubieToFacelet(createSolvedCubieCube())).toEqual(createSolvedCube());
  });

  it.each(SCRAMBLES)("round-trips through cubie form for scramble %s", (...moves) => {
    const facelets = applyMoves(createSolvedCube(), moves);
    const cubie = faceletToCubie(facelets);
    const roundTripped = cubieToFacelet(cubie);
    expect(roundTripped).toEqual(facelets);
  });

  it("faceletToCubie(cubieToFacelet(x)) is the identity on scrambled cubie states", () => {
    for (const moves of SCRAMBLES) {
      const facelets = applyMoves(createSolvedCube(), moves);
      const cubie = faceletToCubie(facelets);
      const roundTripped = faceletToCubie(cubieToFacelet(cubie));
      expect(roundTripped).toEqual(cubie);
    }
  });

  it("agrees with isSolved for a scrambled-then-restored cube", () => {
    const scramble = ["R", "U", "R'", "U'"];
    const inverse = ["U", "R", "U'", "R'"];
    const cube = applyMoves(applyMoves(createSolvedCube(), scramble), inverse);
    expect(isCubieSolved(faceletToCubie(cube))).toBe(true);
  });

  describe("whole-cube rotations (x/y/z)", () => {
    it("a solved cube stays cubie-solved after any single whole-cube rotation", () => {
      for (const rotation of ["x", "x'", "x2", "y", "y'", "y2", "z", "z'", "z2"]) {
        const cube = applyMoves(createSolvedCube(), [rotation]);
        expect(isCubieSolved(faceletToCubie(cube)), rotation).toBe(true);
      }
    });

    it("a solved-but-reoriented cube normalizes back to the canonical solved facelets", () => {
      const cube = applyMoves(createSolvedCube(), ["x", "y", "z'"]);
      const cubie = faceletToCubie(cube);
      expect(isCubieSolved(cubie)).toBe(true);
      expect(cubieToFacelet(cubie)).toEqual(createSolvedCube());
    });

    it("the y-conjugate of the sexy move (y R U R' U' y') is itself order 6, like the original", () => {
      // A conjugate g h g^-1 always has the same order as h -- a second, independent
      // group-theory check that rotation-aware conversion isn't silently corrupting state.
      const conjugate = ["y", "R", "U", "R'", "U'", "y'"];
      let cube = createSolvedCube();
      for (let i = 0; i < 5; i++) {
        cube = applyMoves(cube, conjugate);
        expect(isCubieSolved(faceletToCubie(cube)), `after ${i + 1} reps`).toBe(false);
      }
      cube = applyMoves(cube, conjugate);
      expect(isCubieSolved(faceletToCubie(cube)), "after 6 reps").toBe(true);
    });
  });
});
