import { PLUS_TWO_MS, type Penalty } from "./types.js";

/**
 * The single place penalty is turned into a result. NONE passes the raw time through
 * unchanged; PLUS_TWO adds a fixed 2000ms; DNF discards the numeric result entirely
 * (null, never 0 -- a DNF is not "instant", it's "invalid"). The raw time itself is
 * never mutated or lost -- callers keep storing it alongside this result.
 */
export function calculateFinalTime(rawTimeMs: number, penalty: Penalty): number | null {
  switch (penalty) {
    case "NONE":
      return rawTimeMs;
    case "PLUS_TWO":
      return rawTimeMs + PLUS_TWO_MS;
    case "DNF":
      return null;
  }
}

/**
 * Formats milliseconds the way a speedcubing timer does: centisecond precision, and
 * minutes only appear once a solve actually crosses a minute. null renders as "DNF" so
 * callers never have to special-case that at every display site.
 *
 *   0        -> "0.00"
 *   12470    -> "12.47"
 *   60500    -> "1:00.50"
 *   372340   -> "6:12.34"
 */
export function formatTime(ms: number | null): string {
  if (ms === null) return "DNF";

  const totalCentiseconds = Math.round(ms / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const cs = String(centiseconds).padStart(2, "0");
  if (minutes > 0) {
    const ss = String(seconds).padStart(2, "0");
    return `${minutes}:${ss}.${cs}`;
  }
  return `${seconds}.${cs}`;
}

/** Rejects negative, non-finite, NaN, or absurdly large (>24h) times -- a sanity bound, not a WCA rule. */
export function isValidRawTimeMs(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 24 * 60 * 60 * 1000;
}

export function isValidPenalty(value: unknown): value is Penalty {
  return value === "NONE" || value === "PLUS_TWO" || value === "DNF";
}
