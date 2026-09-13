import type { TrainerCase } from "./types.js";
import type { CompleteState } from "./sessionReducer.js";

interface SessionSummaryViewProps {
  state: CompleteState;
  casesById: Map<string, TrainerCase>;
  onPracticeAgain: () => void;
  onTrainWeakCases: () => void;
  onBackToTrainer: () => void;
}

export function SessionSummaryView({ state, casesById, onPracticeAgain, onTrainWeakCases, onBackToTrainer }: SessionSummaryViewProps) {
  const { summary } = state;
  const mostMissedCase = summary.mostMissed ? casesById.get(summary.mostMissed) : undefined;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Session Complete</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryStat label="Practiced" value={String(summary.total)} />
        <SummaryStat label="Correct" value={String(summary.correct)} />
        <SummaryStat label="Incorrect" value={String(summary.incorrect)} />
        <SummaryStat label="Accuracy" value={`${summary.accuracy}%`} />
      </div>

      {summary.weakCases.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Weak Cases Encountered</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {summary.weakCases.map((caseId) => {
              const c = casesById.get(caseId);
              return (
                <li key={caseId} className="rounded-full border border-rose-900 bg-rose-950/40 px-3 py-1 text-sm text-rose-300">
                  {c?.name ?? caseId}
                </li>
              );
            })}
          </ul>
          {mostMissedCase && (
            <p className="mt-2 text-sm text-slate-400">
              Most missed: <span className="font-semibold text-slate-200">{mostMissedCase.name}</span>
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onPracticeAgain} className="cc-btn-primary">
          Practice Again
        </button>
        {summary.weakCases.length > 0 && (
          <button type="button" onClick={onTrainWeakCases} className="cc-btn-secondary">
            Train Weak Cases
          </button>
        )}
        <button type="button" onClick={onBackToTrainer} className="cc-btn-secondary">
          Back to Trainer
        </button>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="cc-card p-4 text-center">
      <div className="text-xl font-bold text-slate-100">{value}</div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}
