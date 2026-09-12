import { calculateFinalTime, formatTime } from "./timeUtils.js";
import { INSPECTION_MS } from "./types.js";
import type { TimerState } from "./timerReducer.js";

interface TimerDisplayProps {
  state: TimerState;
  displayNow: number;
}

/**
 * Purely presentational: every number here is a fresh subtraction against `displayNow`
 * (itself driven by requestAnimationFrame reading performance.now(), see
 * useTimerEngine.ts) -- nothing is accumulated turn-by-turn, so a dropped frame or a
 * backgrounded tab can never leave the display stuck on a stale or negative value.
 */
export function TimerDisplay({ state, displayNow }: TimerDisplayProps) {
  if (state.phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-1" aria-live="off">
        <span className="font-mono text-7xl font-bold tabular-nums text-slate-100">0.00</span>
        <span className="text-sm text-slate-400">Press Space or Start Inspection</span>
      </div>
    );
  }

  if (state.phase === "inspection" || state.phase === "ready") {
    const elapsed = displayNow - state.inspectionStartedAt;
    const remainingSeconds = Math.max(0, Math.ceil((INSPECTION_MS - elapsed) / 1000));
    const overtime = elapsed > INSPECTION_MS;
    return (
      <div className="flex flex-col items-center gap-1" aria-live="assertive" role="status">
        <span className={`font-mono text-7xl font-bold tabular-nums ${overtime ? "text-rose-400" : "text-sky-300"}`}>
          {overtime ? "+2" : remainingSeconds}
        </span>
        <span className="text-sm text-slate-400">{state.phase === "ready" ? "Release to start" : "Inspecting -- hold Space or press Start Solve"}</span>
      </div>
    );
  }

  if (state.phase === "running") {
    const elapsed = displayNow - state.runStartedAt;
    return (
      <div className="flex flex-col items-center gap-1" aria-live="off">
        <span className="font-mono text-7xl font-bold tabular-nums text-emerald-300">{formatTime(elapsed)}</span>
        <span className="text-sm text-slate-400">Solving...</span>
      </div>
    );
  }

  // result
  const finalTimeMs = calculateFinalTime(state.rawTimeMs, state.penalty);
  return (
    <div className="flex flex-col items-center gap-1" aria-live="polite" role="status">
      <span className="font-mono text-7xl font-bold tabular-nums text-slate-100">{formatTime(finalTimeMs)}</span>
      {state.penalty !== "NONE" && (
        <span className="text-sm text-slate-400">
          Raw: {formatTime(state.rawTimeMs)} {state.penalty === "PLUS_TWO" ? "+2" : "(DNF)"}
        </span>
      )}
    </div>
  );
}
