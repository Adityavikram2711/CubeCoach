import { describe, expect, it } from "vitest";
import { isSolved, createSolvedCube } from "../cube/facelet.js";
import { applyMoves } from "../moves/apply.js";
import { AlgorithmParseError, applyAlgorithm, parseAlgorithm } from "./parser.js";
import { simplifyMoves } from "./simplify.js";

describe("parseAlgorithm", () => {
  it("parses simple space-separated moves", () => {
    expect(parseAlgorithm("R U R' U'")).toEqual(["R", "U", "R'", "U'"]);
  });

  it("parses double moves and wide moves", () => {
    expect(parseAlgorithm("R2 Uw Rw' F2")).toEqual(["R2", "Uw", "Rw'", "F2"]);
  });

  it("parses slice moves and rotations", () => {
    expect(parseAlgorithm("M E' S2 x y' z2")).toEqual(["M", "E'", "S2", "x", "y'", "z2"]);
  });

  it("expands a parenthesized group with a repeat count", () => {
    expect(parseAlgorithm("(R U R' U')2")).toEqual(["R", "U", "R'", "U'", "R", "U", "R'", "U'"]);
  });

  it("expands nested groups", () => {
    expect(parseAlgorithm("(R (U U')2)2")).toEqual(["R", "U", "U'", "U", "U'", "R", "U", "U'", "U", "U'"]);
  });

  it("throws a descriptive error for an unrecognized move", () => {
    expect(() => parseAlgorithm("R U Q U'")).toThrow(AlgorithmParseError);
    let caught: unknown;
    try {
      parseAlgorithm("R U Q U'");
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(AlgorithmParseError);
    expect((caught as AlgorithmParseError).message).toMatch(/Invalid algorithm/);
    expect((caught as AlgorithmParseError).message).toMatch(/position/);
  });

  it("throws a descriptive error for an unclosed group", () => {
    expect(() => parseAlgorithm("(R U R' U'")).toThrow(/closing/);
  });

  it("throws a descriptive error for an unmatched closing paren", () => {
    expect(() => parseAlgorithm("R U)")).toThrow(/Unexpected "\)"/);
  });

  it("applyAlgorithm parses and applies in one step, matching applyMoves", () => {
    const viaString = applyAlgorithm(createSolvedCube(), "(R U R' U')2");
    const viaMoves = applyMoves(createSolvedCube(), parseAlgorithm("(R U R' U')2"));
    expect(viaString).toEqual(viaMoves);
    expect(isSolved(viaString)).toBe(false);
  });
});

describe("simplifyMoves", () => {
  it("cancels a move with its inverse", () => {
    expect(simplifyMoves(["R", "U", "R'"])).toEqual(["R", "U", "R'"]);
    expect(simplifyMoves(["R", "R'"])).toEqual([]);
  });

  it("combines repeated moves into a double move", () => {
    expect(simplifyMoves(["R", "R"])).toEqual(["R2"]);
  });

  it("combines two double moves into nothing", () => {
    expect(simplifyMoves(["R2", "R2"])).toEqual([]);
  });

  it("combines three of the same move into the inverse", () => {
    expect(simplifyMoves(["R", "R", "R"])).toEqual(["R'"]);
  });

  it("does not combine moves on different faces", () => {
    expect(simplifyMoves(["R", "U", "R"])).toEqual(["R", "U", "R"]);
  });

  it("produces a move-equivalent algorithm (same resulting cube state)", () => {
    const original = ["R", "R", "U", "U'", "F", "F", "F"];
    const simplified = simplifyMoves(original);
    const cubeA = applyMoves(createSolvedCube(), original);
    const cubeB = applyMoves(createSolvedCube(), simplified);
    expect(cubeB).toEqual(cubeA);
  });
});
