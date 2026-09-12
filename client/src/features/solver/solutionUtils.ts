/**
 * Pure helpers for the solution viewer: reconstructing the cube state at any point in
 * a solution, explaining a move in plain English, and a keyboard-input guard. No move
 * parsing, move application, or cube representation of its own -- everything here
 * calls straight through to the shared engine.
 */
import { applyMoves, parseMoveToken, type BaseMoveName, type FaceletCube, type Move } from "@cube-coach/cube-engine";

/**
 * The cube state at `moveIndex` moves into `moves`, starting from `startCube`.
 * Convention used throughout this feature: moveIndex 0 is the state *before* any
 * solution move (i.e. startCube itself); moveIndex N is the state after the Nth move.
 * moveIndex must be in [0, moves.length].
 */
export function getCubeAtMove(startCube: FaceletCube, moves: readonly Move[], moveIndex: number): FaceletCube {
  return applyMoves(startCube, moves.slice(0, moveIndex));
}

const BASE_DESCRIPTION: Record<BaseMoveName, string> = {
  U: "Turn the top face",
  D: "Turn the bottom face",
  R: "Turn the right face",
  L: "Turn the left face",
  F: "Turn the front face",
  B: "Turn the back face",
  M: "Turn the middle slice (between L and R), in L's direction",
  E: "Turn the equatorial slice (between U and D), in D's direction",
  S: "Turn the standing slice (between F and B), in F's direction",
  Uw: "Turn the top two layers together",
  Dw: "Turn the bottom two layers together",
  Rw: "Turn the right two layers together",
  Lw: "Turn the left two layers together",
  Fw: "Turn the front two layers together",
  Bw: "Turn the back two layers together",
  x: "Rotate the entire cube on the R/L axis",
  y: "Rotate the entire cube on the U/D axis",
  z: "Rotate the entire cube on the F/B axis",
};

/** Plain-English name for a move token, e.g. "R'" -> "Right counter-clockwise". Returns null for anything the engine doesn't recognize. */
export function explainMove(move: Move): string | null {
  const parsed = parseMoveToken(move);
  if (!parsed) return null;

  const base = BASE_DESCRIPTION[parsed.base];
  if (parsed.turns === 2) return `${base}, 180°.`;
  if (parsed.turns === 3) return `${base}, counter-clockwise.`;
  return `${base}, clockwise.`;
}

/** Short notation legend, e.g. for a "Notation Help" panel -- one entry per base move actually used. */
export function notationLegend(bases: readonly BaseMoveName[]): Array<{ move: Move; explanation: string }> {
  const entries: Array<{ move: Move; explanation: string }> = [];
  for (const base of bases) {
    for (const move of [base, `${base}'`, `${base}2`]) {
      const explanation = explainMove(move);
      if (explanation) entries.push({ move, explanation });
    }
  }
  return entries;
}

/**
 * True if `target` is a form control the user could be typing into -- used to keep
 * solution-viewer keyboard shortcuts (arrows, space, R) from hijacking normal typing.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.contentEditable === "true";
}
