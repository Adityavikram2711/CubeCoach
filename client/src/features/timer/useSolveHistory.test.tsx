import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as solvesApi from "../../api/solves.js";
import { useAuthStore } from "../../store/authStore.js";
import { useSolveHistory } from "./useSolveHistory.js";

vi.mock("../../api/solves.js");

// Created once per test (not inside the wrapper component, which re-renders on every
// state change) -- a fresh QueryClient per render would silently discard the cache
// between a mutation's setQueryData and the next read, making every mutation look
// like it "didn't happen" even though it did.
let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

function resetAuth() {
  useAuthStore.setState({ token: null, user: null, status: "idle", error: null });
}

const INPUT = { scramble: "R U R' U'", rawTimeMs: 12470, penalty: "NONE" as const, solvedAt: new Date().toISOString() };

describe("useSolveHistory (guest)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuth();
  });

  it("starts with no solves and isAuthenticated false", () => {
    const { result } = renderHook(() => useSolveHistory(), { wrapper });
    expect(result.current.solves).toEqual([]);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("addSolve stores the solve locally without calling the API", async () => {
    const { result } = renderHook(() => useSolveHistory(), { wrapper });
    await act(async () => {
      await result.current.addSolve(INPUT);
    });
    expect(result.current.solves).toHaveLength(1);
    expect(result.current.solves[0]!.finalTimeMs).toBe(12470);
    expect(solvesApi.createSolve).not.toHaveBeenCalled();
  });

  it("newest guest solve appears first", async () => {
    const { result } = renderHook(() => useSolveHistory(), { wrapper });
    await act(async () => {
      await result.current.addSolve({ ...INPUT, rawTimeMs: 10000 });
    });
    await act(async () => {
      await result.current.addSolve({ ...INPUT, rawTimeMs: 9000 });
    });
    expect(result.current.solves[0]!.rawTimeMs).toBe(9000);
    expect(result.current.solves[1]!.rawTimeMs).toBe(10000);
  });

  it("removeSolve deletes locally without calling the API", async () => {
    const { result } = renderHook(() => useSolveHistory(), { wrapper });
    await act(async () => {
      await result.current.addSolve(INPUT);
    });
    const id = result.current.solves[0]!.id;
    await act(async () => {
      await result.current.removeSolve(id);
    });
    expect(result.current.solves).toEqual([]);
    expect(solvesApi.deleteSolve).not.toHaveBeenCalled();
  });
});

describe("useSolveHistory (authenticated)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ token: "tok", user: { id: "u1", username: "a", email: "a@example.com", createdAt: "", updatedAt: "" }, status: "authenticated" });
  });

  it("fetches solves from the server", async () => {
    vi.mocked(solvesApi.fetchSolves).mockResolvedValue([{ id: "s1", ...INPUT, finalTimeMs: 12470 }]);
    const { result } = renderHook(() => useSolveHistory(), { wrapper });
    await waitFor(() => expect(result.current.solves).toHaveLength(1));
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("addSolve calls the API and prepends the returned record", async () => {
    vi.mocked(solvesApi.fetchSolves).mockResolvedValue([]);
    vi.mocked(solvesApi.createSolve).mockResolvedValue({ id: "new1", ...INPUT, finalTimeMs: 12470 });
    const { result } = renderHook(() => useSolveHistory(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addSolve(INPUT);
    });

    expect(solvesApi.createSolve).toHaveBeenCalledWith("tok", INPUT);
    await waitFor(() => expect(result.current.solves[0]?.id).toBe("new1"));
  });

  it("removeSolve calls the API and removes the record from the cache", async () => {
    vi.mocked(solvesApi.fetchSolves).mockResolvedValue([{ id: "s1", ...INPUT, finalTimeMs: 12470 }]);
    vi.mocked(solvesApi.deleteSolve).mockResolvedValue(undefined);
    const { result } = renderHook(() => useSolveHistory(), { wrapper });
    await waitFor(() => expect(result.current.solves).toHaveLength(1));

    await act(async () => {
      await result.current.removeSolve("s1");
    });

    expect(solvesApi.deleteSolve).toHaveBeenCalledWith("tok", "s1");
    await waitFor(() => expect(result.current.solves).toEqual([]));
  });
});
