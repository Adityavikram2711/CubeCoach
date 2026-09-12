import { applyMoves, parseAlgorithm } from "@cube-coach/cube-engine";
import { describe, expect, it } from "vitest";
import { cubieToFacelet } from "../cube/conversions.js";
import { enumerateF2lPlacements, generateF2lCases } from "./generateF2lCases.js";
import { isF2lGoal } from "./f2lSearch.js";
import { faceletToCubie } from "../cube/conversions.js";

describe("generateF2lCases", () => {
  it("enumerates exactly 24 raw placements (3 corner orientations x 4 edge slots x 2 edge orientations)", () => {
    expect(enumerateF2lPlacements()).toHaveLength(24);
  });

  const cases = generateF2lCases();

  it("produces exactly 24 cases", () => {
    expect(cases).toHaveLength(24);
  });

  it("has unique IDs and unique case numbers", () => {
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length);
    expect(new Set(cases.map((c) => c.number)).size).toBe(cases.length);
  });

  it("IDs follow the f2l-NN convention and match number", () => {
    for (const c of cases) {
      expect(c.id).toBe(`f2l-${String(c.number).padStart(2, "0")}`);
    }
  });

  it("every algorithm parses via the shared engine's parser", () => {
    for (const c of cases) {
      expect(() => parseAlgorithm(c.algorithm), c.id).not.toThrow();
    }
  });

  it("EVERY case's algorithm is independently verified: places the corner+edge pair correctly AND preserves the other 3 F2L slots", () => {
    for (const c of cases) {
      const startFacelets = cubieToFacelet(c.caseCubie);
      const resultFacelets = applyMoves(startFacelets, parseAlgorithm(c.algorithm));
      const resultCubie = faceletToCubie(resultFacelets);
      expect(isF2lGoal(resultCubie), `${c.id}: ${c.algorithm}`).toBe(true);
    }
  }, 30_000);

  it("every case has the required non-empty metadata fields and no invented URLs", () => {
    for (const c of cases) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.category.length).toBeGreaterThan(0);
      expect(c.recognition.length).toBeGreaterThan(0);
      expect(c.difficulty).toMatch(/^(Beginner|Intermediate|Advanced)$/);
      expect(c.alternatives).toEqual([]);
      expect(c.videoUrl).toBeUndefined();
    }
  });
});
