import { Trash2 } from "lucide-react";
import { formatTime } from "./timeUtils.js";
import type { SolveRecord } from "./types.js";

interface SolveHistoryProps {
  solves: readonly SolveRecord[];
  onDelete: (id: string) => void;
}

const PENALTY_LABEL: Record<SolveRecord["penalty"], string> = { NONE: "—", PLUS_TWO: "+2", DNF: "DNF" };

export function SolveHistory({ solves, onDelete }: SolveHistoryProps) {
  if (solves.length === 0) {
    return <p className="cc-status-line">No solves yet -- your first solve will appear here.</p>;
  }

  return (
    // min-w-0 matters here: this sits inside TimerPage's flex-col layout, and flex
    // items default to min-width:auto (never shrinking below their content's natural
    // width) -- without it, the table's full unscrolled width would push the whole
    // page wider than the viewport instead of scrolling internally as intended.
    //
    // table-fixed (not the default table-layout:auto) matters too: an auto-layout
    // table sizes its columns from content first and only THEN gets clipped by
    // overflow-x-auto, and a wide-open text column (the scramble) can still make the
    // table's own intrinsic width bleed into the page's root scrollable area in
    // Chromium even while the column itself renders truncated -- fixed layout sizes
    // columns from the declared widths below instead, so there's no oversized
    // intrinsic width to leak in the first place.
    <div className="w-full min-w-0 overflow-x-auto">
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
            <th scope="col" className="w-8 py-2 pr-2">
              #
            </th>
            <th scope="col" className="w-20 py-2 pr-2">
              Time
            </th>
            <th scope="col" className="w-16 py-2 pr-2">
              Penalty
            </th>
            <th scope="col" className="py-2 pr-2">
              Scramble
            </th>
            <th scope="col" className="w-8 py-2">
              <span className="sr-only">Delete</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {solves.map((solve, i) => (
            <tr key={solve.id} className="border-b border-slate-900">
              <td className="py-2 pr-2 text-slate-500">{solves.length - i}</td>
              <td className="py-2 pr-2 font-mono font-semibold text-slate-100">{formatTime(solve.finalTimeMs)}</td>
              <td className="py-2 pr-2 text-slate-400">{PENALTY_LABEL[solve.penalty]}</td>
              <td className="truncate py-2 pr-2 font-mono text-xs text-slate-500" title={solve.scramble}>
                {solve.scramble}
              </td>
              <td className="py-2">
                <button
                  type="button"
                  onClick={() => onDelete(solve.id)}
                  aria-label={`Delete solve #${solves.length - i}`}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
