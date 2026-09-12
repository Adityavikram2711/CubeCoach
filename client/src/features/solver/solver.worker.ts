/**
 * Runs the shared cube-engine solver off the main thread so the React UI stays
 * responsive during the search. Receives and sends only plain, structured-cloneable
 * data (a facelet color array in, a move list or error out) -- no DOM access, no React
 * objects, nothing that only makes sense on the main thread.
 */
import { solve, type FaceletCube } from "@cube-coach/cube-engine";

export interface SolveWorkerRequest {
  type: "solve";
  requestId: number;
  cube: FaceletCube;
}

export type SolveWorkerResponse =
  | {
      type: "success";
      requestId: number;
      moves: string[];
      moveCount: number;
      verified: true;
      searchTimeMs: number;
    }
  | {
      type: "error";
      requestId: number;
      error: { code: string; message: string };
      searchTimeMs: number;
    };

self.onmessage = (event: MessageEvent<SolveWorkerRequest>) => {
  const { requestId, cube } = event.data;

  try {
    const result = solve(cube);
    const response: SolveWorkerResponse = result.success
      ? {
          type: "success",
          requestId,
          moves: result.moves,
          moveCount: result.moveCount,
          verified: result.verified,
          searchTimeMs: result.searchTimeMs,
        }
      : { type: "error", requestId, error: result.error, searchTimeMs: result.searchTimeMs };
    self.postMessage(response);
  } catch (err) {
    const response: SolveWorkerResponse = {
      type: "error",
      requestId,
      error: {
        code: "SOLVER_FAILED",
        message: err instanceof Error ? err.message : "The solver crashed unexpectedly.",
      },
      searchTimeMs: 0,
    };
    self.postMessage(response);
  }
};
