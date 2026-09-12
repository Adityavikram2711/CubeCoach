import { applyMoves, faceletToCubie, parseAlgorithm } from "@cube-coach/cube-engine";
import { describe, expect, it } from "vitest";
import { cubieToFacelet } from "../cube/conversions.js";
import { enumerateOllPatterns, generateOllCases } from "./generateOllCases.js";
import { isOllGoal } from "./ollSearch.js";

describe("enumerateOllPatterns", () => {
  it("produces exactly 57 patterns, all distinct, none the solved pattern", () => {
    const patterns = enumerateOllPatterns();
    expect(patterns).toHaveLength(57);
    const keys = new Set(patterns.map((p) => `${p.co.join(",")}|${p.eo.join(",")}`));
    expect(keys.size).toBe(57);
    for (const p of patterns) {
      expect(p.co.some((c) => c !== 0) || p.eo.some((e) => e !== 0)).toBe(true);
    }
  });

  it("every pattern has valid orientation sums (physically possible)", () => {
    for (const { co, eo } of enumerateOllPatterns()) {
      expect(co.reduce((a, b) => a + b, 0) % 3).toBe(0);
      expect(eo.reduce((a, b) => a + b, 0) % 2).toBe(0);
    }
  });
});

describe("generateOllCases", () => {
  const cases = generateOllCases();

  it("produces exactly 57 cases", () => {
    expect(cases).toHaveLength(57);
  });

  it("has unique IDs and unique case numbers", () => {
    expect(new Set(cases.map((c) => c.id)).size).toBe(57);
    expect(new Set(cases.map((c) => c.number)).size).toBe(57);
  });

  it("IDs follow the oll-NN convention and match number", () => {
    for (const c of cases) {
      expect(c.id).toBe(`oll-${String(c.number).padStart(2, "0")}`);
    }
  });

  it("every algorithm parses via the shared engine's parser", () => {
    for (const c of cases) {
      expect(() => parseAlgorithm(c.algorithm), c.id).not.toThrow();
    }
  });

  it("EVERY case's algorithm is independently verified: orients the last layer AND preserves F2L", () => {
    // Deliberately NOT isSolved() -- a correct OLL algorithm (e.g. the real Sune) is
    // allowed to permute the last layer (PLL fixes that afterward); the actual
    // requirement is F2L untouched + every last-layer piece oriented, which is exactly
    // what isOllGoal checks at the cubie level, independent of the search that found it.
    for (const c of cases) {
      const startFacelets = cubieToFacelet(c.caseCubie);
      const resultFacelets = applyMoves(startFacelets, parseAlgorithm(c.algorithm));
      const resultCubie = faceletToCubie(resultFacelets);
      expect(isOllGoal(resultCubie), `${c.id}: ${c.algorithm}`).toBe(true);
    }
  }, 180_000);

  it("every case has the required non-empty metadata fields", () => {
    for (const c of cases) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.category.length).toBeGreaterThan(0);
      expect(c.recognition.length).toBeGreaterThan(0);
      expect(c.difficulty).toMatch(/^(Beginner|Intermediate|Advanced)$/);
      expect(c.alternatives).toEqual([]); // no unverified alternatives inserted
      expect(c.videoUrl).toBeUndefined(); // no invented URLs
    }
  });

  it("categories are one of the structurally-derived set", () => {
    const categories = new Set(cases.map((c) => c.category));
    for (const cat of categories) {
      expect(["Dot", "Line", "L-Shape", "Corners Only"]).toContain(cat);
    }
  });
});
