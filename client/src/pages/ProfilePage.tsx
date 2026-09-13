import { BookOpen, Layers, Timer as TimerIcon, Wand2 } from "lucide-react";
import { useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useUserAlgorithmsList } from "../features/algorithms/useUserAlgorithm.js";
import { useAuthStore } from "../store/authStore.js";

const TOTAL_ALGORITHMS = 57 + 21 + 24; // 57 OLL + 21 PLL + 24 F2L, per the Phase 7 verified dataset

const QUICK_ACTIONS = [
  { to: "/solve", label: "Solve a Cube", icon: Wand2 },
  { to: "/algorithms", label: "Algorithm Library", icon: BookOpen },
  { to: "/trainer", label: "Trainer", icon: Layers },
  { to: "/timer", label: "Speed Timer", icon: TimerIcon },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data: records, isLoading } = useUserAlgorithmsList();

  useEffect(() => {
    if (status === "unauthenticated") navigate("/login");
  }, [status, navigate]);

  if (status === "loading" || status === "idle") {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p className="cc-status-line">Loading profile...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const learnedCount = records?.filter((r) => r.learned).length ?? 0;
  const favoriteCount = records?.filter((r) => r.favorite).length ?? 0;
  const practicedRecords = records?.filter((r) => r.practiceCount > 0) ?? [];
  const totalPracticeCount = practicedRecords.reduce((sum, r) => sum + r.practiceCount, 0);
  const totalSuccessCount = practicedRecords.reduce((sum, r) => sum + r.successCount, 0);
  const hasPracticeData = totalPracticeCount > 0;

  const recentlyCustomized = (records ?? [])
    .filter((r) => r.preferredAlgorithm || r.notes || r.personalAlternatives.length > 0)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <main className="cc-page mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{user.username}</h1>
          <p className="text-sm text-slate-400">{user.email}</p>
          <p className="mt-1 text-xs text-slate-500">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="cc-btn-secondary px-3 py-1.5"
        >
          Log Out
        </button>
      </div>

      <div>
        <span className="cc-label">Quick Actions</span>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.to} to={action.to} className="cc-card-interactive flex flex-col items-center gap-2 px-3 py-4 text-center">
              <action.icon size={18} style={{ color: "var(--accent)" }} />
              <span className="text-xs font-medium text-slate-200">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="cc-status-line">Loading your algorithm progress...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Learned" value={`${learnedCount} / ${TOTAL_ALGORITHMS}`} />
            <StatCard label="Favorites" value={String(favoriteCount)} />
            <StatCard label="Practiced" value={String(practicedRecords.length)} />
            <StatCard label="Success Rate" value={hasPracticeData ? `${Math.round((totalSuccessCount / totalPracticeCount) * 100)}%` : "--"} />
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recently Customized</h2>
            {recentlyCustomized.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">
                No personal algorithms or notes yet -- visit an algorithm's page to add one.
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {recentlyCustomized.map((r) => (
                  <li key={r._id} className="cc-surface px-3 py-2 text-sm">
                    <span className="font-mono font-semibold text-sky-300">{r.algorithmId}</span>
                    {r.preferredAlgorithm && <span className="ml-2 text-slate-300">{r.preferredAlgorithm}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="cc-card p-4 text-center">
      <div className="text-xl font-bold text-slate-100">{value}</div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}
