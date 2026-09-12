import type { Move } from "../moves/types.js";

const SCRAMBLE_FACES = ["U", "D", "L", "R", "F", "B"] as const;
const AXIS: Record<(typeof SCRAMBLE_FACES)[number], "x" | "y" | "z"> = {
  U: "y",
  D: "y",
  L: "x",
  R: "x",
  F: "z",
  B: "z",
};
const SUFFIXES = ["", "'", "2"];

/**
 * Generates a standard WCA-style 3x3 scramble: quarter/half turns of the 6 outer
 * faces only. Every move is applied through the same move engine used elsewhere, so
 * every scramble is, by construction, a reachable cube state. Two rules keep it from
 * looking obviously redundant: never repeat the same face twice in a row, and never do
 * 3 consecutive moves on the same axis (e.g. "R L R"), since the middle move there
 * doesn't interact with anything between the other two.
 */
export function generateScramble(length = 20, random: () => number = Math.random): Move[] {
  const moves: Move[] = [];
  let lastFace: (typeof SCRAMBLE_FACES)[number] | null = null;
  let lastAxis: "x" | "y" | "z" | null = null;
  let axisRunLength = 0;

  while (moves.length < length) {
    const face = SCRAMBLE_FACES[Math.floor(random() * SCRAMBLE_FACES.length)]!;
    if (face === lastFace) continue;
    const axis = AXIS[face];
    if (axis === lastAxis && axisRunLength >= 2) continue;

    const suffix = SUFFIXES[Math.floor(random() * SUFFIXES.length)]!;
    moves.push(`${face}${suffix}`);

    axisRunLength = axis === lastAxis ? axisRunLength + 1 : 1;
    lastFace = face;
    lastAxis = axis;
  }

  return moves;
}
