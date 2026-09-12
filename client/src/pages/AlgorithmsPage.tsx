/**
 * Browse the algorithm library: OLL/PLL/F2L tabs, a text search, and a difficulty
 * filter, backed by GET /api/algorithms. Category filtering happens client-side across
 * the currently-loaded tab's results, since the category vocabulary differs per type.
 */
import { useMemo, useState } from "react";
import type { AlgorithmType, Difficulty } from "../api/algorithms.js";
import { AlgorithmCard } from "../features/algorithms/AlgorithmCard.js";
import { useAlgorithms } from "../features/algorithms/useAlgorithms.js";

const TABS: AlgorithmType[] = ["OLL", "PLL", "F2L"];
const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

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
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Algorithm Library</h1>
        <p className="text-sm text-slate-400">57 OLL, 21 PLL, and 24 F2L cases -- every algorithm independently verified against the cube engine.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-800">
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
              tab === t ? "border-b-2 border-sky-400 text-sky-300" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or recognition..."
          aria-label="Search algorithms"
          className="min-w-[220px] flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
        />

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty | "")}
          aria-label="Filter by difficulty"
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
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
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
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

      {isLoading && <p className="text-sm text-slate-400">Loading cases...</p>}
      {isError && <p className="text-sm text-rose-400">Failed to load algorithms: {(error as Error).message}</p>}
      {!isLoading && !isError && visibleCases.length === 0 && (
        <p className="text-sm text-slate-400">No cases match your filters.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCases.map((c) => (
          <AlgorithmCard key={c.caseId} algorithmCase={c} />
        ))}
      </div>
    </div>
  );
}
