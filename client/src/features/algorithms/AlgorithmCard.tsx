import { Link } from "react-router-dom";
import type { AlgorithmCaseDto } from "../../api/algorithms.js";

const DIFFICULTY_CLASS: Record<string, string> = {
  Beginner: "bg-emerald-950/60 text-emerald-300 border-emerald-900",
  Intermediate: "bg-amber-950/60 text-amber-300 border-amber-900",
  Advanced: "bg-rose-950/60 text-rose-300 border-rose-900",
};

export function AlgorithmCard({ algorithmCase }: { algorithmCase: AlgorithmCaseDto }) {
  return (
    <Link
      to={`/algorithms/${algorithmCase.caseId}`}
      className="cc-card-interactive flex flex-col gap-2 p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-slate-100">{algorithmCase.name}</span>
        <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${DIFFICULTY_CLASS[algorithmCase.difficulty]}`}>
          {algorithmCase.difficulty}
        </span>
      </div>
      {algorithmCase.category && <span className="text-xs uppercase tracking-wide text-slate-500">{algorithmCase.category}</span>}
      <p className="line-clamp-2 text-sm text-slate-400">{algorithmCase.recognition}</p>
      <code className="cc-surface mt-1 truncate px-2 py-1 font-mono text-xs" style={{ color: "var(--accent)" }}>
        {algorithmCase.algorithm}
      </code>
    </Link>
  );
}
