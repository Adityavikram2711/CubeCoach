import type { AlgorithmCaseDto, AlgorithmType, Difficulty } from "../../api/algorithms.js";
import type { UserAlgorithmRecord } from "../../api/userAlgorithms.js";

/**
 * A trainable case is exactly a Phase 7 verified Algorithm record -- the trainer never
 * builds its own cube-state representation. `scrambledState` and `algorithm` come
 * straight from the canonical /api/algorithms data, so a case shown in the trainer and
 * the same case shown in the Algorithm Library are always the identical record, in the
 * identical orientation (U=white, F=green, the shared cube engine's fixed color
 * scheme) -- there is no separate rotation step anywhere in this module.
 */
export type TrainerCase = AlgorithmCaseDto;

export { type AlgorithmType, type Difficulty };

/** The subset of a UserAlgorithm record the trainer's pure logic actually needs. */
export interface CaseProgress {
  favorite: boolean;
  learned: boolean;
  practiceCount: number;
  successCount: number;
  lastPracticedAt?: string;
  preferredAlgorithm?: string;
  personalAlternatives: string[];
}

/** Keyed by algorithmId (caseId). A case with no entry is treated as unlearned/never-practiced. */
export type ProgressMap = Record<string, CaseProgress>;

export function toProgressMap(records: UserAlgorithmRecord[]): ProgressMap {
  const map: ProgressMap = {};
  for (const r of records) {
    map[r.algorithmId] = {
      favorite: r.favorite,
      learned: r.learned,
      practiceCount: r.practiceCount,
      successCount: r.successCount,
      lastPracticedAt: r.lastPracticedAt,
      preferredAlgorithm: r.preferredAlgorithm,
      personalAlternatives: r.personalAlternatives,
    };
  }
  return map;
}

export type CaseFilter = "all" | "favorites" | "learned" | "unlearned" | "weak";

export type TrainerMode = "recognition" | "recall";

export interface SessionConfig {
  types: AlgorithmType[];
  filter: CaseFilter;
  /** A finite session length, or "endless" to keep going until the user stops. */
  length: number | "endless";
  mode: TrainerMode;
}

export interface Choice {
  caseId: string;
  label: string;
}

export interface AttemptResult {
  caseId: string;
  type: AlgorithmType;
  correct: boolean;
}

export interface SessionSummary {
  total: number;
  correct: number;
  incorrect: number;
  /** 0-100, rounded. 0 when total is 0. */
  accuracy: number;
  /** Distinct caseIds missed at least once during the session. */
  weakCases: string[];
  /** The caseId missed most often, or null if nothing was missed. */
  mostMissed: string | null;
}

export interface ProgressSummary {
  total: number;
  learned: number;
  practiced: number;
  /** 0-100 average success rate across practiced cases, or null if nothing has been practiced yet. */
  averageSuccessRate: number | null;
}

/** A source of numbers in [0, 1) -- injected everywhere so trainer logic is deterministic in tests. */
export type RandomFn = () => number;
