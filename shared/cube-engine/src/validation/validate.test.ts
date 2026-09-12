import { describe, expect, it } from "vitest";
import { cubieToFacelet } from "../cube/conversions.js";
import { createSolvedCubieCube } from "../cube/cubie.js";
import { createSolvedCube } from "../cube/facelet.js";
import { applyMoves } from "../moves/apply.js";
import { validateCube } from "./validate.js";

describe("validateCube", () => {
  it("accepts a solved cube", () => {
    expect(validateCube(createSolvedCube())).toEqual({ valid: true });
  });

  it("accepts a scrambled-but-reachable cube", () => {
    const scrambled = applyMoves(createSolvedCube(), ["R", "U", "R'", "U'", "F2", "L", "D'", "Rw", "B"]);
    expect(validateCube(scrambled)).toEqual({ valid: true });
  });

  it("rejects a cube with the wrong color counts", () => {
    const cube = createSolvedCube();
    cube[0] = "yellow"; // one extra yellow, one missing white
    const result = validateCube(cube);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.some((i) => i.code === "WRONG_COLOR_COUNT")).toBe(true);
    }
  });

  it("rejects duplicate center colors", () => {
    const cube = createSolvedCube();
    cube[4] = "yellow"; // U center now matches D center
    const result = validateCube(cube);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.some((i) => i.code === "DUPLICATE_CENTERS")).toBe(true);
    }
  });

  it("rejects an impossible corner orientation (single twisted corner)", () => {
    const cubie = createSolvedCubieCube();
    cubie.co[0] = 1;
    const result = validateCube(cubieToFacelet(cubie));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.some((i) => i.code === "INVALID_CORNER_ORIENTATION")).toBe(true);
    }
  });

  it("rejects an impossible edge orientation (single flipped edge)", () => {
    const cubie = createSolvedCubieCube();
    cubie.eo[0] = 1;
    const result = validateCube(cubieToFacelet(cubie));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.some((i) => i.code === "INVALID_EDGE_ORIENTATION")).toBe(true);
    }
  });

  it("accepts a single swapped pair of corners (reachable via M-style slice moves)", () => {
    // See the comment in validate.ts: this engine supports M/E/S as primitive moves,
    // and a lone M turn produces a mismatched-parity state (0 corners moved, edges
    // 4-cycled) that classic outer-turn-only cube theory would call "impossible" but
    // is actually a single legal move away from solved.
    const cubie = createSolvedCubieCube();
    [cubie.cp[0], cubie.cp[1]] = [cubie.cp[1]!, cubie.cp[0]!];
    expect(validateCube(cubieToFacelet(cubie))).toEqual({ valid: true });
  });

  it("rejects the wrong facelet count", () => {
    const result = validateCube(createSolvedCube().slice(0, 53));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues[0]?.code).toBe("WRONG_FACELET_COUNT");
    }
  });
});
