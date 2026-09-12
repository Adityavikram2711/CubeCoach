import type { FaceletCube, Move } from "@cube-coach/cube-engine";
import { useEffect, useRef, useState } from "react";
import type { SolveWorkerRequest, SolveWorkerResponse } from "./solver.worker.js";

export interface SolverError {
  code: string;
  message: string;
}

export interface SolverSuccess {
  moves: Move[];
  moveCount: number;
  verified: true;
  searchTimeMs: number;
}

/**
 * An explicit state machine (spec-style: idle -> solving -> success, or idle -> solving
 * -> error) instead of a pile of independent booleans, so the UI can never render a
 * contradictory combination (e.g. "solving" and "has a result" at once).
 */
export type SolverState =
  | { status: "idle" }
  | { status: "solving" }
  | { status: "success"; result: SolverSuccess }
  | { status: "error"; error: SolverError };

export interface UseSolver {
  state: SolverState;
  solve: (cube: FaceletCube) => void;
  reset: () => void;
}

/**
 * Owns the solver Web Worker's lifecycle and guards against race conditions: if a new
 * solve() is requested before a previous one's result arrives, the previous request's
 * ID no longer matches the "latest" one, so its (eventually arriving) response is
 * discarded instead of overwriting a newer result -- see the requestId check below.
 */
export function useSolver(): UseSolver {
  const [state, setState] = useState<SolverState>({ status: "idle" });
  const workerRef = useRef<Worker | null>(null);
  const nextRequestIdRef = useRef(0);
  const latestRequestIdRef = useRef(0);

  useEffect(() => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./solver.worker.ts", import.meta.url), { type: "module" });
    } catch {
      setState({
        status: "error",
        error: { code: "WORKER_INIT_FAILED", message: "Could not start the solver. Please reload the page." },
      });
      return;
    }

    worker.onmessage = (event: MessageEvent<SolveWorkerResponse>) => {
      const message = event.data;
      if (message.requestId !== latestRequestIdRef.current) return; // stale response, a newer request superseded it

      if (message.type === "success") {
        setState({
          status: "success",
          result: {
            moves: message.moves,
            moveCount: message.moveCount,
            verified: message.verified,
            searchTimeMs: message.searchTimeMs,
          },
        });
      } else {
        setState({ status: "error", error: message.error });
      }
    };

    worker.onerror = () => {
      setState({
        status: "error",
        error: { code: "WORKER_CRASHED", message: "The solver stopped unexpectedly. Please try again." },
      });
    };

    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const solve = (cube: FaceletCube) => {
    const requestId = ++nextRequestIdRef.current;
    latestRequestIdRef.current = requestId;
    setState({ status: "solving" });
    const request: SolveWorkerRequest = { type: "solve", requestId, cube };
    workerRef.current?.postMessage(request);
  };

  const reset = () => {
    latestRequestIdRef.current = ++nextRequestIdRef.current; // invalidate any in-flight request
    setState({ status: "idle" });
  };

  return { state, solve, reset };
}
