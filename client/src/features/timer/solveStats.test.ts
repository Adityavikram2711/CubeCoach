import { describe, expect, it } from "vitest";
import { computeSolveStats } from "./solveStats.js";
import type { SolveRecord } from "./types.js";

function makeSolve(overrides: Partial<SolveRecord> = {}): SolveRecord {
  return {
    id: Math.random().toString(),
    scramble: "R U R' U'",
    rawTimeMs: 12000,
    penalty: "NONE",
    finalTimeMs: 12000,
    solvedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("computeSolveStats", () => {
  it("handles zero solves without NaN/Infinity/undefined", () => {
    const stats = computeSolveStats([]);
    expect(stats).toEqual({
      count: 0,
      dnfCount: 0,
      plusTwoCount: 0,
      best: null,
      mean: null,
      ao5: { status: "insufficient-data" },
      ao12: { status: "insufficient-data" },
      ao50: { status: "insufficient-data" },
    });
  });

  it("counts DNFs and +2s correctly", () => {
    const solves = [
      makeSolve({ penalty: "DNF", finalTimeMs: null }),
      makeSolve({ penalty: "PLUS_TWO", rawTimeMs: 10000, finalTimeMs: 12000 }),
      makeSolve({ penalty: "NONE", finalTimeMs: 9000 }),
    ];
    const stats = computeSolveStats(solves);
    expect(stats.count).toBe(3);
    expect(stats.dnfCount).toBe(1);
    expect(stats.plusTwoCount).toBe(1);
    expect(stats.best).toBe(9000); // DNF excluded from best
  });

  it("a deleted PB solve is naturally reflected once removed from the input list", () => {
    const withPb = [makeSolve({ finalTimeMs: 5000 }), makeSolve({ finalTimeMs: 9000 })];
    expect(computeSolveStats(withPb).best).toBe(5000);

    const afterDeletingPb = withPb.slice(1); // the caller deletes solve[0] and re-passes the remaining list
    expect(computeSolveStats(afterDeletingPb).best).toBe(9000);
  });

  it("single solve produces a valid best/mean but insufficient-data averages", () => {
    const stats = computeSolveStats([makeSolve({ finalTimeMs: 8000 })]);
    expect(stats.best).toBe(8000);
    expect(stats.mean).toBe(8000);
    expect(stats.ao5).toEqual({ status: "insufficient-data" });
  });
});
