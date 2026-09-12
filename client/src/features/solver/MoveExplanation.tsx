import type { Move } from "@cube-coach/cube-engine";
import { explainMove } from "./solutionUtils.js";

interface MoveExplanationProps {
  moves: readonly Move[];
  /** 0 = before any move; N = after move N. */
  currentMoveIndex: number;
}

export function MoveExplanation({ moves, currentMoveIndex }: MoveExplanationProps) {
  const total = moves.length;
  const justPlayed = currentMoveIndex > 0 ? moves[currentMoveIndex - 1] : null;
  const progressPercent = total === 0 ? 100 : (currentMoveIndex / total) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div aria-live="polite" className="flex items-baseline gap-3">
        {justPlayed ? (
          <>
            <span className="rounded border border-sky-500 bg-sky-900/40 px-3 py-1 font-mono text-xl font-bold text-sky-200">
              {justPlayed}
            </span>
            <span className="text-sm text-slate-400">{explainMove(justPlayed)}</span>
          </>
        ) : (
          <span className="text-sm text-slate-400">Scrambled cube -- press Play or Next to begin.</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800" role="presentation">
          <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="whitespace-nowrap text-sm text-slate-400">
          Move {currentMoveIndex} / {total}
        </span>
      </div>
    </div>
  );
}
