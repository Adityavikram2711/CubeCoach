/**
 * Precomputed "coordinate + move -> new coordinate" tables. Built once (lazily, on
 * first use) via the slow-but-proven applyMoveToCubie path; the search itself only
 * ever does array lookups against these, which is what makes IDA* over ~2000-40000
 * state coordinate spaces fast enough to run in a browser.
 */
import type { CubieCube } from "../cube/cubie.js";
import type { Move } from "../moves/types.js";
import { applyMoveToCubie, PHASE1_MOVES, PHASE2_MOVES } from "./cubieMoves.js";
import {
  CORNER_ORIENTATION_STATES,
  CORNER_PERMUTATION_STATES,
  EDGE_ORIENTATION_STATES,
  EDGE_PERMUTATION_8_STATES,
  UD_SLICE_PERMUTATION_STATES,
  UD_SLICE_STATES,
  decodeCornerOrientation,
  decodeCornerPermutation,
  decodeEdgeOrientation,
  decodeEdgePermutation8,
  decodeUdSlice,
  decodeUdSlicePermutation,
  encodeCornerOrientation,
  encodeCornerPermutation,
  encodeEdgeOrientation,
  encodeEdgePermutation8,
  encodeUdSlice,
  encodeUdSlicePermutation,
} from "./coordinates.js";

const IDENTITY_8 = [0, 1, 2, 3, 4, 5, 6, 7];
const IDENTITY_12 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const ZERO_8 = [0, 0, 0, 0, 0, 0, 0, 0];
const ZERO_12 = new Array(12).fill(0);

function buildMoveTable(
  numStates: number,
  moves: readonly Move[],
  buildCubie: (coord: number) => CubieCube,
  extractCoord: (cubie: CubieCube) => number,
): number[][] {
  const table: number[][] = new Array(numStates);
  for (let state = 0; state < numStates; state++) {
    const cubie = buildCubie(state);
    const row: number[] = new Array(moves.length);
    for (let m = 0; m < moves.length; m++) {
      row[m] = extractCoord(applyMoveToCubie(cubie, moves[m]!));
    }
    table[state] = row;
  }
  return table;
}

function memoize<T>(build: () => T): () => T {
  let cached: T | undefined;
  return () => {
    if (cached === undefined) cached = build();
    return cached;
  };
}

export const getCornerOrientationMoveTable = memoize(() =>
  buildMoveTable(
    CORNER_ORIENTATION_STATES,
    PHASE1_MOVES,
    (coord) => ({ cp: IDENTITY_8, co: decodeCornerOrientation(coord), ep: IDENTITY_12, eo: ZERO_12 }),
    (cubie) => encodeCornerOrientation(cubie.co),
  ),
);

export const getEdgeOrientationMoveTable = memoize(() =>
  buildMoveTable(
    EDGE_ORIENTATION_STATES,
    PHASE1_MOVES,
    (coord) => ({ cp: IDENTITY_8, co: ZERO_8, ep: IDENTITY_12, eo: decodeEdgeOrientation(coord) }),
    (cubie) => encodeEdgeOrientation(cubie.eo),
  ),
);

export const getUdSliceMoveTable = memoize(() =>
  buildMoveTable(
    UD_SLICE_STATES,
    PHASE1_MOVES,
    (coord) => ({ cp: IDENTITY_8, co: ZERO_8, ep: decodeUdSlice(coord), eo: ZERO_12 }),
    (cubie) => encodeUdSlice(cubie.ep),
  ),
);

export const getCornerPermutationMoveTable = memoize(() =>
  buildMoveTable(
    CORNER_PERMUTATION_STATES,
    PHASE2_MOVES,
    (coord) => ({ cp: decodeCornerPermutation(coord), co: ZERO_8, ep: IDENTITY_12, eo: ZERO_12 }),
    (cubie) => encodeCornerPermutation(cubie.cp),
  ),
);

export const getEdgePermutation8MoveTable = memoize(() =>
  buildMoveTable(
    EDGE_PERMUTATION_8_STATES,
    PHASE2_MOVES,
    (coord) => ({ cp: IDENTITY_8, co: ZERO_8, ep: decodeEdgePermutation8(coord), eo: ZERO_12 }),
    (cubie) => encodeEdgePermutation8(cubie.ep),
  ),
);

export const getUdSlicePermutationMoveTable = memoize(() =>
  buildMoveTable(
    UD_SLICE_PERMUTATION_STATES,
    PHASE2_MOVES,
    (coord) => ({ cp: IDENTITY_8, co: ZERO_8, ep: decodeUdSlicePermutation(coord), eo: ZERO_12 }),
    (cubie) => encodeUdSlicePermutation(cubie.ep),
  ),
);
