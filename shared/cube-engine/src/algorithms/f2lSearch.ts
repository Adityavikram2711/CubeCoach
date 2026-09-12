/**
 * Finds a verified algorithm for an F2L case: the front-right slot (DFR corner + FR
 * edge, our canonical slot per the spec's own suggestion) needs to go home, while the
 * other 3 F2L slots stay solved. The last layer is free to end up in any state (OLL/PLL
 * handle that afterward) -- exactly the real-world F2L correctness criterion.
 */
import type { CubieCube } from "../cube/cubie.js";
import { applyMoveToCubie, PHASE1_MOVES } from "../solver/cubieMoves.js";
import { AXIS_PARTNER, CANONICAL_FIRST_FACE, faceOf } from "../solver/movePruning.js";

const TARGET_CORNER_SLOT = 4; // DFR
const TARGET_EDGE_SLOT = 8; // FR
const OTHER_CORNER_SLOTS = [5, 6, 7]; // DLF, DBL, DRB
const OTHER_EDGE_SLOTS = [9, 10, 11]; // FL, BR, BL

function isF2lGoal(cubie: CubieCube): boolean {
  if (cubie.cp[TARGET_CORNER_SLOT] !== TARGET_CORNER_SLOT || cubie.co[TARGET_CORNER_SLOT] !== 0) return false;
  if (cubie.ep[TARGET_EDGE_SLOT] !== TARGET_EDGE_SLOT || cubie.eo[TARGET_EDGE_SLOT] !== 0) return false;
  for (const slot of OTHER_CORNER_SLOTS) {
    if (cubie.cp[slot] !== slot || cubie.co[slot] !== 0) return false;
  }
  for (const slot of OTHER_EDGE_SLOTS) {
    if (cubie.ep[slot] !== slot || cubie.eo[slot] !== 0) return false;
  }
  return true;
}

/** Rough, deliberately-not-tight admissible-ish distance: how many of the two target pieces are still out of place, at 3 "big" moves apiece as a loose upper estimate of remaining work avoided -- purely a search accelerant, correctness comes from isF2lGoal + independent verification regardless. */
function heuristic(cubie: CubieCube): number {
  let h = 0;
  if (cubie.cp[TARGET_CORNER_SLOT] !== TARGET_CORNER_SLOT || cubie.co[TARGET_CORNER_SLOT] !== 0) h += 1;
  if (cubie.ep[TARGET_EDGE_SLOT] !== TARGET_EDGE_SLOT || cubie.eo[TARGET_EDGE_SLOT] !== 0) h += 1;
  for (const slot of OTHER_CORNER_SLOTS) if (cubie.cp[slot] !== slot || cubie.co[slot] !== 0) h += 1;
  for (const slot of OTHER_EDGE_SLOTS) if (cubie.ep[slot] !== slot || cubie.eo[slot] !== 0) h += 1;
  return Math.ceil(h / 4);
}

export function findF2lAlgorithm(caseCubie: CubieCube, maxDepth = 10): string[] | null {
  const path: string[] = [];

  function search(cubie: CubieCube, g: number, bound: number, lastFace: string | null): number {
    const h = heuristic(cubie);
    const f = g + h;
    if (f > bound) return f;
    if (isF2lGoal(cubie)) return -1;

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

export { isF2lGoal, TARGET_CORNER_SLOT, TARGET_EDGE_SLOT };
