/**
 * Finds a verified algorithm for an OLL case: starting from a cube with F2L solved and
 * some pattern of last-layer corner/edge orientation, find a sequence of the 18
 * standard moves that orients every last-layer piece while leaving F2L (the 4 D-layer
 * corners and all 8 D-layer/slice edges) completely undisturbed -- exactly the
 * definition of a valid OLL algorithm (the last-layer PERMUTATION is free to change,
 * since PLL fixes that afterward).
 *
 * This is deliberately separate from the runtime solver's phase1 search: phase1's goal
 * additionally requires the UD-slice to end up solved, which is a real constraint for
 * general solving but an unnecessary (and sometimes unreachable within a short budget)
 * extra requirement for OLL generation, where the slice edges are already untouched.
 */
import type { CubieCube } from "../cube/cubie.js";
import { combinationRank, combinationUnrank, encodeCornerOrientation, encodeEdgeOrientation } from "../solver/coordinates.js";
import { applyMoveToCubie, PHASE1_MOVES } from "../solver/cubieMoves.js";
import { getCornerOrientationMoveTable, getEdgeOrientationMoveTable } from "../solver/moveTables.js";
import { AXIS_PARTNER, CANONICAL_FIRST_FACE, faceOf } from "../solver/movePruning.js";
import { buildPruningTable, lookupPruning } from "../solver/pruningTables.js";

const D_LAYER_CORNERS = [4, 5, 6, 7];
const D_LAYER_EDGES = [4, 5, 6, 7, 8, 9, 10, 11];
const CO_STATES = 2187;
const EO_STATES = 2048;
const CORNER_COMBO_STATES = 70; // C(8,4): which 4 of 8 corner slots hold identities 4-7
const EDGE_COMBO_STATES = 495; // C(12,4): which 4 of 12 edge slots hold identities 0-3

/** Which 4 of 8 corner slots currently hold the D-layer piece identities (4,5,6,7), ignoring their internal order/orientation -- a relaxation of "D-layer corners are all home." */
function encodeCornerCombo(cp: readonly number[]): number {
  const members: number[] = [];
  for (let slot = 0; slot < 8; slot++) if (cp[slot]! >= 4) members.push(slot);
  return combinationRank(members);
}

/** Which 4 of 12 edge slots currently hold the U-layer piece identities (0,1,2,3) -- equivalently, the complement holds the 8 D-layer/slice identities. */
function encodeEdgeCombo(ep: readonly number[]): number {
  const members: number[] = [];
  for (let slot = 0; slot < 12; slot++) if (ep[slot]! < 4) members.push(slot);
  return combinationRank(members);
}

const CORNER_COMBO_GOAL = encodeCornerCombo([0, 1, 2, 3, 4, 5, 6, 7]);
const EDGE_COMBO_GOAL = encodeEdgeCombo([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

function buildCoordinateMoveTable(numStates: number, decode: (coord: number) => CubieCube, encode: (cubie: CubieCube) => number): number[][] {
  const table: number[][] = new Array(numStates);
  for (let state = 0; state < numStates; state++) {
    const cubie = decode(state);
    const row: number[] = new Array(PHASE1_MOVES.length);
    for (let m = 0; m < PHASE1_MOVES.length; m++) {
      row[m] = encode(applyMoveToCubie(cubie, PHASE1_MOVES[m]!));
    }
    table[state] = row;
  }
  return table;
}

function decodeCornerCombo(coord: number): CubieCube {
  const dSlots = new Set(combinationUnrank(coord, 4));
  const cp = new Array(8).fill(0);
  let nextD = 4;
  let nextU = 0;
  for (let slot = 0; slot < 8; slot++) cp[slot] = dSlots.has(slot) ? nextD++ : nextU++;
  return { cp, co: new Array(8).fill(0), ep: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], eo: new Array(12).fill(0) };
}

function decodeEdgeCombo(coord: number): CubieCube {
  const uSlots = new Set(combinationUnrank(coord, 4));
  const ep = new Array(12).fill(0);
  let nextU = 0;
  let nextD = 4;
  for (let slot = 0; slot < 12; slot++) ep[slot] = uSlots.has(slot) ? nextU++ : nextD++;
  return { cp: [0, 1, 2, 3, 4, 5, 6, 7], co: new Array(8).fill(0), ep, eo: new Array(12).fill(0) };
}

let coEoDist: Uint8Array | null = null;
function getCoEoDist(): Uint8Array {
  if (!coEoDist) {
    coEoDist = buildPruningTable(CO_STATES, getCornerOrientationMoveTable(), EO_STATES, getEdgeOrientationMoveTable(), 0, 0, PHASE1_MOVES.length);
  }
  return coEoDist;
}

let coCornerComboDist: Uint8Array | null = null;
function getCoCornerComboDist(): Uint8Array {
  if (!coCornerComboDist) {
    const cornerComboTable = buildCoordinateMoveTable(CORNER_COMBO_STATES, decodeCornerCombo, (c) => encodeCornerCombo(c.cp));
    coCornerComboDist = buildPruningTable(
      CO_STATES,
      getCornerOrientationMoveTable(),
      CORNER_COMBO_STATES,
      cornerComboTable,
      0,
      CORNER_COMBO_GOAL,
      PHASE1_MOVES.length,
    );
  }
  return coCornerComboDist;
}

let eoEdgeComboDist: Uint8Array | null = null;
function getEoEdgeComboDist(): Uint8Array {
  if (!eoEdgeComboDist) {
    const edgeComboTable = buildCoordinateMoveTable(EDGE_COMBO_STATES, decodeEdgeCombo, (c) => encodeEdgeCombo(c.ep));
    eoEdgeComboDist = buildPruningTable(
      EO_STATES,
      getEdgeOrientationMoveTable(),
      EDGE_COMBO_STATES,
      edgeComboTable,
      0,
      EDGE_COMBO_GOAL,
      PHASE1_MOVES.length,
    );
  }
  return eoEdgeComboDist;
}

function isOllGoal(cubie: CubieCube): boolean {
  if (!cubie.co.every((c) => c === 0)) return false;
  if (!cubie.eo.every((e) => e === 0)) return false;
  for (const slot of D_LAYER_CORNERS) if (cubie.cp[slot] !== slot) return false;
  for (const slot of D_LAYER_EDGES) if (cubie.ep[slot] !== slot) return false;
  return true;
}

/**
 * Three admissible lower bounds, combined via max() (never sum -- summing independent
 * relaxations double-counts move cost and stops being admissible, which is exactly what
 * went wrong with an earlier D-layer-displacement penalty; max() of several valid lower
 * bounds is always still a valid lower bound):
 *
 *  - coEoDist: distance to (co=0, eo=0), ignoring permutation entirely.
 *  - coCornerComboDist: distance to (co=0, D-layer corner SLOTS correct), ignoring which
 *    of those 4 corners is in which slot and ignoring edges entirely.
 *  - eoEdgeComboDist: distance to (eo=0, D-layer edge SLOTS correct), ignoring internal
 *    order and ignoring corners entirely.
 *
 * Each is a genuine relaxation of the real goal (drop some constraints, keep others), so
 * each is a true lower bound; this is what makes cases like "all four edges flipped,
 * corners already oriented" tractable -- coEoDist alone badly underestimates states
 * reached mid-search where solving orientation has scrambled the D-layer's piece
 * placement, but coCornerComboDist/eoEdgeComboDist catch exactly that.
 */
function heuristic(cubie: CubieCube): number {
  const co = encodeCornerOrientation(cubie.co);
  const eo = encodeEdgeOrientation(cubie.eo);
  const cornerCombo = encodeCornerCombo(cubie.cp);
  const edgeCombo = encodeEdgeCombo(cubie.ep);
  return Math.max(
    lookupPruning(getCoEoDist(), EO_STATES, co, eo),
    lookupPruning(getCoCornerComboDist(), CORNER_COMBO_STATES, co, cornerCombo),
    lookupPruning(getEoEdgeComboDist(), EDGE_COMBO_STATES, eo, edgeCombo),
  );
}

/** Returns a verified move sequence solving the OLL case, or null if none exists within maxDepth. */
export function findOllAlgorithm(caseCubie: CubieCube, maxDepth = 14): string[] | null {
  const path: string[] = [];

  function search(cubie: CubieCube, g: number, bound: number, lastFace: string | null): number {
    const h = heuristic(cubie);
    const f = g + h;
    if (f > bound) return f;
    if (isOllGoal(cubie)) return -1;

    let min = Infinity;
    for (const move of PHASE1_MOVES) {
      const face = faceOf(move);
      if (lastFace !== null) {
        if (face === lastFace) continue;
        if (AXIS_PARTNER[face] === lastFace && !CANONICAL_FIRST_FACE.has(lastFace)) continue;
      }
      const next = applyMoveToCubie(cubie, move);
      path.push(move);
      const t = search(next, g + 1, bound, face);
      if (t === -1) return -1;
      if (t < min) min = t;
      path.pop();
    }
    return min;
  }

  let bound = heuristic(caseCubie);
  while (bound <= maxDepth) {
    const result = search(caseCubie, 0, bound, null);
    if (result === -1) return path.slice();
    if (result === Infinity) return null;
    bound = result;
  }
  return null;
}

export { isOllGoal };

/** For enumerating cases: applies the co/eo relabeling that a real U turn induces (see algorithms generation notes). */
export function rotateOllPattern(co4: number[], eo4: number[]): [number[], number[]] {
  const cubie: CubieCube = {
    cp: [0, 1, 2, 3, 4, 5, 6, 7],
    co: [...co4, 0, 0, 0, 0],
    ep: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    eo: [...eo4, 0, 0, 0, 0, 0, 0, 0, 0],
  };
  const after = applyMoveToCubie(cubie, "U");
  return [after.co.slice(0, 4), after.eo.slice(0, 4)];
}
