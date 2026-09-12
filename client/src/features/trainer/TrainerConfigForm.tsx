import type { AlgorithmType } from "../../api/algorithms.js";
import type { CaseFilter, SessionConfig, TrainerMode } from "./types.js";

interface TrainerConfigFormProps {
  config: SessionConfig;
  onChange: (config: SessionConfig) => void;
  onStart: () => void;
  availableCount: number;
  isAuthenticated: boolean;
}

const TYPE_OPTIONS: AlgorithmType[] = ["OLL", "PLL", "F2L"];
const FILTER_OPTIONS: { value: CaseFilter; label: string }[] = [
  { value: "all", label: "All Cases" },
  { value: "favorites", label: "Favorites" },
  { value: "unlearned", label: "Unlearned" },
  { value: "learned", label: "Learned" },
  { value: "weak", label: "Weak Cases" },
];
const LENGTH_OPTIONS: (number | "endless")[] = [5, 10, 20, "endless"];
const MODE_OPTIONS: { value: TrainerMode; label: string; description: string }[] = [
  { value: "recognition", label: "Recognition Mode", description: "Identify the case from a multiple-choice list." },
  { value: "recall", label: "Algorithm Recall Mode", description: "Recall the algorithm yourself, then reveal and self-assess." },
];

function toggleType(types: AlgorithmType[], type: AlgorithmType): AlgorithmType[] {
  if (types.includes(type)) {
    const next = types.filter((t) => t !== type);
    return next.length === 0 ? types : next; // never allow zero types selected
  }
  return [...types, type];
}

export function TrainerConfigForm({ config, onChange, onStart, availableCount, isAuthenticated }: TrainerConfigFormProps) {
  const needsAuthForFilter = !isAuthenticated && config.filter !== "all";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Algorithm Trainer</h1>
        <p className="mt-1 text-sm text-slate-400">
          Practice recognizing and recalling OLL, PLL, and F2L cases. {isAuthenticated ? "Your progress is saved to your account." : "Log in to save your progress."}
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Algorithm Type</h2>
        <div className="mt-2 flex gap-2">
          {TYPE_OPTIONS.map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={config.types.includes(type)}
              onClick={() => onChange({ ...config, types: toggleType(config.types, type) })}
              className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                config.types.includes(type) ? "border-sky-400 bg-sky-900/40 text-sky-200" : "border-slate-700 text-slate-300 hover:border-slate-500"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Case Selection</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={config.filter === opt.value}
              onClick={() => onChange({ ...config, filter: opt.value })}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                config.filter === opt.value ? "border-sky-400 bg-sky-900/40 text-sky-200" : "border-slate-700 text-slate-300 hover:border-slate-500"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {needsAuthForFilter && <p className="mt-2 text-xs text-amber-400">Log in to use favorites/learned/weak-case filters -- guests only see "All Cases."</p>}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Practice Mode</h2>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={config.mode === opt.value}
              onClick={() => onChange({ ...config, mode: opt.value })}
              className={`flex-1 rounded-md border p-3 text-left transition-colors ${
                config.mode === opt.value ? "border-sky-400 bg-sky-900/40" : "border-slate-700 hover:border-slate-500"
              }`}
            >
              <div className={`text-sm font-semibold ${config.mode === opt.value ? "text-sky-200" : "text-slate-200"}`}>{opt.label}</div>
              <div className="mt-0.5 text-xs text-slate-400">{opt.description}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Session Length</h2>
        <div className="mt-2 flex gap-2">
          {LENGTH_OPTIONS.map((len) => (
            <button
              key={len}
              type="button"
              aria-pressed={config.length === len}
              onClick={() => onChange({ ...config, length: len })}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                config.length === len ? "border-sky-400 bg-sky-900/40 text-sky-200" : "border-slate-700 text-slate-300 hover:border-slate-500"
              }`}
            >
              {len === "endless" ? "Endless" : `${len} cases`}
            </button>
          ))}
        </div>
      </section>

      {availableCount === 0 ? (
        <p className="rounded-md border border-slate-800 bg-slate-900 p-3 text-sm text-slate-400">
          No cases match this selection yet.{" "}
          {config.filter === "favorites" && "You haven't favorited any cases for these types yet -- browse the "}
          {config.filter !== "favorites" && "Try a different filter, or browse the "}
          <a href="/algorithms" className="text-sky-400 hover:underline">
            Algorithm Library
          </a>
          .
        </p>
      ) : (
        <p className="text-sm text-slate-400">{availableCount} case{availableCount === 1 ? "" : "s"} match this selection.</p>
      )}

      <button
        type="button"
        onClick={onStart}
        disabled={availableCount === 0}
        className="self-start rounded-md bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Start Training
      </button>
    </div>
  );
}
