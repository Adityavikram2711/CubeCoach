/**
 * Fast cubie-level move application.
 *
 * A move's effect on the cubie level -- which slot each piece moves to, and what
 * orientation delta it picks up -- is the same fixed permutation+delta no matter what
 * state the cube started in (moves act on the cube group by left-multiplication). So
 * rather than deriving that permutation+delta by hand (risking a second, independently-
 * fallible geometric derivation alongside Phase 2's), we derive it EXACTLY ONCE per base
 * move by applying it to the *solved* cube through the already-proven facelet engine
 * (cubieToFacelet -> applyMove -> faceletToCubie), read off the resulting permutation and
 * orientation deltas, and cache them. Every other call just composes arrays (cheap),
 * instead of paying the ~100us facelet round-trip cost per call -- see
 * cubieMoves.test.ts, which cross-checks the fast path against the slow path directly
 * for hundreds of random states and confirms they always agree.
 */
import { cubieToFacelet, faceletToCubie } from "../cube/conversions.js";
import type { CubieCube } from "../cube/cubie.js";
import { createSolvedCubieCube } from "../cube/cubie.js";
import { applyMove } from "../moves/apply.js";
import { parseMoveToken, type Move } from "../moves/types.js";
import type { BaseMoveName } from "../moves/definitions.js";

/**
 * The fast path below only covers the 6 outer-face moves -- the only ones the solver
 * needs. The "derive once from solved, then compose additively" trick relies on the
 * move never touching a center (so the co/eo reference frame -- which faceletToCubie
 * reads from the *current* centers -- never shifts): true for U/D/R/L/F/B (and, not
 * used here, M/E/S/wide), but NOT for x/y/z, which rotate the centers themselves and
 * so don't compose as a fixed permutation+delta independent of starting state.
 */
const SUPPORTED_BASES = new Set<BaseMoveName>(["U", "D", "L", "R", "F", "B"]);

/** Only ever used to derive a base move's definition once, and in tests as the trusted reference. */
export function applyMoveToCubieSlow(cubie: CubieCube, move: Move): CubieCube {
  const facelets = cubieToFacelet(cubie);
  const moved = applyMove(facelets, move);
  return faceletToCubie(moved);
}

interface CubieMoveDefinition {
  /** cornerPerm[slot] = which slot's corner moves into `slot`. */
  cornerPerm: number[];
  /** Orientation delta added (mod 3) to whatever corner moves into `slot`. */
  cornerOrientationDelta: number[];
  edgePerm: number[];
  /** Orientation delta added (mod 2) to whatever edge moves into `slot`. */
  edgeOrientationDelta: number[];
}

const baseMoveDefinitionCache = new Map<BaseMoveName, CubieMoveDefinition>();

function getBaseMoveDefinition(base: BaseMoveName): CubieMoveDefinition {
  const cached = baseMoveDefinitionCache.get(base);
  if (cached) return cached;

  const solved = createSolvedCubieCube();
  const result = applyMoveToCubieSlow(solved, base);
  // Starting from solved (cp[i]=i, co[i]=0), result.cp[slot] IS the source slot (since
  // the piece now at `slot` was, before the move, at slot number result.cp[slot]), and
  // result.co[slot] IS the pure orientation delta this move contributes at `slot` (since
  // the piece's own prior orientation was 0).
  const definition: CubieMoveDefinition = {
    cornerPerm: result.cp,
    cornerOrientationDelta: result.co,
    edgePerm: result.ep,
    edgeOrientationDelta: result.eo,
  };
  baseMoveDefinitionCache.set(base, definition);
  return definition;
}

function composeQuarterTurn(cubie: CubieCube, def: CubieMoveDefinition): CubieCube {
  const cp = new Array(8);
  const co = new Array(8);
  for (let slot = 0; slot < 8; slot++) {
    const source = def.cornerPerm[slot]!;
    cp[slot] = cubie.cp[source];
    co[slot] = (cubie.co[source]! + def.cornerOrientationDelta[slot]!) % 3;
  }
  const ep = new Array(12);
  const eo = new Array(12);
  for (let slot = 0; slot < 12; slot++) {
    const source = def.edgePerm[slot]!;
    ep[slot] = cubie.ep[source];
    eo[slot] = (cubie.eo[source]! + def.edgeOrientationDelta[slot]!) % 2;
  }
  return { cp, co, ep, eo };
}

export function applyMoveToCubie(cubie: CubieCube, move: Move): CubieCube {
  const parsed = parseMoveToken(move);
  if (!parsed) throw new Error(`Invalid move: "${move}" is not a recognized move token.`);
  if (!SUPPORTED_BASES.has(parsed.base)) {
    throw new Error(
      `applyMoveToCubie only supports the 6 outer-face moves (U/D/L/R/F/B); got "${move}". ` +
        "The solver's move sets (PHASE1_MOVES/PHASE2_MOVES) never need anything else.",
    );
  }
  const def = getBaseMoveDefinition(parsed.base);
  let result = cubie;
  for (let i = 0; i < parsed.turns; i++) result = composeQuarterTurn(result, def);
  return result;
}

/**
 * The two-phase algorithm's standard generator sets. Phase 1 uses all 18 quarter/half
 * turns of the 6 outer faces; phase 2 restricts L/R/F/B to half turns only (a quarter
 * turn of those faces would move a slice edge out of the UD-slice, undoing phase 1's
 * work), keeping U/D fully free since they never touch the slice at all.
 */
export const PHASE1_MOVES: Move[] = [
  "U", "U2", "U'",
  "D", "D2", "D'",
  "R", "R2", "R'",
  "L", "L2", "L'",
  "F", "F2", "F'",
  "B", "B2", "B'",
];

export const PHASE2_MOVES: Move[] = [
  "U", "U2", "U'",
  "D", "D2", "D'",
  "R2", "L2", "F2", "B2",
];
