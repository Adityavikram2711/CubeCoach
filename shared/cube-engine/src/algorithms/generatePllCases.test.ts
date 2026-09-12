import { applyMoves, isSolved, parseAlgorithm } from "@cube-coach/cube-engine";
import { describe, expect, it } from "vitest";
import { cubieToFacelet } from "../cube/conversions.js";
import { generatePllCases } from "./generatePllCases.js";
import { isSameAufOrbit } from "./pllPermutations.js";

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

  it("includes the well-known named cases (Aa, Ab, Ua, Ub, H, Z, T)", () => {
    const names = cases.map((c) => c.name);
    for (const expected of ["Aa Perm", "Ab Perm", "Ua Perm", "Ub Perm", "H Perm", "Z Perm", "T Perm"]) {
      expect(names).toContain(expected);
    }
  });
});
