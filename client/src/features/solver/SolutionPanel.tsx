import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { SolverState } from "./useSolver.js";

const SOLVING_LABELS = ["Analyzing cube...", "Searching for solution...", "Verifying solution..."];

function SolvingIndicator() {
  const [labelIndex, setLabelIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setLabelIndex((i) => (i + 1) % SOLVING_LABELS.length), 500);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800/60 p-3 text-sm text-slate-300">
      <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" aria-hidden="true" />
      <span aria-live="polite">{SOLVING_LABELS[labelIndex]}</span>
    </div>
  );
}

interface SolutionPanelProps {
  state: SolverState;
}

/**
 * Handles the compact solver states (idle/solving/error/already-solved) that fit in a
 * sidebar. A successful multi-move result is intentionally NOT rendered here -- see
 * SolutionViewer, which CubeInputView renders full-width instead, since the move list
 * and 3D player need much more room than this sidebar has.
 */
export function SolutionPanel({ state }: SolutionPanelProps) {
  // Idle renders nothing rather than an empty-state message: ValidationPanel already
  // owns "enter/validate the cube first" messaging, so this stays out of its way. This
  // never renders a fake solution -- there's simply nothing here until one exists.
  if (state.status === "idle") return null;

  if (state.status === "solving") return <SolvingIndicator />;

  if (state.status === "error") {
    return (
      <div className="flex items-start gap-2 rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-300">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <span>{state.error.message}</span>
      </div>
    );
  }

  if (state.result.moveCount === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-900/60 bg-emerald-950/40 p-3 text-sm font-medium text-emerald-300">
        <CheckCircle2 size={16} />
        Already solved -- 0 moves needed.
      </div>
    );
  }

  return null; // a multi-move success renders via SolutionViewer instead (see above)
}
