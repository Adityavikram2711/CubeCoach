import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createSolve, deleteSolve, fetchSolves, type CreateSolveInput } from "../../api/solves.js";
import { useAuthStore } from "../../store/authStore.js";
import { calculateFinalTime } from "./timeUtils.js";
import type { SolveRecord } from "./types.js";

/**
 * One unified history interface for both guest and authenticated timing -- the UI
 * never needs to know which one it's talking to. Guest solves live only in this
 * component's React state (gone on refresh, by design: Phase 10's guest-history rule
 * is "temporary," not localStorage-persisted); authenticated solves are fetched from
 * and written through /api/solves via TanStack Query, keyed by userId so logging out
 * and logging in as someone else never shows stale data (same pattern as Phase 8/9's
 * personalization queries).
 */
export function useSolveHistory() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  const isAuthenticated = Boolean(token && userId);
  const queryClient = useQueryClient();

  const [guestSolves, setGuestSolves] = useState<SolveRecord[]>([]);

  const query = useQuery({
    queryKey: ["solves", userId],
    queryFn: () => fetchSolves(token!),
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateSolveInput) => createSolve(token!, input),
    onSuccess: (solve) => {
      queryClient.setQueryData<SolveRecord[]>(["solves", userId], (prev) => [solve, ...(prev ?? [])]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSolve(token!, id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<SolveRecord[]>(["solves", userId], (prev) => (prev ?? []).filter((s) => s.id !== id));
    },
  });

  const solves = isAuthenticated ? (query.data ?? []) : guestSolves;

  const addSolve = async (input: CreateSolveInput): Promise<void> => {
    if (isAuthenticated) {
      await createMutation.mutateAsync(input);
    } else {
      const record: SolveRecord = {
        id: crypto.randomUUID(),
        scramble: input.scramble,
        rawTimeMs: input.rawTimeMs,
        penalty: input.penalty,
        finalTimeMs: calculateFinalTime(input.rawTimeMs, input.penalty),
        solvedAt: input.solvedAt,
      };
      setGuestSolves((prev) => [record, ...prev]);
    }
  };

  const removeSolve = async (id: string): Promise<void> => {
    if (isAuthenticated) {
      await deleteMutation.mutateAsync(id);
    } else {
      setGuestSolves((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return {
    solves,
    isLoading: isAuthenticated && query.isLoading,
    isAuthenticated,
    isSaving: createMutation.isPending,
    addSolve,
    removeSolve,
  };
}
