import type { AlgorithmType } from "../../api/algorithms.js";
import { getProgressSummary } from "./sessionSummary.js";
import type { ProgressMap, TrainerCase } from "./types.js";

interface ProgressSummaryViewProps {
  casesByType: Record<AlgorithmType, TrainerCase[]>;
  progress: ProgressMap;
}

const TYPES: AlgorithmType[] = ["OLL", "PLL", "F2L"];

export function ProgressSummaryView({ casesByType, progress }: ProgressSummaryViewProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {TYPES.map((type) => {
        const cases = casesByType[type] ?? [];
        const summary = getProgressSummary(cases, progress);
        return (
          <div key={type} className="cc-card p-3">
            <h3 className="text-sm font-semibold text-slate-200">{type}</h3>
            <p className="mt-1 text-sm text-slate-400">
              {summary.learned} / {summary.total} learned
            </p>
            <p className="text-sm text-slate-400">
              {summary.practiced} / {summary.total} practiced
            </p>
            <p className="text-sm text-slate-400">
              {summary.averageSuccessRate === null ? "No attempts yet" : `${summary.averageSuccessRate}% average success`}
            </p>
          </div>
        );
      })}
    </div>
  );
}
