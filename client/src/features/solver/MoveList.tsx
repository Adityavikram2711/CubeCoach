import type { Move } from "@cube-coach/cube-engine";

interface MoveListProps {
  moves: readonly Move[];
  /** 0 = before any move; N = after move N (same convention as useSolutionPlayer). */
  currentMoveIndex: number;
  onSelect: (moveIndex: number) => void;
}

export function MoveList({ moves, currentMoveIndex, onSelect }: MoveListProps) {
  return (
    <ol className="flex flex-wrap gap-1.5" aria-label="Solution moves">
      {moves.map((move, i) => {
        // The move at array index i is "move i+1"; clicking it shows the state after it runs.
        const isCurrent = currentMoveIndex === i + 1;
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => onSelect(i + 1)}
              aria-current={isCurrent ? "step" : undefined}
              className={`rounded border px-2 py-1 font-mono text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-400 ${
                isCurrent
                  ? "border-sky-400 bg-sky-900/50 font-bold text-sky-200"
                  : "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500"
              }`}
            >
              <span className="mr-1 text-slate-500">{i + 1}</span>
              {move}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
