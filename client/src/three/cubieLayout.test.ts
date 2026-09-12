import { describe, expect, it } from "vitest";
import { ALL_CUBIE_POSITIONS, hasStickerAt } from "./cubieLayout.js";

describe("ALL_CUBIE_POSITIONS", () => {
  it("has exactly 26 unique positions (27 minus the empty core)", () => {
    expect(ALL_CUBIE_POSITIONS).toHaveLength(26);
    const keys = new Set(ALL_CUBIE_POSITIONS.map((p) => p.join(",")));
    expect(keys.size).toBe(26);
  });

  it("never includes the true center (0,0,0)", () => {
    expect(ALL_CUBIE_POSITIONS.some((p) => p[0] === 0 && p[1] === 0 && p[2] === 0)).toBe(false);
  });

  it("every coordinate is within {-1,0,1}", () => {
    for (const [x, y, z] of ALL_CUBIE_POSITIONS) {
      for (const c of [x, y, z]) expect([-1, 0, 1]).toContain(c);
    }
  });

  it("includes 8 corners (all coords nonzero), 12 edges (exactly one zero), 6 centers (exactly two zero)", () => {
    const zerosCount = (p: readonly number[]) => p.filter((c) => c === 0).length;
    expect(ALL_CUBIE_POSITIONS.filter((p) => zerosCount(p) === 0)).toHaveLength(8);
    expect(ALL_CUBIE_POSITIONS.filter((p) => zerosCount(p) === 1)).toHaveLength(12);
    expect(ALL_CUBIE_POSITIONS.filter((p) => zerosCount(p) === 2)).toHaveLength(6);
  });
});

describe("hasStickerAt", () => {
  it("a corner has exactly 3 stickers", () => {
    const corner: [number, number, number] = [1, 1, 1];
    const normals: [number, number, number][] = [
      [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
    ];
    expect(normals.filter((n) => hasStickerAt(corner, n))).toHaveLength(3);
    expect(hasStickerAt(corner, [1, 0, 0])).toBe(true);
    expect(hasStickerAt(corner, [-1, 0, 0])).toBe(false);
  });

  it("an edge has exactly 2 stickers", () => {
    const edge: [number, number, number] = [0, 1, 1]; // UF
    const normals: [number, number, number][] = [
      [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
    ];
    expect(normals.filter((n) => hasStickerAt(edge, n))).toHaveLength(2);
    expect(hasStickerAt(edge, [0, 1, 0])).toBe(true);
    expect(hasStickerAt(edge, [0, 0, 1])).toBe(true);
    expect(hasStickerAt(edge, [1, 0, 0])).toBe(false);
  });

  it("a center has exactly 1 sticker", () => {
    const center: [number, number, number] = [0, 1, 0]; // U center
    expect(hasStickerAt(center, [0, 1, 0])).toBe(true);
    expect(hasStickerAt(center, [0, -1, 0])).toBe(false);
    expect(hasStickerAt(center, [1, 0, 0])).toBe(false);
  });
});
