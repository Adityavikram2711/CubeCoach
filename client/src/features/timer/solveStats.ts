import { calculateAo12, calculateAo5, calculateAo50, calculateBest, calculateMean } from "./statistics.js";
import type { SolveRecord, SolveStats } from "./types.js";

/**
 * Builds the full dashboard stats from a solve list, newest-first (the same order the
 * history table and /api/solves both use). Works identically for guest (in-memory) and
 * authenticated (server-fetched) solves -- same function, same rules, one source of
 * truth for what "PB"/"Ao5"/etc. mean anywhere in the app.
 */
export function computeSolveStats(recentFirst: readonly SolveRecord[]): SolveStats {
  const finalTimes = recentFirst.map((s) => s.finalTimeMs);
  return {
    count: recentFirst.length,
    dnfCount: recentFirst.filter((s) => s.penalty === "DNF").length,
    plusTwoCount: recentFirst.filter((s) => s.penalty === "PLUS_TWO").length,
    best: calculateBest(finalTimes),
    mean: calculateMean(finalTimes),
    ao5: calculateAo5(finalTimes),
    ao12: calculateAo12(finalTimes),
    ao50: calculateAo50(finalTimes),
  };
}
