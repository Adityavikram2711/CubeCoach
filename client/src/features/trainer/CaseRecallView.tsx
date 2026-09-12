import { Check, CheckCircle2, X, XCircle } from "lucide-react";
import { AlgorithmPlaybackViewer } from "../algorithms/AlgorithmPlaybackViewer.js";
import { Cube3D } from "../../three/Cube3D.js";
import { getEffectiveAlgorithm } from "../algorithms/effectiveAlgorithm.js";
import type { CaseProgress } from "./types.js";
import type { FeedbackState, PresentingState, RevealedState } from "./sessionReducer.js";

interface CaseRecallViewProps {
  state: PresentingState | RevealedState | FeedbackState;
  progress: CaseProgress | undefined;
  onReveal: () => void;
  onSelfAssess: (correct: boolean) => void;
  onNext: () => void;
}

export function CaseRecallView({ state, progress, onReveal, onSelfAssess, onNext }: CaseRecallViewProps) {
  if (state.phase === "presenting") {
    return (
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900" style={{ height: 260 }}>
          <Cube3D cube={state.current.scrambledState} />
        </div>
        <h2 className="text-center text-lg font-semibold text-slate-100">What algorithm would you use?</h2>
        <p className="text-center text-sm text-slate-400">Take a moment to recall it, then reveal the answer.</p>
        <button
          type="button"
          onClick={onReveal}
          className="self-center rounded-md bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400"
        >
          Reveal Answer
        </button>
      </div>
    );
  }

  const effectiveAlgorithm = getEffectiveAlgorithm(state.current.algorithm, progress?.preferredAlgorithm);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-sky-400">Official CubeCoach Algorithm (Verified)</span>
        <code className="mt-1 block rounded bg-slate-950 px-2 py-1 font-mono text-sm text-sky-200">{state.current.algorithm}</code>
      </div>

      {progress?.preferredAlgorithm && (
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-400">Your Personal Algorithm</span>
          <code className="mt-1 block rounded bg-slate-950 px-2 py-1 font-mono text-sm text-amber-200">{progress.preferredAlgorithm}</code>
          <p className="mt-0.5 text-xs text-slate-500">Your own variation -- not a CubeCoach-verified algorithm.</p>
        </div>
      )}

      <AlgorithmPlaybackViewer type={state.current.type} scrambledState={state.current.scrambledState} algorithm={effectiveAlgorithm} />

      {state.phase === "revealed" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-slate-300">Did you know it?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onSelfAssess(true)}
              className="flex items-center gap-1.5 rounded-md border border-emerald-700 bg-emerald-950/40 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-900/50"
            >
              <Check size={16} /> I knew it
            </button>
            <button
              type="button"
              onClick={() => onSelfAssess(false)}
              className="flex items-center gap-1.5 rounded-md border border-rose-700 bg-rose-950/40 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-900/50"
            >
              <X size={16} /> I didn't know it
            </button>
          </div>
        </div>
      )}

      {state.phase === "feedback" && (
        <div className="flex flex-col gap-3">
          <div
            aria-live="polite"
            className={`flex items-center gap-2 rounded-md border p-3 text-sm font-semibold ${
              state.lastCorrect ? "border-emerald-900/60 bg-emerald-950/40 text-emerald-300" : "border-rose-900/60 bg-rose-950/40 text-rose-300"
            }`}
          >
            {state.lastCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {state.lastCorrect ? "Marked as known" : "Marked as not known yet"}
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
