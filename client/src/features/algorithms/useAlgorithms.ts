import { useQuery } from "@tanstack/react-query";
import { fetchAlgorithmById, fetchAlgorithms, type ListAlgorithmsParams } from "../../api/algorithms.js";

export function useAlgorithms(params: ListAlgorithmsParams) {
  return useQuery({
    queryKey: ["algorithms", params],
    queryFn: () => fetchAlgorithms(params),
  });
}

export function useAlgorithm(id: string | undefined) {
  return useQuery({
    queryKey: ["algorithm", id],
    queryFn: () => fetchAlgorithmById(id!),
    enabled: id !== undefined,
  });
}
