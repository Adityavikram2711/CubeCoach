import { describe, expect, it } from "vitest";
import { getProgressSummary, getSessionSummary } from "./sessionSummary.js";
import type { AttemptResult, CaseProgress, ProgressMap, TrainerCase } from "./types.js";

function makeCase(caseId: string): TrainerCase {
  return {
    caseId,
    type: "OLL",
    number: 1,
    name: `Case ${caseId}`,
    recognition: "",
    algorithm: "R U R' U'",
    alternatives: [],
    fingerTricks: "",
    notes: "",
    difficulty: "Beginner",
    scrambledState: new Array(54).fill("white"),
  };
}

function makeProgress(overrides: Partial<CaseProgress> = {}): CaseProgress {
  return { favorite: false, learned: false, practiceCount: 0, successCount: 0, personalAlternatives: [], ...overrides };
}

describe("getSessionSummary", () => {
  it("handles zero attempts without division errors", () => {
    expect(getSessionSummary([])).toEqual({ total: 0, correct: 0, incorrect: 0, accuracy: 0, weakCases: [], mostMissed: null });
  });

  it("computes correct/incorrect/accuracy from real attempts", () => {
    const attempts: AttemptResult[] = [
      { caseId: "a", type: "OLL", correct: true },
      { caseId: "b", type: "OLL", correct: true },
      { caseId: "c", type: "OLL", correct: false },
      { caseId: "d", type: "OLL", correct: false },
    ];
    const summary = getSessionSummary(attempts);
    expect(summary.total).toBe(4);
    expect(summary.correct).toBe(2);
    expect(summary.incorrect).toBe(2);
    expect(summary.accuracy).toBe(50);
  });

  it("100% success has no weak cases and no most-missed", () => {
    const attempts: AttemptResult[] = [{ caseId: "a", type: "OLL", correct: true }];
    const summary = getSessionSummary(attempts);
    expect(summary.weakCases).toEqual([]);
    expect(summary.mostMissed).toBeNull();
    expect(summary.accuracy).toBe(100);
  });

  it("0% success has every case as weak", () => {
    const attempts: AttemptResult[] = [
      { caseId: "a", type: "OLL", correct: false },
      { caseId: "b", type: "OLL", correct: false },
    ];
    const summary = getSessionSummary(attempts);
    expect(summary.accuracy).toBe(0);
    expect(summary.weakCases.sort()).toEqual(["a", "b"]);
  });

  it("identifies the most-missed case from repeated misses within a session", () => {
    const attempts: AttemptResult[] = [
      { caseId: "a", type: "OLL", correct: false },
      { caseId: "a", type: "OLL", correct: false },
      { caseId: "b", type: "OLL", correct: false },
    ];
    expect(getSessionSummary(attempts).mostMissed).toBe("a");
  });

  it("rounds accuracy rather than producing fractional percentages", () => {
    const attempts: AttemptResult[] = [
      { caseId: "a", type: "OLL", correct: true },
      { caseId: "b", type: "OLL", correct: false },
      { caseId: "c", type: "OLL", correct: false },
    ];
    expect(getSessionSummary(attempts).accuracy).toBe(33); // 1/3 = 33.33... -> 33
  });
});

describe("getProgressSummary", () => {
  const cases = [makeCase("a"), makeCase("b"), makeCase("c")];

  it("handles an empty case set", () => {
    expect(getProgressSummary([], {})).toEqual({ total: 0, learned: 0, practiced: 0, averageSuccessRate: null });
  });

  it("no progress at all -- 0 learned, 0 practiced, null average", () => {
    const summary = getProgressSummary(cases, {});
    expect(summary).toEqual({ total: 3, learned: 0, practiced: 0, averageSuccessRate: null });
  });

  it("all cases learned", () => {
    const progress: ProgressMap = {
      a: makeProgress({ learned: true }),
      b: makeProgress({ learned: true }),
      c: makeProgress({ learned: true }),
    };
    expect(getProgressSummary(cases, progress).learned).toBe(3);
  });

  it("computes an average success rate only across practiced cases", () => {
    const progress: ProgressMap = {
      a: makeProgress({ practiceCount: 4, successCount: 4 }), // 100%
      b: makeProgress({ practiceCount: 4, successCount: 0 }), // 0%
      // c never practiced -- must not drag the average down as if it were 0%
    };
    const summary = getProgressSummary(cases, progress);
    expect(summary.practiced).toBe(2);
    expect(summary.averageSuccessRate).toBe(50);
  });

  it("a missing UserAlgorithm record does not count as practiced", () => {
    const progress: ProgressMap = { a: makeProgress({ practiceCount: 2, successCount: 1 }) };
    expect(getProgressSummary(cases, progress).practiced).toBe(1);
  });
});
