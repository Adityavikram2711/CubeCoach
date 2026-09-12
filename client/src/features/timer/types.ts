export type Penalty = "NONE" | "PLUS_TWO" | "DNF";

export const PLUS_TWO_MS = 2000;

/** WCA-style inspection: 15s is the "no penalty" window, 15-17s is a +2 grace window, past 17s is an automatic DNF. */
export const INSPECTION_MS = 15_000;
export const INSPECTION_GRACE_MS = 17_000;

/**
 * One solve, as both the client and server agree on it. Timing is always stored in
 * whole milliseconds (never a pre-formatted string, never floating-point seconds) --
 * `formatTime` is a presentation concern, not data.
 */
export interface SolveRecord {
  /** Guest solves get a client-generated id (crypto.randomUUID()); authenticated solves use Mongo's _id, matching the Algorithm/UserAlgorithm API convention. */
  id: string;
  scramble: string;
  /** 0 when the solve never actually ran (auto-DNF from inspection overrunning 17s). */
  rawTimeMs: number;
  penalty: Penalty;
  /** null iff penalty is DNF. */
  finalTimeMs: number | null;
  solvedAt: string;
}

export interface SolveStats {
  count: number;
  dnfCount: number;
  plusTwoCount: number;
  best: number | null;
  mean: number | null;
  ao5: AverageResult;
  ao12: AverageResult;
  ao50: AverageResult;
}

export type AverageResult = { status: "insufficient-data" } | { status: "dnf" } | { status: "ok"; timeMs: number };
