import { CheckCircle2, XCircle } from "lucide-react";
import { Cube3D } from "../../three/Cube3D.js";
import { getEffectiveAlgorithm } from "../algorithms/effectiveAlgorithm.js";
import type { CaseProgress } from "./types.js";
import type { FeedbackState, PresentingState } from "./sessionReducer.js";

interface CaseRecognitionViewProps {
  state: PresentingState | FeedbackState;
  progress: CaseProgress | undefined;
  onAnswer: (caseId: string) => void;
  onNext: () => void;
}

export function CaseRecognitionView({ state, progress, onAnswer, onNext }: CaseRecognitionViewProps) {
  const isFeedback = state.phase === "feedback";
  const choices = state.choices ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900" style={{ height: 260 }}>
        <Cube3D cube={state.current.scrambledState} />
      </div>

      <h2 className="text-center text-lg font-semibold text-slate-100">What case is this?</h2>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="Case choices">
        {choices.map((choice) => {
          const isCorrectChoice = choice.caseId === state.current.caseId;
          const isSelected = isFeedback && state.selectedCaseId === choice.caseId;
          let stateClass = "border-slate-700 text-slate-200 hover:border-slate-500";
          if (isFeedback && isCorrectChoice) stateClass = "border-emerald-500 bg-emerald-950/40 text-emerald-200";
          else if (isFeedback && isSelected) stateClass = "border-rose-500 bg-rose-950/40 text-rose-200";

          return (
            <button
              key={choice.caseId}
              type="button"
              disabled={isFeedback}
              onClick={() => onAnswer(choice.caseId)}
              className={`flex items-center justify-between rounded-md border px-4 py-3 text-sm font-medium transition-colors disabled:cursor-default ${stateClass}`}
            >
              {choice.label}
              {isFeedback && isCorrectChoice && <CheckCircle2 size={16} />}
              {isFeedback && isSelected && !isCorrectChoice && <XCircle size={16} />}
            </button>
          );
        })}
      </div>

      {isFeedback && (
        <div aria-live="polite" className="flex flex-col gap-3">
          <div
            className={`flex items-center gap-2 rounded-md border p-3 text-sm font-semibold ${
              state.lastCorrect ? "border-emerald-900/60 bg-emerald-950/40 text-emerald-300" : "border-rose-900/60 bg-rose-950/40 text-rose-300"
            }`}
          >
            {state.lastCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {state.lastCorrect ? "Correct" : "Incorrect"}
          </div>

          <div className="rounded-md border border-slate-800 bg-slate-900 p-3">
            <h3 className="font-semibold text-slate-100">{state.current.name}</h3>
            <p className="mt-1 text-sm text-slate-400">{state.current.recognition}</p>
            <div className="mt-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-sky-400">Official CubeCoach Algorithm</span>
              <code className="mt-1 block rounded bg-slate-950 px-2 py-1 font-mono text-sm text-sky-200">{state.current.algorithm}</code>
            </div>
            {progress?.preferredAlgorithm && (
              <div className="mt-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-400">Your Personal Algorithm</span>
                <code className="mt-1 block rounded bg-slate-950 px-2 py-1 font-mono text-sm text-amber-200">
                  {getEffectiveAlgorithm(state.current.algorithm, progress.preferredAlgorithm)}
                </code>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onNext}
            className="self-start rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
          >
            Next Case
          </button>
        </div>
      )}
    </div>
  );
}
