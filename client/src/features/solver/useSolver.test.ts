import { createSolvedCube } from "@cube-coach/cube-engine";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSolver } from "./useSolver.js";

/**
 * jsdom doesn't implement real Web Workers, so this fakes just enough of the Worker
 * interface to drive useSolver's own state-machine logic (idle/solving/success/error,
 * and the stale-response guard) -- the actual solving correctness is already covered
 * exhaustively at the engine level (solve.test.ts).
 */
class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  static instances: FakeWorker[] = [];
  posted: unknown[] = [];

  constructor() {
    FakeWorker.instances.push(this);
  }

  postMessage(data: unknown) {
    this.posted.push(data);
  }

  terminate() {}

  respond(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
}

describe("useSolver", () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    vi.stubGlobal("Worker", FakeWorker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts idle", () => {
    const { result } = renderHook(() => useSolver());
    expect(result.current.state).toEqual({ status: "idle" });
  });

  it("transitions to solving, then success", () => {
    const { result } = renderHook(() => useSolver());
    act(() => result.current.solve(createSolvedCube()));
    expect(result.current.state.status).toBe("solving");

    const worker = FakeWorker.instances[0]!;
    const request = worker.posted[0] as { requestId: number };
    act(() =>
      worker.respond({
        type: "success",
        requestId: request.requestId,
        moves: [],
        moveCount: 0,
        verified: true,
        searchTimeMs: 5,
      }),
    );

    expect(result.current.state).toEqual({
      status: "success",
      result: { moves: [], moveCount: 0, verified: true, searchTimeMs: 5 },
    });
  });

  it("transitions to error on a solver error response", () => {
    const { result } = renderHook(() => useSolver());
    act(() => result.current.solve(createSolvedCube()));
    const worker = FakeWorker.instances[0]!;
    const request = worker.posted[0] as { requestId: number };

    act(() =>
      worker.respond({
        type: "error",
        requestId: request.requestId,
        error: { code: "SOLVER_FAILED", message: "boom" },
        searchTimeMs: 1,
      }),
    );

    expect(result.current.state).toEqual({ status: "error", error: { code: "SOLVER_FAILED", message: "boom" } });
  });

  it("ignores a stale response from a superseded request (race-condition guard)", () => {
    const { result } = renderHook(() => useSolver());

    act(() => result.current.solve(createSolvedCube()));
    const worker = FakeWorker.instances[0]!;
    const firstRequest = worker.posted[0] as { requestId: number };

    act(() => result.current.solve(createSolvedCube())); // a second solve supersedes the first
    const secondRequest = worker.posted[1] as { requestId: number };
    expect(secondRequest.requestId).not.toBe(firstRequest.requestId);

    // The stale first response arrives after the second request was already made.
    act(() =>
      worker.respond({
        type: "success",
        requestId: firstRequest.requestId,
        moves: ["R"],
        moveCount: 1,
        verified: true,
        searchTimeMs: 1,
      }),
    );
    expect(result.current.state.status).toBe("solving"); // still waiting on the second request, unaffected

    act(() =>
      worker.respond({
        type: "success",
        requestId: secondRequest.requestId,
        moves: [],
        moveCount: 0,
        verified: true,
        searchTimeMs: 2,
      }),
    );
    expect(result.current.state).toEqual({
      status: "success",
      result: { moves: [], moveCount: 0, verified: true, searchTimeMs: 2 },
    });
  });

  it("reset returns to idle and invalidates any in-flight request", () => {
    const { result } = renderHook(() => useSolver());
    act(() => result.current.solve(createSolvedCube()));
    const worker = FakeWorker.instances[0]!;
    const request = worker.posted[0] as { requestId: number };

    act(() => result.current.reset());
    expect(result.current.state).toEqual({ status: "idle" });

    act(() =>
      worker.respond({
        type: "success",
        requestId: request.requestId,
        moves: [],
        moveCount: 0,
        verified: true,
        searchTimeMs: 1,
      }),
    );
    expect(result.current.state).toEqual({ status: "idle" }); // stale response after reset is ignored too
  });
});
