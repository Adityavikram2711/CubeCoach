import type { AverageResult } from "./types.js";

/**
 * The pure statistics engine behind the timer dashboard. Every function here takes
 * plain finalTimeMs values (null = DNF, never 0) -- no React, no MongoDB, no
 * dependency on how the caller fetched them. `recentFirst` throughout means "newest
 * solve at index 0," matching how solve history is naturally displayed and queried.
 */

export function calculateBest(finalTimes: readonly (number | null)[]): number | null {
  const real = finalTimes.filter((t): t is number => t !== null);
  return real.length === 0 ? null : Math.min(...real);
}

/** Arithmetic mean across every non-DNF result -- DNFs are excluded entirely, never counted as 0. */
export function calculateMean(finalTimes: readonly (number | null)[]): number | null {
  const real = finalTimes.filter((t): t is number => t !== null);
  if (real.length === 0) return null;
  return real.reduce((sum, t) => sum + t, 0) / real.length;
}

/**
 * The standard "average of N" rule: take the most recent N solves, drop the single
 * fastest and the single slowest, average what's left (N-2 results).
 *
 * DNF handling (documented, not incidental):
 *  - 2 or more DNFs in the window -> the whole average is itself a DNF.
 *  - Exactly 1 DNF -> it IS the "slowest" (nothing beats a DNF for slowness), so it
 *    fills that trimmed slot; the fastest of the remaining N-1 real times is trimmed
 *    instead, and the remaining N-2 real times are averaged.
 *  - 0 DNFs -> ordinary trim-best-trim-worst-average-the-middle-N-2.
 *
 * Returns "insufficient-data" (distinct from "dnf") when there aren't even N solves
 * yet -- these are different, both-legitimate reasons the UI must not conflate.
 */
export function calculateAoN(recentFirst: readonly (number | null)[], n: number): AverageResult {
  if (recentFirst.length < n) return { status: "insufficient-data" };
  const window = recentFirst.slice(0, n);
  const dnfCount = window.filter((t) => t === null).length;

  if (dnfCount >= 2) return { status: "dnf" };

  if (dnfCount === 1) {
    const real = window.filter((t): t is number => t !== null).sort((a, b) => a - b); // length n-1
    const middle = real.slice(1); // drop only the fastest real time -- the DNF already occupies the "slowest" slot
    if (middle.length === 0) return { status: "dnf" };
    return { status: "ok", timeMs: middle.reduce((a, b) => a + b, 0) / middle.length };
  }

  const sorted = [...(window as number[])].sort((a, b) => a - b);
  const middle = sorted.slice(1, sorted.length - 1);
  if (middle.length === 0) return { status: "insufficient-data" };
  return { status: "ok", timeMs: middle.reduce((a, b) => a + b, 0) / middle.length };
}

export function calculateAo5(recentFirst: readonly (number | null)[]): AverageResult {
  return calculateAoN(recentFirst, 5);
}

export function calculateAo12(recentFirst: readonly (number | null)[]): AverageResult {
  return calculateAoN(recentFirst, 12);
}

export function calculateAo50(recentFirst: readonly (number | null)[]): AverageResult {
  return calculateAoN(recentFirst, 50);
}
