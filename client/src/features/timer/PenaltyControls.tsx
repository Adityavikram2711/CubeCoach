import type { Penalty } from "./types.js";

interface PenaltyControlsProps {
  penalty: Penalty;
  onChange: (penalty: Penalty) => void;
}

const OPTIONS: { value: Penalty; label: string }[] = [
  { value: "NONE", label: "No Penalty" },
  { value: "PLUS_TWO", label: "+2" },
  { value: "DNF", label: "DNF" },
];

/** Never relies on color alone -- each option is a labeled button with an explicit pressed state, not a colored dot. */
export function PenaltyControls({ penalty, onChange }: PenaltyControlsProps) {
  return (
    <div role="group" aria-label="Penalty" className="flex justify-center gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={penalty === opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
            penalty === opt.value ? "border-sky-400 bg-sky-900/40 text-sky-200" : "border-slate-700 text-slate-300 hover:border-slate-500"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
