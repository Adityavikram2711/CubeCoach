import { formatTime } from "./timeUtils.js";
import type { AverageResult, SolveStats } from "./types.js";

function formatAverage(result: AverageResult): string {
  if (result.status === "insufficient-data") return "--";
  if (result.status === "dnf") return "DNF";
  return formatTime(result.timeMs);
}

interface StatisticsPanelProps {
  stats: SolveStats;
}

/** Every number here comes from computeSolveStats() applied to real solve records -- never a placeholder. With zero solves every field renders "--", not 0 or NaN. */
export function StatisticsPanel({ stats }: StatisticsPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <Stat label="Best" value={stats.best === null ? "--" : formatTime(stats.best)} />
      <Stat label="Average" value={stats.mean === null ? "--" : formatTime(stats.mean)} />
      <Stat label="Ao5" value={formatAverage(stats.ao5)} />
      <Stat label="Ao12" value={formatAverage(stats.ao12)} />
      <Stat label="Ao50" value={formatAverage(stats.ao50)} />
      <Stat label="Solves" value={String(stats.count)} />
      <Stat label="DNFs" value={String(stats.dnfCount)} />
      <Stat label="+2s" value={String(stats.plusTwoCount)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-center">
      <div className="font-mono text-lg font-bold text-slate-100">{value}</div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}
