/**
 * Browse the algorithm library: OLL/PLL/F2L tabs, a text search, and a difficulty
 * filter, backed by GET /api/algorithms. Category filtering happens client-side across
 * the currently-loaded tab's results, since the category vocabulary differs per type.
 */
import { Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { AlgorithmType, Difficulty } from "../api/algorithms.js";
import { AlgorithmCard } from "../features/algorithms/AlgorithmCard.js";
import { useAlgorithms } from "../features/algorithms/useAlgorithms.js";

const TABS: AlgorithmType[] = ["OLL", "PLL", "F2L"];
const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
const CASE_COUNTS: Record<AlgorithmType, number> = { OLL: 57, PLL: 21, F2L: 24 };
const TOTAL_CASES = CASE_COUNTS.OLL + CASE_COUNTS.PLL + CASE_COUNTS.F2L;

export function AlgorithmsPage() {
  const [tab, setTab] = useState<AlgorithmType>("OLL");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [category, setCategory] = useState<string>("");

  const { data: cases, isLoading, isError, error } = useAlgorithms({
    type: tab,
    difficulty: difficulty || undefined,
    search: search || undefined,
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const c of cases ?? []) if (c.category) set.add(c.category);
    return Array.from(set).sort();
  }, [cases]);

  const visibleCases = useMemo(
    () => (cases ?? []).filter((c) => !category || c.category === category),
    [cases, category],
  );

  return (
    <div className="cc-page mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">Algorithm Library</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Master OLL, PLL, and F2L algorithms with verified algorithms and recognition guidance.
          </p>
        </div>
        <div className="flex gap-2">
          <StatPill value={TOTAL_CASES} label="Total" accent />
          <StatPill value={CASE_COUNTS.OLL} label="OLL" />
          <StatPill value={CASE_COUNTS.PLL} label="PLL" />
          <StatPill value={CASE_COUNTS.F2L} label="F2L" />
        </div>
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor: "var(--border)" }}>
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setCategory("");
            }}
            aria-current={tab === t ? "page" : undefined}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t ? "border-b-2 text-sky-300" : "hover:text-slate-200"
            }`}
            style={{ borderColor: tab === t ? "var(--accent)" : "transparent", color: tab === t ? undefined : "var(--text-muted)" }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-[3]">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-disabled)" }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search algorithms..."
            aria-label="Search algorithms"
            className="cc-input pl-9"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty | "")}
            aria-label="Filter by difficulty"
            className="cc-input flex-1 sm:w-44"
          >
            <option value="">All difficulties</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {categories.length > 0 && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
              className="cc-input flex-1 sm:w-44"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {isLoading && (
        <p className="cc-status-line">
          <Loader2 size={14} className="cc-spin" /> Loading cases...
        </p>
      )}
      {isError && <p className="cc-status-error">Failed to load algorithms: {(error as Error).message}</p>}
      {!isLoading && !isError && visibleCases.length === 0 && <p className="cc-status-line">No cases match your filters.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCases.map((c) => (
          <AlgorithmCard key={c.caseId} algorithmCase={c} />
        ))}
      </div>
    </div>
  );
}

function StatPill({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className="cc-surface flex min-w-[64px] flex-col items-center px-3 py-1.5">
      <span className="text-sm font-bold tabular-nums" style={{ color: accent ? "var(--accent)" : "var(--text-primary)" }}>
        {value}
      </span>
      <span className="cc-label text-[10px]">{label}</span>
    </div>
  );
}
