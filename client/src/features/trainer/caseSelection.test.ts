import { describe, expect, it } from "vitest";
import {
  buildSession,
  calculateSuccessRate,
  calculateWeight,
  filterCases,
  generateChoices,
  selectNextCase,
} from "./caseSelection.js";
import type { CaseProgress, ProgressMap, TrainerCase } from "./types.js";

function makeCase(caseId: string, overrides: Partial<TrainerCase> = {}): TrainerCase {
  return {
    caseId,
    type: "OLL",
    number: 1,
    name: `Case ${caseId}`,
    recognition: "recognition text",
    algorithm: "R U R' U'",
    alternatives: [],
    fingerTricks: "",
    notes: "",
    difficulty: "Beginner",
    scrambledState: new Array(54).fill("white"),
    ...overrides,
  };
}

function makeProgress(overrides: Partial<CaseProgress> = {}): CaseProgress {
  return { favorite: false, learned: false, practiceCount: 0, successCount: 0, personalAlternatives: [], ...overrides };
}

/** A deterministic sequence generator so tests never depend on real randomness. */
function sequenceRandom(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length]!;
}

describe("calculateSuccessRate", () => {
  it("is undefined when never practiced (not 0)", () => {
    expect(calculateSuccessRate(undefined)).toBeUndefined();
    expect(calculateSuccessRate(makeProgress({ practiceCount: 0 }))).toBeUndefined();
  });

  it("computes successCount / practiceCount", () => {
    expect(calculateSuccessRate(makeProgress({ practiceCount: 4, successCount: 3 }))).toBe(0.75);
  });

  it("handles 0% and 100% success", () => {
    expect(calculateSuccessRate(makeProgress({ practiceCount: 5, successCount: 0 }))).toBe(0);
    expect(calculateSuccessRate(makeProgress({ practiceCount: 5, successCount: 5 }))).toBe(1);
  });
});

describe("calculateWeight", () => {
  it("gives never-practiced cases the maximum weight", () => {
    expect(calculateWeight(undefined)).toBe(100);
    expect(calculateWeight(makeProgress({ practiceCount: 0 }))).toBe(100);
  });

  it("weights 0% success as high as never-practiced", () => {
    expect(calculateWeight(makeProgress({ practiceCount: 3, successCount: 0 }))).toBe(100);
  });

  it("weights 100% success at the floor", () => {
    expect(calculateWeight(makeProgress({ practiceCount: 3, successCount: 3 }))).toBe(1);
  });

  it("deprioritizes learned cases but never to zero", () => {
    const learnedPerfect = calculateWeight(makeProgress({ practiceCount: 10, successCount: 10, learned: true }));
    expect(learnedPerfect).toBeGreaterThan(0);
    expect(learnedPerfect).toBe(1); // floored, since (1-1)*100*0.3 = 0, floored to 1

    const learnedStruggling = calculateWeight(makeProgress({ practiceCount: 10, successCount: 2, learned: true }));
    const notLearnedStruggling = calculateWeight(makeProgress({ practiceCount: 10, successCount: 2, learned: false }));
    expect(learnedStruggling).toBeLessThan(notLearnedStruggling);
  });

  it("gives favorites a boost relative to an identical non-favorite", () => {
    const fav = calculateWeight(makeProgress({ practiceCount: 4, successCount: 2, favorite: true }));
    const nonFav = calculateWeight(makeProgress({ practiceCount: 4, successCount: 2, favorite: false }));
    expect(fav).toBeGreaterThan(nonFav);
  });
});

describe("filterCases", () => {
  const cases = [makeCase("a"), makeCase("b"), makeCase("c")];

  it("'all' returns every case unfiltered", () => {
    expect(filterCases(cases, {}, "all")).toEqual(cases);
  });

  it("'favorites' returns only favorited cases", () => {
    const progress: ProgressMap = { a: makeProgress({ favorite: true }) };
    expect(filterCases(cases, progress, "favorites").map((c) => c.caseId)).toEqual(["a"]);
  });

  it("'favorites' is empty when nothing is favorited", () => {
    expect(filterCases(cases, {}, "favorites")).toEqual([]);
  });

  it("'learned' returns only explicitly learned cases", () => {
    const progress: ProgressMap = { a: makeProgress({ learned: true }) };
    expect(filterCases(cases, progress, "learned").map((c) => c.caseId)).toEqual(["a"]);
  });

  it("'unlearned' treats a missing record as unlearned", () => {
    const progress: ProgressMap = { a: makeProgress({ learned: true }) };
    // b and c have no record at all -- both must still count as unlearned.
    expect(filterCases(cases, progress, "unlearned").map((c) => c.caseId).sort()).toEqual(["b", "c"]);
  });

  it("'unlearned' is everything when there is no progress at all", () => {
    expect(filterCases(cases, {}, "unlearned")).toEqual(cases);
  });

  it("'weak' excludes never-practiced cases (unknown, not weak)", () => {
    expect(filterCases(cases, {}, "weak")).toEqual([]);
  });

  it("'weak' includes practiced cases below the success threshold", () => {
    const progress: ProgressMap = {
      a: makeProgress({ practiceCount: 4, successCount: 1 }), // 25%, weak
      b: makeProgress({ practiceCount: 4, successCount: 4 }), // 100%, not weak
    };
    expect(filterCases(cases, progress, "weak").map((c) => c.caseId)).toEqual(["a"]);
  });
});

describe("selectNextCase", () => {
  it("returns null for an empty pool", () => {
    expect(selectNextCase([], {}, null, () => 0, false)).toBeNull();
  });

  it("returns the only case when the pool has exactly one, even if it's the excluded one", () => {
    const cases = [makeCase("a")];
    expect(selectNextCase(cases, {}, "a", () => 0, false)!.caseId).toBe("a");
  });

  it("never returns the excluded case when an alternative exists (uniform mode)", () => {
    const cases = [makeCase("a"), makeCase("b")];
    for (let i = 0; i < 20; i++) {
      const picked = selectNextCase(cases, {}, "a", Math.random, false);
      expect(picked!.caseId).toBe("b");
    }
  });

  it("is deterministic given an injected random function", () => {
    const cases = [makeCase("a"), makeCase("b"), makeCase("c")];
    const random = sequenceRandom([0.5]);
    const picked1 = selectNextCase(cases, {}, null, sequenceRandom([0.5]), false);
    const picked2 = selectNextCase(cases, {}, null, sequenceRandom([0.5]), false);
    expect(picked1!.caseId).toBe(picked2!.caseId);
    expect(random).toBeTypeOf("function"); // sanity: helper itself is a plain function
  });

  it("weighted mode favors never-practiced cases over a perfectly-learned one", () => {
    const cases = [makeCase("fresh"), makeCase("mastered")];
    const progress: ProgressMap = { mastered: makeProgress({ practiceCount: 20, successCount: 20, learned: true }) };
    const picks = { fresh: 0, mastered: 0 };
    // A fixed, evenly-spaced random sequence over many draws approximates the weighted distribution deterministically.
    for (let i = 0; i < 100; i++) {
      const r = i / 100;
      const picked = selectNextCase(cases, progress, null, () => r, true);
      picks[picked!.caseId as "fresh" | "mastered"]++;
    }
    expect(picks.fresh).toBeGreaterThan(picks.mastered);
  });
});

describe("buildSession", () => {
  it("returns an empty array for an empty pool", () => {
    expect(buildSession([], {}, 5, Math.random)).toEqual([]);
  });

  it("stops early (does not loop forever) when the pool is smaller than requested and has one case", () => {
    const cases = [makeCase("a")];
    const session = buildSession(cases, {}, 10, Math.random);
    expect(session).toHaveLength(10); // one case, repeated -- that's correct: it's the only option each time
    expect(session.every((c) => c.caseId === "a")).toBe(true);
  });

  it("session length larger than available cases still produces exactly the requested length when pool.length > 1", () => {
    const cases = [makeCase("a"), makeCase("b")];
    const session = buildSession(cases, {}, 20, Math.random);
    expect(session).toHaveLength(20);
  });

  it("avoids two consecutive identical cases whenever more than one case is available", () => {
    const cases = [makeCase("a"), makeCase("b")];
    const session = buildSession(cases, {}, 30, Math.random);
    for (let i = 1; i < session.length; i++) {
      expect(session[i]!.caseId).not.toBe(session[i - 1]!.caseId);
    }
  });

  it("honors the exact requested length for a normal pool", () => {
    const cases = [makeCase("a"), makeCase("b"), makeCase("c"), makeCase("d")];
    expect(buildSession(cases, {}, 5, Math.random)).toHaveLength(5);
  });
});

describe("generateChoices", () => {
  const pool = [makeCase("a"), makeCase("b"), makeCase("c"), makeCase("d"), makeCase("e")];

  it("always includes the correct case", () => {
    const choices = generateChoices(pool[0]!, pool, Math.random);
    expect(choices.map((c) => c.caseId)).toContain("a");
  });

  it("returns no duplicate caseIds", () => {
    const choices = generateChoices(pool[0]!, pool, Math.random);
    const ids = choices.map((c) => c.caseId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns exactly `count` choices when enough cases exist", () => {
    expect(generateChoices(pool[0]!, pool, Math.random, 4)).toHaveLength(4);
  });

  it("degrades gracefully when fewer cases exist than requested count", () => {
    const smallPool = [makeCase("a"), makeCase("b")];
    const choices = generateChoices(smallPool[0]!, smallPool, Math.random, 4);
    expect(choices).toHaveLength(2);
    expect(choices.map((c) => c.caseId).sort()).toEqual(["a", "b"]);
  });

  it("handles a pool of exactly one case (only the correct answer)", () => {
    const onlyCase = [makeCase("a")];
    const choices = generateChoices(onlyCase[0]!, onlyCase, Math.random, 4);
    expect(choices).toEqual([{ caseId: "a", label: onlyCase[0]!.name }]);
  });

  it("uses each case's real name, never a fabricated one", () => {
    const named = makeCase("x", { name: "T Perm" });
    const choices = generateChoices(named, [named, makeCase("y", { name: "Y Perm" })], Math.random);
    const match = choices.find((c) => c.caseId === "x");
    expect(match!.label).toBe("T Perm");
  });
});
