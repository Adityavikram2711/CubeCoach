import { applyMoves, isSolved, parseAlgorithm } from "@cube-coach/cube-engine";
import { describe, expect, it } from "vitest";
import { cubieToFacelet } from "../cube/conversions.js";
import { generatePllCases } from "./generatePllCases.js";
import { conjugateByU, isSameAufOrbit, type PllPattern } from "./pllPermutations.js";

const ALL_21_CANONICAL_NAMES = [
  "Aa Perm", "Ab Perm", "E Perm", "F Perm", "Ga Perm", "Gb Perm", "Gc Perm", "Gd Perm",
  "H Perm", "Ja Perm", "Jb Perm", "Na Perm", "Nb Perm", "Ra Perm", "Rb Perm", "T Perm",
  "Ua Perm", "Ub Perm", "V Perm", "Y Perm", "Z Perm",
];

function patternOf(c: { caseCubie: { cp: number[]; ep: number[] } }): PllPattern {
  return { cp: c.caseCubie.cp.slice(0, 4), ep: c.caseCubie.ep.slice(0, 4) };
}

describe("generatePllCases", () => {
  const cases = generatePllCases();

  it("produces exactly 21 cases", () => {
    expect(cases).toHaveLength(21);
  });

  it("has unique IDs and unique case numbers", () => {
    expect(new Set(cases.map((c) => c.id)).size).toBe(21);
    expect(new Set(cases.map((c) => c.number)).size).toBe(21);
  });

  it("IDs follow the pll-NN convention and match number", () => {
    for (const c of cases) {
      expect(c.id).toBe(`pll-${String(c.number).padStart(2, "0")}`);
    }
  });

  it("no two cases are the same permutation up to AUF (each is a genuinely distinct case)", () => {
    for (let i = 0; i < cases.length; i++) {
      for (let j = i + 1; j < cases.length; j++) {
        const a = { cp: cases[i]!.caseCubie.cp.slice(0, 4), ep: cases[i]!.caseCubie.ep.slice(0, 4) };
        const b = { cp: cases[j]!.caseCubie.cp.slice(0, 4), ep: cases[j]!.caseCubie.ep.slice(0, 4) };
        expect(isSameAufOrbit(a, b), `${cases[i]!.id} vs ${cases[j]!.id}`).toBe(false);
      }
    }
  });

  it("every algorithm parses via the shared engine's parser", () => {
    for (const c of cases) {
      expect(() => parseAlgorithm(c.algorithm), c.id).not.toThrow();
    }
  });

  it("EVERY case's algorithm is independently verified: solves that exact permutation completely", () => {
    // Unlike OLL, a correct PLL algorithm DOES fully solve the cube (permutation is the
    // whole point), so isSolved() is the right check here.
    for (const c of cases) {
      const startFacelets = cubieToFacelet(c.caseCubie);
      const resultFacelets = applyMoves(startFacelets, parseAlgorithm(c.algorithm));
      expect(isSolved(resultFacelets), `${c.id} (${c.name}): ${c.algorithm}`).toBe(true);
    }
  });

  it("every case has the required non-empty metadata fields and no invented URLs", () => {
    for (const c of cases) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.recognition.length).toBeGreaterThan(0);
      expect(c.difficulty).toMatch(/^(Beginner|Intermediate|Advanced)$/);
      expect(c.alternatives).toEqual([]);
      expect(c.videoUrl).toBeUndefined();
    }
  });

  it("includes all 21 canonical named cases (Aa, Ab, E, F, Ga, Gb, Gc, Gd, H, Ja, Jb, Na, Nb, Ra, Rb, T, Ua, Ub, V, Y, Z), each exactly once", () => {
    const names = cases.map((c) => c.name);
    for (const expected of ALL_21_CANONICAL_NAMES) {
      expect(names.filter((n) => n === expected), `expected exactly one "${expected}"`).toHaveLength(1);
    }
    expect(names).toHaveLength(ALL_21_CANONICAL_NAMES.length);
  });

  describe("regression: E-perm and T-perm specifically (previously duplicated other cases)", () => {
    // These reference values are independently transcribed from jperm.net's published
    // E-perm/T-perm/H-perm algorithms, executed through this engine and verified by hand
    // (see the module comment in generatePllCases.ts) -- NOT re-derived from
    // NAMED_PATTERNS, so a future regression there can't silently pass this test too.
    const E_PATTERN: PllPattern = { cp: [3, 2, 1, 0], ep: [0, 1, 2, 3] };
    const H_PATTERN: PllPattern = { cp: [0, 1, 2, 3], ep: [2, 3, 0, 1] };
    const T_PATTERN: PllPattern = { cp: [3, 1, 2, 0], ep: [0, 3, 2, 1] };

    it('"E Perm" matches the real, independently-verified E-perm identity', () => {
      const eCase = cases.find((c) => c.name === "E Perm")!;
      expect(eCase, "E Perm must exist").toBeDefined();
      expect(isSameAufOrbit(patternOf(eCase), E_PATTERN)).toBe(true);
    });

    it('"E Perm" is NOT the same case as "H Perm" (the bug this project actually shipped)', () => {
      const eCase = cases.find((c) => c.name === "E Perm")!;
      const hCase = cases.find((c) => c.name === "H Perm")!;
      expect(eCase.id).not.toBe(hCase.id);
      expect(isSameAufOrbit(patternOf(eCase), patternOf(hCase))).toBe(false);
      // Also directly against the independent reference values, not just each other.
      expect(isSameAufOrbit(E_PATTERN, H_PATTERN)).toBe(false);
    });

    it('"T Perm" matches the real, independently-verified T-perm identity', () => {
      const tCase = cases.find((c) => c.name === "T Perm")!;
      expect(tCase, "T Perm must exist").toBeDefined();
      expect(isSameAufOrbit(patternOf(tCase), T_PATTERN)).toBe(true);
    });
  });

  it("regression: AUF normalization recognizes a U-rotated pattern as the same case, not a new one", () => {
    // A pattern rotated by a real U turn must still be detected as the same case when
    // checked against the dataset -- this is the actual mechanism that prevents shipping
    // near-duplicate cases that only differ by which way you're holding the cube.
    const original = patternOf(cases[0]!);
    const rotatedOnce = conjugateByU(original.cp, original.ep);
    expect(isSameAufOrbit(original, rotatedOnce)).toBe(true);

    const matches = cases.filter((c) => isSameAufOrbit(patternOf(c), rotatedOnce));
    expect(matches.map((c) => c.id)).toEqual([cases[0]!.id]);
  });

  it("regression: no case's algorithm-to-state mapping is accidentally swapped with another case", () => {
    // Solving case A's scrambled state with case B's algorithm must NOT produce a solved
    // cube for any A != B -- guards against a future copy/paste mismatch between a
    // pattern and the algorithm found for a DIFFERENT pattern.
    for (let i = 0; i < cases.length; i++) {
      for (let j = 0; j < cases.length; j++) {
        if (i === j) continue;
        const startFacelets = cubieToFacelet(cases[i]!.caseCubie);
        const resultFacelets = applyMoves(startFacelets, parseAlgorithm(cases[j]!.algorithm));
        expect(isSolved(resultFacelets), `${cases[j]!.id}'s algorithm should not solve ${cases[i]!.id}'s state`).toBe(false);
      }
    }
  });
});
