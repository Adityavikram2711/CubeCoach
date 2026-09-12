import { BASE_MOVE_NAMES, applyMoves, createSolvedCube, generateScramble, isSolved } from "@cube-coach/cube-engine";
import { describe, expect, it } from "vitest";
import { explainMove, getCubeAtMove, isEditableTarget, notationLegend } from "./solutionUtils.js";

describe("getCubeAtMove", () => {
  it("moveIndex 0 returns the start cube unchanged", () => {
    const start = createSolvedCube();
    expect(getCubeAtMove(start, ["R", "U"], 0)).toEqual(start);
  });

  it("moveIndex N applies exactly the first N moves, matching applyMoves directly", () => {
    const start = applyMoves(createSolvedCube(), generateScramble(10));
    const moves = ["R", "U", "R'", "F", "R", "F'"];
    for (let n = 0; n <= moves.length; n++) {
      expect(getCubeAtMove(start, moves, n)).toEqual(applyMoves(start, moves.slice(0, n)));
    }
  });

  it("moveIndex === moves.length matches the fully-applied solution", () => {
    const start = createSolvedCube();
    const scramble = generateScramble(15);
    const scrambled = applyMoves(start, scramble);
    const solutionMoves = scramble
      .slice()
      .reverse()
      .map((m) => (m.endsWith("'") ? m.slice(0, -1) : m.endsWith("2") ? m : `${m}'`));
    // (not asserting this inverse actually solves -- just that getCubeAtMove at the
    // final index equals applying every move, which is the property under test)
    expect(getCubeAtMove(scrambled, solutionMoves, solutionMoves.length)).toEqual(
      applyMoves(scrambled, solutionMoves),
    );
  });

  it("does not mutate the start cube", () => {
    const start = createSolvedCube();
    const copy = start.slice();
    getCubeAtMove(start, ["R", "U", "F2"], 2);
    expect(start).toEqual(copy);
  });
});

describe("explainMove", () => {
  it("explains every one of the solver's 18 standard moves", () => {
    for (const base of ["U", "D", "L", "R", "F", "B"]) {
      expect(explainMove(base)).toMatch(/clockwise\.$/);
      expect(explainMove(`${base}'`)).toMatch(/counter-clockwise\.$/);
      expect(explainMove(`${base}2`)).toMatch(/180°\.$/);
    }
  });

  it("explains advanced moves distinctly (wide, slice, rotation)", () => {
    expect(explainMove("Rw")).toMatch(/right two layers/);
    expect(explainMove("M")).toMatch(/middle slice/);
    expect(explainMove("x")).toMatch(/entire cube/);
  });

  it("returns null for an unrecognized token rather than inventing an explanation", () => {
    expect(explainMove("Q")).toBeNull();
    expect(explainMove("")).toBeNull();
  });
});

describe("notationLegend", () => {
  it("produces 3 entries per base move (quarter, prime, double)", () => {
    const legend = notationLegend(["U", "R"]);
    expect(legend).toHaveLength(6);
    expect(legend.map((e) => e.move)).toEqual(["U", "U'", "U2", "R", "R'", "R2"]);
    for (const entry of legend) expect(entry.explanation).not.toBeNull();
  });

  it("covers all 18 base move names without throwing", () => {
    const legend = notationLegend(BASE_MOVE_NAMES);
    expect(legend).toHaveLength(BASE_MOVE_NAMES.length * 3);
  });
});

describe("isEditableTarget", () => {
  it("is true for input/textarea/select and contenteditable elements", () => {
    expect(isEditableTarget(document.createElement("input"))).toBe(true);
    expect(isEditableTarget(document.createElement("textarea"))).toBe(true);
    expect(isEditableTarget(document.createElement("select"))).toBe(true);
    const div = document.createElement("div");
    div.contentEditable = "true";
    expect(isEditableTarget(div)).toBe(true);
  });

  it("is false for a plain button or null", () => {
    expect(isEditableTarget(document.createElement("button"))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});

describe("sanity: isSolved is reachable from this module's imports (no broken import wiring)", () => {
  it("a getCubeAtMove result can be checked with isSolved", () => {
    const solved = getCubeAtMove(createSolvedCube(), [], 0);
    expect(isSolved(solved)).toBe(true);
  });
});
