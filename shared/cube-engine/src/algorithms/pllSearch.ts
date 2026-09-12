/**
 * Finds a verified algorithm for a PLL case by reusing the runtime solver's own,
 * already-exhaustively-tested phase2 search (shared/cube-engine/src/solver/phase2.ts)
 * directly -- not a re-implementation. A PLL case (F2L solved, last layer oriented,
 * some last-layer permutation) is, by construction, exactly a valid phase-2 input
 * (co=0, eo=0, UD-slice already solved since PLL never touches the M-slice edges), so
 * phase2's own IDA* can finish it using only U/D/L2/R2/F2/B2 -- a real, engine-verified
 * solving sequence for that exact case, found with zero new search code.
 */
import type { CubieCube } from "../cube/cubie.js";
import { solvePhase2 } from "../solver/phase2.js";

export function findPllAlgorithm(caseCubie: CubieCube): string[] | null {
  const result = solvePhase2(caseCubie);
  return result ? result.moves : null;
}
