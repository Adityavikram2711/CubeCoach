import { useEffect, useMemo, useRef, useState } from "react";
import { PenaltyControls } from "../features/timer/PenaltyControls.js";
import { ScrambleDisplay } from "../features/timer/ScrambleDisplay.js";
import { SolveHistory } from "../features/timer/SolveHistory.js";
import { StatisticsPanel } from "../features/timer/StatisticsPanel.js";
import { TimerDisplay } from "../features/timer/TimerDisplay.js";
import { computeSolveStats } from "../features/timer/solveStats.js";
import { useSolveHistory } from "../features/timer/useSolveHistory.js";
import { useTimerEngine } from "../features/timer/useTimerEngine.js";

const buttonClass =
  "rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-40";
const primaryButtonClass =
  "rounded-md bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50";

export function TimerPage() {
  const { state, displayNow, beginInspection, startSolveNow, stop, cancel, setPenalty, newScramble } = useTimerEngine();
  const { solves, isLoading, isAuthenticated, isSaving, addSolve, removeSolve } = useSolveHistory();
  const [saved, setSaved] = useState(false);
  // A ref, not state: state updates (saved/isSaving) only take effect on the next
  // render, so two clicks dispatched in the same tick -- a real double-click, or two
  // synthetic clicks fired back-to-back in a test -- can both pass an `if (saved)`
  // state check before either one's state update has committed. A ref is read/written
  // synchronously, so the second call always sees what the first one just set.
  const savingRef = useRef(false);

  useEffect(() => {
    if (state.phase !== "result") setSaved(false);
  }, [state.phase]);

  const stats = useMemo(() => computeSolveStats(solves), [solves]);

  const handleSave = async () => {
    if (state.phase !== "result" || saved || savingRef.current) return;
    savingRef.current = true;
    try {
      await addSolve({
        scramble: state.scramble,
        rawTimeMs: state.rawTimeMs,
        penalty: state.penalty,
        solvedAt: new Date().toISOString(),
      });
      setSaved(true);
    } finally {
      savingRef.current = false;
    }
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Speed Timer</h1>
        <p className="mt-1 text-sm text-slate-400">
          {isAuthenticated ? "Your solves are saved to your account." : "Solving as a guest -- your history is temporary and won't be saved."}
        </p>
      </div>

      <ScrambleDisplay scramble={state.scramble} />

      <div className="flex flex-col items-center gap-4 rounded-lg border border-slate-800 bg-slate-900 p-8">
        <TimerDisplay state={state} displayNow={displayNow} />

        <div className="flex flex-wrap justify-center gap-2">
          {state.phase === "idle" && (
            <>
              <button type="button" onClick={beginInspection} className={primaryButtonClass}>
                Start Inspection
              </button>
              <button type="button" onClick={newScramble} className={buttonClass}>
                New Scramble
              </button>
            </>
          )}

          {(state.phase === "inspection" || state.phase === "ready") && (
            <>
              <button type="button" onClick={startSolveNow} className={primaryButtonClass}>
                Start Solve
              </button>
              <button type="button" onClick={cancel} className={buttonClass}>
                Cancel
              </button>
            </>
          )}

          {state.phase === "running" && (
            <button type="button" onClick={stop} className={primaryButtonClass}>
              Stop
            </button>
          )}

          {state.phase === "result" && <PenaltyControls penalty={state.penalty} onChange={setPenalty} />}
        </div>

        {state.phase === "result" && (
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={handleSave} disabled={saved || isSaving} className={primaryButtonClass}>
              {saved ? "Saved" : isSaving ? "Saving..." : "Save Solve"}
            </button>
            <button type="button" onClick={newScramble} className={buttonClass}>
              New Scramble
            </button>
          </div>
        )}

        <p className="text-center text-xs text-slate-500">
          Space: start inspection / release to solve / stop &middot; Esc: cancel inspection
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Statistics</h2>
        {isLoading ? <p className="text-sm text-slate-400">Loading your statistics...</p> : <StatisticsPanel stats={stats} />}
      </div>

      {/* min-w-0: direct child of a flex column defaults to min-width:auto (never
          shrinking below its content's natural width) -- without it, the solve
          history table's full width would push the whole page wider than the
          viewport on narrow screens instead of scrolling internally. */}
      <div className="min-w-0">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Solve History</h2>
        {isLoading ? <p className="text-sm text-slate-400">Loading your solves...</p> : <SolveHistory solves={solves} onDelete={removeSolve} />}
      </div>
    </main>
  );
}
