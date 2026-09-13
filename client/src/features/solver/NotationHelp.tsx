import type { BaseMoveName, Move } from "@cube-coach/cube-engine";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { notationLegend } from "./solutionUtils.js";

interface NotationHelpProps {
  bases: readonly BaseMoveName[];
}

export function NotationHelp({ bases }: NotationHelpProps) {
  const [open, setOpen] = useState(false);
  const legend: Array<{ move: Move; explanation: string }> = notationLegend(bases);

  return (
    <div className="cc-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-slate-300"
      >
        Notation Help
        <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1 border-t p-3 text-sm sm:grid-cols-2" style={{ borderColor: "var(--border)" }}>
          {legend.map(({ move, explanation }) => (
            <div key={move} className="flex gap-2">
              <dt className="w-12 shrink-0 font-mono font-semibold text-slate-200">{move}</dt>
              <dd className="text-slate-400">{explanation}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
