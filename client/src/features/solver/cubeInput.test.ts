import { COLORS, FACES, createSolvedCube, faceletIndex } from "@cube-coach/cube-engine";
import { describe, expect, it } from "vitest";
import {
  ALL_FACELET_POSITIONS,
  CENTER_INDICES,
  EDITABLE_INDICES,
  centerColorFor,
  colorCounts,
  countFilled,
  emptyEditableFacelets,
  isCenterIndex,
  isComplete,
  solvedEditableFacelets,
  toFaceletCube,
} from "./cubeInput.js";

describe("center/editable index derivation", () => {
  it("has exactly 6 center indices and 48 editable indices, derived not hard-coded", () => {
    expect(CENTER_INDICES).toHaveLength(6);
    expect(EDITABLE_INDICES).toHaveLength(48);
    expect(new Set([...CENTER_INDICES, ...EDITABLE_INDICES]).size).toBe(54);
  });

  it("every center index is exactly the (1,1) position of its face", () => {
    for (const face of FACES) {
      expect(CENTER_INDICES).toContain(faceletIndex(face, 1, 1));
    }
  });

  it("isCenterIndex agrees with CENTER_INDICES", () => {
    for (let i = 0; i < 54; i++) {
      expect(isCenterIndex(i)).toBe(CENTER_INDICES.includes(i));
    }
  });

  it("centerColorFor returns the engine's fixed color scheme", () => {
    expect(centerColorFor(faceletIndex("U", 1, 1))).toBe("white");
    expect(centerColorFor(faceletIndex("F", 1, 1))).toBe("green");
    expect(centerColorFor(faceletIndex("R", 1, 1))).toBe("red");
    expect(centerColorFor(faceletIndex("U", 0, 0))).toBeUndefined(); // not a center
  });
});

describe("solvedEditableFacelets / emptyEditableFacelets", () => {
  it("solved matches the engine's own createSolvedCube exactly", () => {
    expect(solvedEditableFacelets()).toEqual(createSolvedCube());
  });

  it("solved is already complete", () => {
    expect(isComplete(solvedEditableFacelets())).toBe(true);
    expect(countFilled(solvedEditableFacelets())).toBe(48);
  });

  it("empty keeps centers filled but clears every editable sticker", () => {
    const empty = emptyEditableFacelets();
    expect(countFilled(empty)).toBe(0);
    expect(isComplete(empty)).toBe(false);
    for (const i of CENTER_INDICES) expect(empty[i]).not.toBeNull();
    for (const i of EDITABLE_INDICES) expect(empty[i]).toBeNull();
  });
});

describe("countFilled / isComplete", () => {
  it("counts partial fills correctly", () => {
    const facelets = emptyEditableFacelets();
    facelets[EDITABLE_INDICES[0]!] = "red";
    facelets[EDITABLE_INDICES[1]!] = "blue";
    expect(countFilled(facelets)).toBe(2);
    expect(isComplete(facelets)).toBe(false);
  });
});

describe("toFaceletCube", () => {
  it("produces a cube identical to the source once complete", () => {
    const solved = solvedEditableFacelets();
    expect(toFaceletCube(solved)).toEqual(createSolvedCube());
  });
});

describe("colorCounts", () => {
  it("solved cube has exactly 9 of each color", () => {
    const counts = colorCounts(solvedEditableFacelets());
    for (const color of COLORS) expect(counts[color]).toBe(9);
  });

  it("ignores unfilled slots", () => {
    const counts = colorCounts(emptyEditableFacelets());
    // 6 centers still contribute 1 each, to their own color
    const total = COLORS.reduce((sum, c) => sum + counts[c], 0);
    expect(total).toBe(6);
  });
});

describe("ALL_FACELET_POSITIONS", () => {
  it("has 54 entries, each with the correct engine-derived index", () => {
    expect(ALL_FACELET_POSITIONS).toHaveLength(54);
    for (const { face, row, col, index } of ALL_FACELET_POSITIONS) {
      expect(index).toBe(faceletIndex(face, row, col));
    }
  });

  it("indices are unique and cover 0-53", () => {
    const indices = ALL_FACELET_POSITIONS.map((p) => p.index).sort((a, b) => a - b);
    expect(indices).toEqual(Array.from({ length: 54 }, (_, i) => i));
  });
});
