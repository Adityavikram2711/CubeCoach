import { Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { AlgorithmPlaybackViewer } from "../features/algorithms/AlgorithmPlaybackViewer.js";
import { useAlgorithm } from "../features/algorithms/useAlgorithms.js";
import { PersonalizationPanel } from "../features/algorithms/PersonalizationPanel.js";
import { useAuthStore } from "../store/authStore.js";

export function AlgorithmDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: algorithmCase, isLoading, isError, error } = useAlgorithm(id);
  const isAuthenticated = useAuthStore((s) => s.status === "authenticated");

  return (
    <div className="cc-page mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <Link to="/algorithms" className="text-sm text-sky-400 hover:underline">
        &larr; Back to Algorithm Library
      </Link>

      {isLoading && (
        <p className="cc-status-line">
          <Loader2 size={14} className="cc-spin" /> Loading case...
        </p>
      )}
      {isError && <p className="cc-status-error">Failed to load case: {(error as Error).message}</p>}

      {algorithmCase && (
        <>
          <div>
            <div className="flex items-center gap-2">
              <span className="cc-badge">
                {algorithmCase.type}
              </span>
              {algorithmCase.category && (
                <span className="cc-badge">
                  {algorithmCase.category}
                </span>
              )}
              <span className="cc-badge">
                {algorithmCase.difficulty}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-100">{algorithmCase.name}</h1>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recognition</h2>
            <p className="mt-1 text-sm text-slate-300">{algorithmCase.recognition}</p>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-sky-400">Official CubeCoach Algorithm (Verified)</span>
            <AlgorithmPlaybackViewer
              type={algorithmCase.type}
              scrambledState={algorithmCase.scrambledState}
              algorithm={algorithmCase.algorithm}
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Finger Tricks</h2>
            <p className="mt-1 text-sm text-slate-300">{algorithmCase.fingerTricks}</p>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Notes</h2>
            <p className="mt-1 text-sm text-slate-300">{algorithmCase.notes}</p>
          </div>

          {isAuthenticated ? (
            <PersonalizationPanel algorithmId={algorithmCase.caseId} officialAlgorithm={algorithmCase.algorithm} />
          ) : (
            <p className="cc-surface p-3 text-sm text-slate-400">
              <Link to="/login" className="text-sky-400 hover:underline">
                Log in
              </Link>{" "}
              to save favorites, mark algorithms as learned, or add your own personal algorithm and notes.
            </p>
          )}
        </>
      )}
    </div>
  );
}
