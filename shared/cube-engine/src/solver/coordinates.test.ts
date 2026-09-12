import { describe, expect, it } from "vitest";
import {
  CORNER_ORIENTATION_STATES,
  CORNER_PERMUTATION_STATES,
  EDGE_ORIENTATION_STATES,
  EDGE_PERMUTATION_8_STATES,
  UD_SLICE_PERMUTATION_STATES,
  UD_SLICE_STATES,
  combinationRank,
  combinationUnrank,
  decodeCornerOrientation,
  decodeCornerPermutation,
  decodeEdgeOrientation,
  decodeEdgePermutation8,
  decodeUdSlice,
  decodeUdSlicePermutation,
  encodeCornerOrientation,
  encodeCornerPermutation,
  encodeEdgeOrientation,
  encodeEdgePermutation8,
  encodeUdSlice,
  encodeUdSlicePermutation,
  factorial,
  nCr,
  permutationRank,
  permutationUnrank,
} from "./coordinates.js";

describe("combinatorics primitives", () => {
  it("factorial matches known values", () => {
    expect(factorial(0)).toBe(1);
    expect(factorial(1)).toBe(1);
    expect(factorial(4)).toBe(24);
    expect(factorial(8)).toBe(40320);
  });

  it("nCr matches known values, including edge cases", () => {
    expect(nCr(12, 4)).toBe(495);
    expect(nCr(5, 0)).toBe(1);
    expect(nCr(5, 5)).toBe(1);
    expect(nCr(5, 6)).toBe(0);
    expect(nCr(5, -1)).toBe(0);
  });

  it("permutationRank/Unrank round-trip for every permutation of a small set", () => {
    const elements = [0, 1, 2, 3, 4];
    const seen = new Set<string>();
    for (let rank = 0; rank < factorial(5); rank++) {
      const perm = permutationUnrank(rank, elements);
      seen.add(perm.join(","));
      expect(permutationRank(perm)).toBe(rank);
    }
    expect(seen.size).toBe(factorial(5)); // every rank produces a distinct permutation
  });

  it("combinationRank/Unrank round-trip for every 4-subset of a 12-set", () => {
    const seen = new Set<string>();
    for (let rank = 0; rank < nCr(12, 4); rank++) {
      const members = combinationUnrank(rank, 4);
      expect(members).toHaveLength(4);
      expect([...members].sort((a, b) => a - b)).toEqual(members); // already ascending
      seen.add(members.join(","));
      expect(combinationRank(members)).toBe(rank);
    }
    expect(seen.size).toBe(nCr(12, 4));
  });
});

describe("corner orientation coordinate (0..2186)", () => {
  it("round-trips exhaustively and every co sums to 0 mod 3", () => {
    for (let coord = 0; coord < CORNER_ORIENTATION_STATES; coord++) {
      const co = decodeCornerOrientation(coord);
      expect(co).toHaveLength(8);
      expect(co.reduce((a, b) => a + b, 0) % 3).toBe(0);
      expect(encodeCornerOrientation(co)).toBe(coord);
    }
  });

  it("the solved orientation is coordinate 0", () => {
    expect(encodeCornerOrientation([0, 0, 0, 0, 0, 0, 0, 0])).toBe(0);
  });
});

describe("edge orientation coordinate (0..2047)", () => {
  it("round-trips exhaustively and every eo sums to 0 mod 2", () => {
    for (let coord = 0; coord < EDGE_ORIENTATION_STATES; coord++) {
      const eo = decodeEdgeOrientation(coord);
      expect(eo).toHaveLength(12);
      expect(eo.reduce((a, b) => a + b, 0) % 2).toBe(0);
      expect(encodeEdgeOrientation(eo)).toBe(coord);
    }
  });

  it("the solved orientation is coordinate 0", () => {
    expect(encodeEdgeOrientation(new Array(12).fill(0))).toBe(0);
  });
});

describe("UD-slice coordinate (0..494)", () => {
  it("round-trips exhaustively", () => {
    for (let coord = 0; coord < UD_SLICE_STATES; coord++) {
      const ep = decodeUdSlice(coord);
      expect(ep).toHaveLength(12);
      expect(encodeUdSlice(ep)).toBe(coord);
    }
  });

  it("the solved cube (identities 8-11 already in slots 8-11) has a fixed, well-defined coordinate", () => {
    // This combinatorial numbering ranks subsets in colex order (by largest member
    // first), so {8,9,10,11} -- the largest possible 4-subset of {0..11} -- lands at
    // the *last* rank, not 0. That's fine: the solver always compares against this
    // actual encoded value, never an assumed 0, for exactly this reason.
    expect(encodeUdSlice([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])).toBe(UD_SLICE_STATES - 1);
  });
});

describe("phase-2 permutation coordinates", () => {
  it("corner permutation round-trips exhaustively (40320 states)", () => {
    const seen = new Set<string>();
    for (let coord = 0; coord < CORNER_PERMUTATION_STATES; coord++) {
      const cp = decodeCornerPermutation(coord);
      seen.add(cp.join(","));
      expect(encodeCornerPermutation(cp)).toBe(coord);
    }
    expect(seen.size).toBe(CORNER_PERMUTATION_STATES);
  });

  it("edge permutation of the 8 UD edges round-trips exhaustively (40320 states)", () => {
    const seen = new Set<string>();
    for (let coord = 0; coord < EDGE_PERMUTATION_8_STATES; coord++) {
      const ep = decodeEdgePermutation8(coord);
      expect(ep.slice(8)).toEqual([8, 9, 10, 11]);
      seen.add(ep.slice(0, 8).join(","));
      expect(encodeEdgePermutation8(ep)).toBe(coord);
    }
    expect(seen.size).toBe(EDGE_PERMUTATION_8_STATES);
  });

  it("UD-slice permutation round-trips exhaustively (24 states)", () => {
    const seen = new Set<string>();
    for (let coord = 0; coord < UD_SLICE_PERMUTATION_STATES; coord++) {
      const ep = decodeUdSlicePermutation(coord);
      expect(ep.slice(0, 8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      seen.add(ep.slice(8).join(","));
      expect(encodeUdSlicePermutation(ep)).toBe(coord);
    }
    expect(seen.size).toBe(UD_SLICE_PERMUTATION_STATES);
  });

  it("the solved cube has coordinate 0 for every phase-2 coordinate", () => {
    const solvedCp = [0, 1, 2, 3, 4, 5, 6, 7];
    const solvedEp = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    expect(encodeCornerPermutation(solvedCp)).toBe(0);
    expect(encodeEdgePermutation8(solvedEp)).toBe(0);
    expect(encodeUdSlicePermutation(solvedEp)).toBe(0);
  });
});
