import type { CaseFilter, CaseProgress, Choice, ProgressMap, RandomFn, TrainerCase } from "./types.js";

/**
 * successRate is undefined (not 0) for a never-practiced case -- 0 would wrongly imply
 * "practiced and failed every time," which is a different, worse signal than "unknown."
 */
export function calculateSuccessRate(progress: CaseProgress | undefined): number | undefined {
  if (!progress || progress.practiceCount === 0) return undefined;
  return progress.successCount / progress.practiceCount;
}

const WEAK_SUCCESS_RATE_THRESHOLD = 0.7;

/**
 * A case with no UserAlgorithm record at all counts as unlearned (Phase 8/9 both rely
 * on this -- creating 102 placeholder documents just to represent "false" would be
 * pure waste).
 */
export function filterCases(cases: TrainerCase[], progress: ProgressMap, filter: CaseFilter): TrainerCase[] {
  switch (filter) {
    case "all":
      return cases;
    case "favorites":
      return cases.filter((c) => progress[c.caseId]?.favorite === true);
    case "learned":
      return cases.filter((c) => progress[c.caseId]?.learned === true);
    case "unlearned":
      return cases.filter((c) => progress[c.caseId]?.learned !== true);
    case "weak":
      // "Weak" means "tried and struggling," not "never tried" -- a case that's never
      // been attempted isn't weak yet, it's just unknown (the weighting model below is
      // what surfaces never-tried cases in normal "All Cases" practice).
      return cases.filter((c) => {
        const rate = calculateSuccessRate(progress[c.caseId]);
        return rate !== undefined && rate < WEAK_SUCCESS_RATE_THRESHOLD;
      });
  }
}

/**
 * Explainable, deterministic priority weight for how often a case should come up in
 * weighted random practice -- higher weight = picked more often. Never a machine
 * learning model, just: never-practiced cases matter most, then it scales inversely
 * with success rate, favorites get a small nudge, and already-learned cases are
 * strongly deprioritized (but never fully excluded, via the floor at the end) so they
 * still occasionally resurface for review.
 *
 *   never practiced        -> 100 (maximum)
 *   practiced, 0% success   -> 100
 *   practiced, 100% success -> 0, floored to 1
 *   learned                 -> whatever the above produces, x0.3
 *   favorite                -> whatever the above produces, x1.2
 */
export function calculateWeight(progress: CaseProgress | undefined): number {
  const rate = calculateSuccessRate(progress);
  let weight = rate === undefined ? 100 : (1 - rate) * 100;
  if (progress?.learned) weight *= 0.3;
  if (progress?.favorite) weight *= 1.2;
  return Math.max(weight, 1);
}

function weightedIndex(weights: number[], random: RandomFn): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return Math.floor(random() * weights.length);
  let r = random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

/**
 * Picks the next case from `pool`. Avoids repeating `excludeCaseId` back-to-back
 * whenever an alternative exists (with only one case available, repeating it is the
 * only option, which is the correct/expected degenerate behavior, not a bug).
 * Weighted by calculateWeight() when `weighted` is true; uniform random otherwise.
 */
export function selectNextCase(
  pool: TrainerCase[],
  progress: ProgressMap,
  excludeCaseId: string | null,
  random: RandomFn,
  weighted: boolean,
): TrainerCase | null {
  if (pool.length === 0) return null;

  let candidates = pool;
  if (excludeCaseId !== null && pool.length > 1) {
    const withoutLast = pool.filter((c) => c.caseId !== excludeCaseId);
    if (withoutLast.length > 0) candidates = withoutLast;
  }

  if (!weighted) {
    return candidates[Math.floor(random() * candidates.length)]!;
  }

  const weights = candidates.map((c) => calculateWeight(progress[c.caseId]));
  return candidates[weightedIndex(weights, random)]!;
}

/** Builds a finite sequence of `length` cases (for "endless" sessions, call selectNextCase directly, one at a time, instead). */
export function buildSession(pool: TrainerCase[], progress: ProgressMap, length: number, random: RandomFn, weighted = true): TrainerCase[] {
  const session: TrainerCase[] = [];
  let lastCaseId: string | null = null;
  for (let i = 0; i < length && pool.length > 0; i++) {
    const next = selectNextCase(pool, progress, lastCaseId, random, weighted);
    if (!next) break;
    session.push(next);
    lastCaseId = next.caseId;
  }
  return session;
}

function shuffle<T>(items: T[], random: RandomFn): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/**
 * Multiple-choice options for recognition mode: the correct case plus up to `count - 1`
 * distinct real cases of the same type, in random order. Never invents a case name --
 * every option is a real record's `name`, and the correct answer is tracked by caseId,
 * not by comparing display text.
 */
export function generateChoices(correct: TrainerCase, sameTypePool: TrainerCase[], random: RandomFn, count = 4): Choice[] {
  const distractorPool = sameTypePool.filter((c) => c.caseId !== correct.caseId);
  const shuffledDistractors = shuffle(distractorPool, random);
  const distractors = shuffledDistractors.slice(0, Math.min(count - 1, distractorPool.length));
  const options = shuffle([correct, ...distractors], random);
  return options.map((c) => ({ caseId: c.caseId, label: c.name }));
}
