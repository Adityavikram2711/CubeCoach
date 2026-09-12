import type { FaceletCube } from "@cube-coach/cube-engine";
import { API_BASE, parseJsonOrThrow } from "./http.js";

export type AlgorithmType = "OLL" | "PLL" | "F2L";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface AlgorithmCaseDto {
  caseId: string;
  type: AlgorithmType;
  number: number;
  name: string;
  category?: string;
  setup?: string;
  recognition: string;
  algorithm: string;
  alternatives: string[];
  fingerTricks: string;
  notes: string;
  difficulty: Difficulty;
  videoUrl?: string;
  scrambledState: FaceletCube;
}

export interface ListAlgorithmsParams {
  type?: AlgorithmType;
  difficulty?: Difficulty;
  category?: string;
  search?: string;
}

export async function fetchAlgorithms(params: ListAlgorithmsParams = {}): Promise<AlgorithmCaseDto[]> {
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);
  if (params.difficulty) query.set("difficulty", params.difficulty);
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);

  const qs = query.toString();
  const res = await fetch(`${API_BASE}/algorithms${qs ? `?${qs}` : ""}`);
  const body = await parseJsonOrThrow(res);
  return body.cases as AlgorithmCaseDto[];
}

export async function fetchAlgorithmById(id: string): Promise<AlgorithmCaseDto> {
  const res = await fetch(`${API_BASE}/algorithms/${encodeURIComponent(id)}`);
  const body = await parseJsonOrThrow(res);
  return body.case as AlgorithmCaseDto;
}
