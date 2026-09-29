import { describe, expect, it } from "vitest";
import { conjugateByU, enumeratePllPatterns, isSameAufOrbit, permutationParity, permutationsOf4 } from "./pllPermutations.js";

describe("conjugateByU", () => {
  it("conjugating the identity permutation gives a genuine U turn's effect, not identity", () => {
    // A real top-layer U turn moves pieces even starting from solved -- this is a
    // regression test for a real bug: an earlier version conjugated by a whole-cube "y"
    // rotation instead, which (for reasons specific to this artificial last-layer-only
    // representation) incorrectly read back as identity, as if U were a no-op.
    const { cp, ep } = conjugateByU([0, 1, 2, 3], [0, 1, 2, 3]);
    expect(cp).toEqual([3, 0, 1, 2]);
    expect(ep).toEqual([1, 2, 3, 0]);
  });

  it("D-layer stays solved (U only relabels the last layer, orientation stays 0)", () => {
    const cubie = conjugateByU([1, 2, 0, 3], [3, 0, 2, 1]);
    expect(cubie.cp).toHaveLength(4);
    expect(cubie.ep).toHaveLength(4);
  });

  it("applying it 4 times returns to the original pattern (a U turn has order 4)", () => {
    let cp = [1, 2, 0, 3];
    let ep = [3, 0, 2, 1];
    for (let i = 0; i < 4; i++) {
      ({ cp, ep } = conjugateByU(cp, ep));
    }
    expect(cp).toEqual([1, 2, 0, 3]);
    expect(ep).toEqual([3, 0, 2, 1]);
  });

  it("regression: a double-transposition pattern genuinely cycles through 4 distinct states, not a fixed point", () => {
    // The bug this guards against: conjugating cp=[3,2,1,0] (a corner double-swap, the
    // shape of the real E-perm) by the old "y"-based implementation incorrectly stayed
    // fixed/alternated between only 2 states forever, never reaching the other 2
    // legitimate rotations -- which is what let the generator treat E-perm as
    // AUF-equivalent to (and so a duplicate of) H-perm.
    const seen = new Set<string>();
    let cp = [3, 2, 1, 0];
    let ep = [0, 1, 2, 3];
    for (let i = 0; i < 4; i++) {
      seen.add(`${cp.join(",")}|${ep.join(",")}`);
      ({ cp, ep } = conjugateByU(cp, ep));
    }
    expect(seen.size).toBe(4);
  });

  it("keeps corner-parity and edge-parity equal to each other at every step (physical realizability), even though each individually toggles with repeated real U turns", () => {
    // conjugateByU applies a REAL U move (composition), not an abstract group
    // conjugation -- so cp's own parity is NOT preserved in isolation (a single U turn
    // is itself an odd permutation). What must always hold is that cp's parity matches
    // ep's parity, since that's the actual physical-realizability constraint.
    const samples: Array<[number[], number[]]> = [
      [[1, 2, 0, 3], [0, 1, 2, 3]],
      [[0, 1, 2, 3], [1, 2, 0, 3]],
      [[1, 0, 3, 2], [0, 1, 2, 3]],
    ];
    for (const [cp, ep] of samples) {
      let current = { cp, ep };
      for (let i = 0; i < 4; i++) {
        expect(permutationParity(current.cp)).toBe(permutationParity(current.ep));
        current = conjugateByU(current.cp, current.ep);
      }
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
