import { calculateSuccessRate } from "./caseSelection.js";
import type { AttemptResult, ProgressMap, ProgressSummary, SessionSummary, TrainerCase } from "./types.js";

/** Every number here comes directly from the session's own recorded attempts -- never estimated or displayed before the session actually completes. */
export function getSessionSummary(attempts: AttemptResult[]): SessionSummary {
  const total = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  const incorrect = total - correct;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);

  const missCounts = new Map<string, number>();
  for (const a of attempts) {
    if (!a.correct) missCounts.set(a.caseId, (missCounts.get(a.caseId) ?? 0) + 1);
  }
  const weakCases = Array.from(missCounts.keys());
  let mostMissed: string | null = null;
  let mostMissedCount = 0;
  for (const [caseId, count] of missCounts) {
    if (count > mostMissedCount) {
      mostMissed = caseId;
      mostMissedCount = count;
    }
  }

  return { total, correct, incorrect, accuracy, weakCases, mostMissed };
}

/** Progress across a whole case set (e.g. all 57 OLL cases), for the trainer dashboard / profile. */
export function getProgressSummary(cases: TrainerCase[], progress: ProgressMap): ProgressSummary {
  const total = cases.length;
  let learned = 0;
  let practiced = 0;
  let rateSum = 0;
  let ratedCount = 0;

  for (const c of cases) {
    const p = progress[c.caseId];
    if (p?.learned) learned++;
    const rate = calculateSuccessRate(p);
    if (rate !== undefined) {
      practiced++;
      rateSum += rate;
      ratedCount++;
    }
  }

  const averageSuccessRate = ratedCount === 0 ? null : Math.round((rateSum / ratedCount) * 100);
  return { total, learned, practiced, averageSuccessRate };
}
