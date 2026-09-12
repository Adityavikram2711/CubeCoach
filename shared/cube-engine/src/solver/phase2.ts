/**
 * Phase 2: starting from a cube already in the phase-1 subgroup (corners oriented,
 * edges oriented, UD-slice edges in slots 8-11), finish solving using only moves that
 * can't undo phase 1's work: U/D (any turn) and L2/R2/F2/B2. Same IDA* structure as
 * phase 1, just over the phase-2 coordinates and move set.
 */
import type { CubieCube } from "../cube/cubie.js";
import {
  encodeCornerPermutation,
  encodeEdgePermutation8,
  encodeUdSlicePermutation,
  UD_SLICE_PERMUTATION_STATES,
} from "./coordinates.js";
import { applyMoveToCubie, PHASE2_MOVES } from "./cubieMoves.js";
import {
  getCornerPermutationMoveTable,
  getEdgePermutation8MoveTable,
  getUdSlicePermutationMoveTable,
} from "./moveTables.js";
import { AXIS_PARTNER, CANONICAL_FIRST_FACE, faceOf } from "./movePruning.js";
import { buildPruningTable, lookupPruning } from "./pruningTables.js";

const SOLVED = 0; // every phase-2 coordinate's solved value is 0 (see coordinates.test.ts)

let cornerSlicePruning: Uint8Array | null = null;
let edgeSlicePruning: Uint8Array | null = null;

function getCornerSlicePruning(): Uint8Array {
  if (!cornerSlicePruning) {
    cornerSlicePruning = buildPruningTable(
      40320,
      getCornerPermutationMoveTable(),
      UD_SLICE_PERMUTATION_STATES,
      getUdSlicePermutationMoveTable(),
      SOLVED,
      SOLVED,
      PHASE2_MOVES.length,
    );
  }
  return cornerSlicePruning;
}

function getEdgeSlicePruning(): Uint8Array {
  if (!edgeSlicePruning) {
    edgeSlicePruning = buildPruningTable(
      40320,
      getEdgePermutation8MoveTable(),
      UD_SLICE_PERMUTATION_STATES,
      getUdSlicePermutationMoveTable(),
      SOLVED,
      SOLVED,
      PHASE2_MOVES.length,
    );
  }
  return edgeSlicePruning;
}

export interface Phase2Result {
  moves: string[];
  resultCubie: CubieCube;
}

/**
 * Finishes a phase-1-solved cube. Returns null only if no solution exists within
 * maxDepth -- for a genuinely phase-1-solved input this subgroup is always solvable
 * within 18 moves (the known phase-2 bound), so null here means the input wasn't
 * actually phase-1-solved (a bug upstream), not that the search gave up too early.
 */
export function solvePhase2(cubie: CubieCube, maxDepth = 18): Phase2Result | null {
  const cpTable = getCornerPermutationMoveTable();
  const ep8Table = getEdgePermutation8MoveTable();
  const sliceTable = getUdSlicePermutationMoveTable();
  const pruning1 = getCornerSlicePruning();
  const pruning2 = getEdgeSlicePruning();

  const startCp = encodeCornerPermutation(cubie.cp);
  const startEp8 = encodeEdgePermutation8(cubie.ep);
  const startSlice = encodeUdSlicePermutation(cubie.ep);

  const heuristic = (cp: number, ep8: number, slice: number) =>
    Math.max(
      lookupPruning(pruning1, UD_SLICE_PERMUTATION_STATES, cp, slice),
      lookupPruning(pruning2, UD_SLICE_PERMUTATION_STATES, ep8, slice),
    );

  const path: string[] = [];

  function search(cp: number, ep8: number, slice: number, g: number, bound: number, lastFace: string | null): number {
    const h = heuristic(cp, ep8, slice);
    const f = g + h;
    if (f > bound) return f;
    if (h === 0) return -1;

    let min = Infinity;
    for (let m = 0; m < PHASE2_MOVES.length; m++) {
      const move = PHASE2_MOVES[m]!;
      const face = faceOf(move);
      if (lastFace !== null) {
        if (face === lastFace) continue;
        if (AXIS_PARTNER[face] === lastFace && !CANONICAL_FIRST_FACE.has(lastFace)) continue;
      }
      path.push(move);
      const t = search(cpTable[cp]![m]!, ep8Table[ep8]![m]!, sliceTable[slice]![m]!, g + 1, bound, face);
      if (t === -1) return -1;
      if (t < min) min = t;
      path.pop();
    }
    return min;
  }

  let bound = heuristic(startCp, startEp8, startSlice);
  while (bound <= maxDepth) {
    const result = search(startCp, startEp8, startSlice, 0, bound, null);
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
