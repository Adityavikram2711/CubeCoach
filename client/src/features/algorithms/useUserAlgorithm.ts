import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteUserAlgorithm,
  fetchUserAlgorithm,
  fetchUserAlgorithms,
  toggleFavorite,
  toggleLearned,
  upsertUserAlgorithm,
  type UpsertUserAlgorithmInput,
} from "../../api/userAlgorithms.js";
import { useAuthStore } from "../../store/authStore.js";

function queryKey(algorithmId: string, userId: string | undefined) {
  return ["userAlgorithm", userId, algorithmId] as const;
}

/** Guests always get `data: null` and never issue a request -- personalization is an authenticated-only concept. */
export function useUserAlgorithm(algorithmId: string) {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: queryKey(algorithmId, userId),
    queryFn: () => fetchUserAlgorithm(token!, algorithmId),
    enabled: Boolean(token && userId),
  });
}

export function useUpsertUserAlgorithm(algorithmId: string) {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertUserAlgorithmInput) => upsertUserAlgorithm(token!, algorithmId, input),
    onSuccess: (record) => {
      queryClient.setQueryData(queryKey(algorithmId, userId), record);
    },
  });
}

export function useDeleteUserAlgorithm(algorithmId: string) {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteUserAlgorithm(token!, algorithmId),
    onSuccess: () => {
      queryClient.setQueryData(queryKey(algorithmId, userId), null);
    },
  });
}

export function useToggleFavorite(algorithmId: string) {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const key = queryKey(algorithmId, userId);

  return useMutation({
    mutationFn: () => toggleFavorite(token!, algorithmId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (current: any) => (current ? { ...current, favorite: !current.favorite } : current));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: (record) => {
      queryClient.setQueryData(key, record);
    },
  });
}

export function useToggleLearned(algorithmId: string) {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const key = queryKey(algorithmId, userId);

  return useMutation({
    mutationFn: () => toggleLearned(token!, algorithmId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (current: any) => (current ? { ...current, learned: !current.learned } : current));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: (record) => {
      queryClient.setQueryData(key, record);
    },
  });
}

export function useUserAlgorithmsList() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ["userAlgorithms", userId],
    queryFn: () => fetchUserAlgorithms(token!),
    enabled: Boolean(token && userId),
  });
}
