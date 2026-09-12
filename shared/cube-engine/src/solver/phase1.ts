/**
 * Phase 1: search for a sequence of the 18 standard moves that brings the cube into
 * the "H subgroup" -- all corners oriented, all edges oriented, and the 4 UD-slice
 * edges (FR/FL/BR/BL) back in slots 8-11 (in any order; getting their exact order
 * right is phase 2's job). This is the standard two-phase-algorithm subgroup: once
 * reached, phase 2 can finish the cube using only U/D (any turn) and L2/R2/F2/B2,
 * a vastly smaller search space.
 *
 * Uses iterative-deepening A* (IDA*): try increasingly large depth bounds, at each
 * one exploring only branches whose admissible heuristic (see pruningTables.ts) says
 * they could still reach the goal within budget.
 */
import type { CubieCube } from "../cube/cubie.js";
import { encodeCornerOrientation, encodeEdgeOrientation, encodeUdSlice, UD_SLICE_STATES } from "./coordinates.js";
import { applyMoveToCubie, PHASE1_MOVES } from "./cubieMoves.js";
import { getCornerOrientationMoveTable, getEdgeOrientationMoveTable, getUdSliceMoveTable } from "./moveTables.js";
import { AXIS_PARTNER, CANONICAL_FIRST_FACE, faceOf } from "./movePruning.js";
import { buildPruningTable, lookupPruning } from "./pruningTables.js";

const SOLVED_CO = 0;
const SOLVED_EO = 0;
const SOLVED_SLICE = UD_SLICE_STATES - 1; // see coordinates.ts: colex order puts the solved combination last

let coSlicePruning: Uint8Array | null = null;
let eoSlicePruning: Uint8Array | null = null;

function getCoSlicePruning(): Uint8Array {
  if (!coSlicePruning) {
    coSlicePruning = buildPruningTable(
      2187,
      getCornerOrientationMoveTable(),
      UD_SLICE_STATES,
      getUdSliceMoveTable(),
      SOLVED_CO,
      SOLVED_SLICE,
      PHASE1_MOVES.length,
    );
  }
  return coSlicePruning;
}

function getEoSlicePruning(): Uint8Array {
  if (!eoSlicePruning) {
    eoSlicePruning = buildPruningTable(
      2048,
      getEdgeOrientationMoveTable(),
      UD_SLICE_STATES,
      getUdSliceMoveTable(),
      SOLVED_EO,
      SOLVED_SLICE,
      PHASE1_MOVES.length,
    );
  }
  return eoSlicePruning;
}

export interface Phase1Result {
  moves: string[];
  /** The cubie state after applying `moves` -- guaranteed co=0, eo=0, slice=solved. */
  resultCubie: CubieCube;
}

/**
 * Finds the shortest (by this search's own move budget) sequence reaching the phase-1
 * subgroup. Returns null only if no such sequence exists within maxDepth -- since the
 * subgroup is provably reachable from ANY valid cube within 12 moves, a null result at
 * a reasonable maxDepth signals something upstream is wrong (an invalid cube slipped
 * through), not that the search should be trusted to "give up" on a valid one.
 */
export function solvePhase1(cubie: CubieCube, maxDepth = 13): Phase1Result | null {
  const coTable = getCornerOrientationMoveTable();
  const eoTable = getEdgeOrientationMoveTable();
  const sliceTable = getUdSliceMoveTable();
  const pruning1 = getCoSlicePruning();
  const pruning2 = getEoSlicePruning();

  const startCo = encodeCornerOrientation(cubie.co);
  const startEo = encodeEdgeOrientation(cubie.eo);
  const startSlice = encodeUdSlice(cubie.ep);

  const heuristic = (co: number, eo: number, slice: number) =>
    Math.max(lookupPruning(pruning1, UD_SLICE_STATES, co, slice), lookupPruning(pruning2, UD_SLICE_STATES, eo, slice));

  const path: string[] = [];

  function search(co: number, eo: number, slice: number, g: number, bound: number, lastFace: string | null): number {
    const h = heuristic(co, eo, slice);
    const f = g + h;
    if (f > bound) return f;
    if (h === 0) return -1; // solved (heuristic is 0 only exactly at the phase-1 goal)

    let min = Infinity;
    for (let m = 0; m < PHASE1_MOVES.length; m++) {
      const move = PHASE1_MOVES[m]!;
      const face = faceOf(move);
      if (lastFace !== null) {
        if (face === lastFace) continue;
        if (AXIS_PARTNER[face] === lastFace && !CANONICAL_FIRST_FACE.has(lastFace)) continue;
      }
      path.push(move);
      const t = search(coTable[co]![m]!, eoTable[eo]![m]!, sliceTable[slice]![m]!, g + 1, bound, face);
      if (t === -1) return -1;
      if (t < min) min = t;
      path.pop();
    }
    return min;
  }

  let bound = heuristic(startCo, startEo, startSlice);
  while (bound <= maxDepth) {
    const result = search(startCo, startEo, startSlice, 0, bound, null);
    if (result === -1) {
      return { moves: path.slice(), resultCubie: applyPathToCubie(cubie, path) };
    }
    if (result === Infinity) return null;
    bound = result;
  }
  return null;
}

function applyPathToCubie(cubie: CubieCube, moves: readonly string[]): CubieCube {
  return moves.reduce((c, m) => applyMoveToCubie(c, m), cubie);
}
