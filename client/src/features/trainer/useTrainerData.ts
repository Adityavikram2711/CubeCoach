import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchAlgorithms, type AlgorithmType } from "../../api/algorithms.js";
import { recordPractice } from "../../api/userAlgorithms.js";
import { useUserAlgorithmsList } from "../algorithms/useUserAlgorithm.js";
import { useAuthStore } from "../../store/authStore.js";
import { toProgressMap, type ProgressMap, type TrainerCase } from "./types.js";

/** Fetches the canonical Algorithm records for one or more types in parallel, reusing the exact same /api/algorithms endpoint the Algorithm Library uses -- one source of truth, no trainer-specific dataset. */
export function useTrainerCases(types: AlgorithmType[]) {
  const results = useQueries({
    queries: types.map((type) => ({
      queryKey: ["algorithms", { type }],
      queryFn: () => fetchAlgorithms({ type }),
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);
  const cases = useMemo<TrainerCase[]>(() => results.flatMap((r) => r.data ?? []), [results]);

  return { cases, isLoading, isError };
}

/** Empty (guest) progress map when signed out -- every case then behaves as unlearned/never-practiced, which is the correct default. Reuses Phase 8's useUserAlgorithmsList -- no second personalization fetch path. */
export function useTrainerProgress(): { progress: ProgressMap; isLoading: boolean } {
  const query = useUserAlgorithmsList();
  const progress = useMemo(() => toProgressMap(query.data ?? []), [query.data]);
  return { progress, isLoading: query.isLoading && query.fetchStatus !== "idle" };
}

/** No-op for guests (recording requires an account) -- the trainer still tracks the session's own attempts locally regardless, see sessionReducer. */
export function useRecordPractice() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ algorithmId, success }: { algorithmId: string; success: boolean }) => recordPractice(token!, algorithmId, success),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAlgorithms", userId] });
    },
  });

  const isAuthenticated = Boolean(token && userId);
  return {
    isAuthenticated,
    record: (algorithmId: string, success: boolean) => {
      if (!isAuthenticated) return;
      mutation.mutate({ algorithmId, success });
    },
  };
}
