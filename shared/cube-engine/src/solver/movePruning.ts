/**
 * Search-space pruning shared by phase 1 and phase 2's IDA*. Two rules, both provably
 * safe (they never eliminate the ability to find an optimal solution, only redundant
 * duplicate branches):
 *
 * 1. Never repeat the same face twice in a row -- two consecutive turns of the same
 *    face are always equivalent to a single turn (or no turn), so that single token is
 *    always reachable some other way in the search tree.
 * 2. Opposite faces on the same axis (U/D, L/R, F/B) commute, so "U then D" and
 *    "D then U" reach the same state -- only the canonical order (U before D, L before
 *    R, F before B) needs exploring.
 */
export const AXIS_PARTNER: Record<string, string> = { U: "D", D: "U", L: "R", R: "L", F: "B", B: "F" };
export const CANONICAL_FIRST_FACE = new Set(["U", "L", "F"]);

export function faceOf(move: string): string {
  return move[0]!;
}
