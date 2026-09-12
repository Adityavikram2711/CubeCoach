import { useMemo, useReducer, useState } from "react";
import type { AlgorithmType } from "../api/algorithms.js";
import { CaseRecallView } from "../features/trainer/CaseRecallView.js";
import { CaseRecognitionView } from "../features/trainer/CaseRecognitionView.js";
import { filterCases, generateChoices, selectNextCase } from "../features/trainer/caseSelection.js";
import { ProgressSummaryView } from "../features/trainer/ProgressSummaryView.js";
import {
  createInitialSessionState,
  sessionReducer,
  type SessionState,
} from "../features/trainer/sessionReducer.js";
import { SessionSummaryView } from "../features/trainer/SessionSummaryView.js";
import { TrainerConfigForm } from "../features/trainer/TrainerConfigForm.js";
import type { CaseFilter, SessionConfig, TrainerCase } from "../features/trainer/types.js";
import { useRecordPractice, useTrainerCases, useTrainerProgress } from "../features/trainer/useTrainerData.js";
import { useAuthStore } from "../store/authStore.js";

const ALL_TYPES: AlgorithmType[] = ["OLL", "PLL", "F2L"];
const DEFAULT_CONFIG: SessionConfig = { types: ["OLL"], filter: "all", length: 10, mode: "recognition" };

export function TrainerPage() {
  const isAuthenticated = useAuthStore((s) => s.status === "authenticated");
  const { cases: allCases, isLoading: casesLoading, isError: casesError } = useTrainerCases(ALL_TYPES);
  const { progress, isLoading: progressLoading } = useTrainerProgress();
  const { record: recordPractice } = useRecordPractice();

  const [config, setConfig] = useState<SessionConfig>(DEFAULT_CONFIG);
  const [active, setActive] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  const casesByType = useMemo(() => {
    const map: Record<AlgorithmType, TrainerCase[]> = { OLL: [], PLL: [], F2L: [] };
    for (const c of allCases) map[c.type].push(c);
    return map;
  }, [allCases]);

  const casesById = useMemo(() => new Map(allCases.map((c) => [c.caseId, c])), [allCases]);

  // Guests can't meaningfully use favorites/learned/unlearned/weak (no personalization exists for them), so their sessions always use "All Cases" regardless of what the form shows.
  const effectiveFilter: CaseFilter = isAuthenticated ? config.filter : "all";

  const pool = useMemo(() => {
    const forTypes = allCases.filter((c) => config.types.includes(c.type));
    return filterCases(forTypes, progress, effectiveFilter);
  }, [allCases, config.types, effectiveFilter, progress]);

  const startSession = (weakOverride?: boolean) => {
    if (weakOverride) setConfig((c) => ({ ...c, filter: "weak" }));
    setSessionKey((k) => k + 1);
    setActive(true);
  };

  if (casesLoading || progressLoading) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-slate-400">Loading trainer...</p>
      </main>
    );
  }

  if (casesError) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-rose-400">Failed to load algorithm data for the trainer.</p>
      </main>
    );
  }

  if (!active) {
    return (
      <main>
        <TrainerConfigForm config={config} onChange={setConfig} onStart={() => startSession()} availableCount={pool.length} isAuthenticated={isAuthenticated} />
        <div className="mx-auto max-w-2xl px-6 pb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Your Progress</h2>
          <ProgressSummaryView casesByType={casesByType} progress={progress} />
        </div>
      </main>
    );
  }

  return (
    <TrainerSession
      key={sessionKey}
      config={config}
      pool={pool}
      casesByType={casesByType}
      casesById={casesById}
      progress={progress}
      onRecordPractice={recordPractice}
      onExit={() => setActive(false)}
      onPracticeAgain={() => startSession()}
      onTrainWeakCases={() => startSession(true)}
    />
  );
}

interface TrainerSessionProps {
  config: SessionConfig;
  pool: TrainerCase[];
  casesByType: Record<AlgorithmType, TrainerCase[]>;
  casesById: Map<string, TrainerCase>;
  progress: ReturnType<typeof useTrainerProgress>["progress"];
  onRecordPractice: (algorithmId: string, success: boolean) => void;
  onExit: () => void;
  onPracticeAgain: () => void;
  onTrainWeakCases: () => void;
}

function TrainerSession({ config, pool, casesByType, casesById, progress, onRecordPractice, onExit, onPracticeAgain, onTrainWeakCases }: TrainerSessionProps) {
  const total = config.length === "endless" ? Infinity : config.length;

  const [state, dispatch] = useReducer(sessionReducer, undefined, (): SessionState => {
    const first = selectNextCase(pool, progress, null, Math.random, true)!;
    const choices = config.mode === "recognition" ? generateChoices(first, casesByType[first.type], Math.random) : undefined;
    return createInitialSessionState(config.mode, first, total, choices);
  });

  const handleNext = () => {
    if (state.phase !== "feedback") return;
    const isLastCase = total !== Infinity && state.index + 1 >= total;
    if (isLastCase) {
      dispatch({ type: "NEXT", nextCase: null });
      return;
    }
    const next = selectNextCase(pool, progress, state.current.caseId, Math.random, true);
    if (!next) {
      dispatch({ type: "NEXT", nextCase: null });
      return;
    }
    const choices = config.mode === "recognition" ? generateChoices(next, casesByType[next.type], Math.random) : undefined;
    dispatch({ type: "NEXT", nextCase: next, choices });
  };

  if (state.phase === "complete") {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <SessionSummaryView state={state} casesById={casesById} onPracticeAgain={onPracticeAgain} onTrainWeakCases={onTrainWeakCases} onBackToTrainer={onExit} />
      </main>
    );
  }

  const currentProgress = progress[state.current.caseId];

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-center justify-between text-sm text-slate-400">
        <span>
          {config.types.join(" + ")} &middot; {config.mode === "recognition" ? "Recognition" : "Recall"} &middot; Case {state.index + 1}
          {total !== Infinity ? ` / ${total}` : ""}
        </span>
        <button type="button" onClick={() => dispatch({ type: "END_SESSION" })} className="text-slate-400 underline hover:text-slate-200">
          End Session
        </button>
      </div>

      {config.mode === "recognition" && (state.phase === "presenting" || state.phase === "feedback") && (
        <CaseRecognitionView
          state={state}
          progress={currentProgress}
          onAnswer={(caseId) => {
            dispatch({ type: "ANSWER_RECOGNITION", selectedCaseId: caseId });
            onRecordPractice(state.current.caseId, caseId === state.current.caseId);
          }}
          onNext={handleNext}
        />
      )}

      {config.mode === "recall" && (state.phase === "presenting" || state.phase === "revealed" || state.phase === "feedback") && (
        <CaseRecallView
          state={state}
          progress={currentProgress}
          onReveal={() => dispatch({ type: "REVEAL_RECALL" })}
          onSelfAssess={(correct) => {
            dispatch({ type: "SUBMIT_RECALL", correct });
            onRecordPractice(state.current.caseId, correct);
          }}
          onNext={handleNext}
        />
      )}
    </main>
  );
}
