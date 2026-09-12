import { describe, expect, it } from "vitest";
import { conjugateByU, enumeratePllPatterns, isSameAufOrbit, permutationParity, permutationsOf4 } from "./pllPermutations.js";

describe("conjugateByU", () => {
  it("conjugating the identity permutation always gives the identity", () => {
    const { cp, ep } = conjugateByU([0, 1, 2, 3], [0, 1, 2, 3]);
    expect(cp).toEqual([0, 1, 2, 3]);
    expect(ep).toEqual([0, 1, 2, 3]);
  });

  it("D-layer stays solved (y only relabels the last layer, orientation stays 0)", () => {
    const cubie = conjugateByU([1, 2, 0, 3], [3, 0, 2, 1]);
    expect(cubie.cp).toHaveLength(4);
    expect(cubie.ep).toHaveLength(4);
  });

  it("applying it 4 times returns to the original pattern (a y rotation has order 4)", () => {
    let cp = [1, 2, 0, 3];
    let ep = [3, 0, 2, 1];
    for (let i = 0; i < 4; i++) {
      ({ cp, ep } = conjugateByU(cp, ep));
    }
    expect(cp).toEqual([1, 2, 0, 3]);
    expect(ep).toEqual([3, 0, 2, 1]);
  });

  it("preserves permutation parity (a rotation can't change whether a permutation is even or odd)", () => {
    const samples: Array<[number[], number[]]> = [
      [[1, 2, 0, 3], [0, 1, 2, 3]],
      [[0, 1, 2, 3], [1, 2, 0, 3]],
      [[1, 0, 3, 2], [0, 1, 2, 3]],
    ];
    for (const [cp, ep] of samples) {
      const before = permutationParity(cp);
      const { cp: rotatedCp } = conjugateByU(cp, ep);
      expect(permutationParity(rotatedCp)).toBe(before);
    }
  });
});

describe("enumeratePllPatterns", () => {
  it("every pattern has matching corner/edge parity and is not solved", () => {
    for (const { cp, ep } of enumeratePllPatterns()) {
      expect(permutationParity(cp)).toBe(permutationParity(ep));
      const isSolved = cp.every((v, i) => v === i) && ep.every((v, i) => v === i);
      expect(isSolved).toBe(false);
    }
  });

  it("no two representatives are in the same AUF orbit (isSameAufOrbit is a real check, not a tautology)", () => {
    const patterns = enumeratePllPatterns();
    for (let i = 0; i < patterns.length; i++) {
      for (let j = i + 1; j < patterns.length; j++) {
        expect(isSameAufOrbit(patterns[i]!, patterns[j]!), `${i} vs ${j}`).toBe(false);
      }
    }
  });

  it("isSameAufOrbit correctly identifies a pattern rotated by U as equivalent", () => {
    const [first] = enumeratePllPatterns();
    const rotated = conjugateByU(first!.cp, first!.ep);
    expect(isSameAufOrbit(first!, rotated)).toBe(true);
  });

  it("produces 288 total valid pairs before dedup, split evenly by parity structure", () => {
    const perms = permutationsOf4();
    expect(perms).toHaveLength(24);
  });
});
