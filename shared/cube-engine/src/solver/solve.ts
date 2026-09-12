/**
 * The public solver API. Every candidate solution is replayed through the same
 * applyMoves/isSolved functions the rest of the app uses, on a COPY of the original
 * input, before it's ever returned -- an unverified solution is never handed back (see
 * RULE at the bottom of this file). This is the one and only place the two-phase
 * search's output is trusted.
 */
import { applyMoves, isSolved, validateCube, type FaceletCube, type Move } from "@cube-coach/cube-engine";
import { faceletToCubie } from "../cube/conversions.js";
import { simplifyMoves } from "../parser/simplify.js";
import { solvePhase1 } from "./phase1.js";
import { solvePhase2 } from "./phase2.js";

export interface SolverError {
  code: "INVALID_CUBE" | "SOLVER_FAILED";
  message: string;
}

export type SolveResult =
  | {
      success: true;
      moves: Move[];
      moveCount: number;
      verified: true;
      searchTimeMs: number;
    }
  | {
      success: false;
      error: SolverError;
      searchTimeMs: number;
    };

export function solve(cube: FaceletCube): SolveResult {
  const start = performance.now();

  const validation = validateCube(cube);
  if (!validation.valid) {
    return {
      success: false,
      error: {
        code: "INVALID_CUBE",
        message: "The cube configuration is impossible: " + validation.issues.map((i) => i.message).join(" "),
      },
      searchTimeMs: performance.now() - start,
    };
  }

  if (isSolved(cube)) {
    return { success: true, moves: [], moveCount: 0, verified: true, searchTimeMs: performance.now() - start };
  }

  const cubie = faceletToCubie(cube);

  const phase1 = solvePhase1(cubie);
  if (!phase1) {
    return {
      success: false,
      error: { code: "SOLVER_FAILED", message: "Phase 1 search failed to reach the required subgroup." },
      searchTimeMs: performance.now() - start,
    };
  }

  const phase2 = solvePhase2(phase1.resultCubie);
  if (!phase2) {
    return {
      success: false,
      error: { code: "SOLVER_FAILED", message: "Phase 2 search failed to finish the cube." },
      searchTimeMs: performance.now() - start,
    };
  }

  const rawMoves = [...phase1.moves, ...phase2.moves];
  const simplified = simplifyMoves(rawMoves);

  // RULE: never return a solution that hasn't been replayed and verified. Verify the
  // simplified moves (not just the raw search output) -- simplification is a
  // transformation that could in principle have a bug, so it gets checked too, on a
  // fresh copy of the ORIGINAL input cube, independently of anything the search did.
  const replayed = applyMoves(cube, simplified);
  if (!isSolved(replayed)) {
    return {
      success: false,
      error: {
        code: "SOLVER_FAILED",
        message: "The search produced a candidate solution that failed independent verification.",
      },
      searchTimeMs: performance.now() - start,
    };
  }

  return {
    success: true,
    moves: simplified,
    moveCount: simplified.length,
    verified: true,
    searchTimeMs: performance.now() - start,
  };
}
