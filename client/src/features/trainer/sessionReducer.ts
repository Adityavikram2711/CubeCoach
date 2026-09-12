import { getSessionSummary } from "./sessionSummary.js";
import type { AttemptResult, Choice, SessionSummary, TrainerCase, TrainerMode } from "./types.js";

/**
 * An explicit discriminated-union state machine (spec-style, matching how the Phase 5
 * solver state and Phase 8 auth state were modeled) instead of a pile of independent
 * booleans -- the UI can never render a contradictory combination like "revealed" and
 * "already moved to the next case."
 *
 * This reducer deliberately owns no randomness or data fetching: NEXT's `nextCase` is
 * computed externally (by caseSelection.ts, given the live pool/progress/RNG) and
 * simply handed in, which keeps this whole module pure and trivially unit-testable.
 */
export type SessionPhase = "presenting" | "revealed" | "feedback" | "complete";

interface SessionBase {
  mode: TrainerMode;
  index: number;
  total: number;
  attempts: AttemptResult[];
}

export interface PresentingState extends SessionBase {
  phase: "presenting";
  current: TrainerCase;
  /** Only set in recognition mode. */
  choices?: Choice[];
}

export interface RevealedState extends SessionBase {
  phase: "revealed"; // recall mode only: answer shown, awaiting self-assessment
  current: TrainerCase;
}

export interface FeedbackState extends SessionBase {
  phase: "feedback";
  current: TrainerCase;
  lastCorrect: boolean;
  choices?: Choice[];
  selectedCaseId?: string;
}

export interface CompleteState {
  phase: "complete";
  attempts: AttemptResult[];
  summary: SessionSummary;
}

export type SessionState = PresentingState | RevealedState | FeedbackState | CompleteState;

export type SessionAction =
  | { type: "ANSWER_RECOGNITION"; selectedCaseId: string }
  | { type: "REVEAL_RECALL" }
  | { type: "SUBMIT_RECALL"; correct: boolean }
  | { type: "NEXT"; nextCase: TrainerCase | null; choices?: Choice[] }
  /** Ends the session immediately from any phase (used for "Endless" mode and early exit) -- the in-progress, not-yet-answered case is simply dropped, and the summary is built from whatever was actually answered so far. */
  | { type: "END_SESSION" };

export function createInitialSessionState(mode: TrainerMode, first: TrainerCase, total: number, choices?: Choice[]): PresentingState {
  return { phase: "presenting", mode, current: first, index: 0, total, attempts: [], choices };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "ANSWER_RECOGNITION": {
      if (state.phase !== "presenting" || state.mode !== "recognition") return state;
      const correct = action.selectedCaseId === state.current.caseId;
      const attempts = [...state.attempts, { caseId: state.current.caseId, type: state.current.type, correct }];
      return {
        phase: "feedback",
        mode: state.mode,
        current: state.current,
        index: state.index,
        total: state.total,
        attempts,
        lastCorrect: correct,
        choices: state.choices,
        selectedCaseId: action.selectedCaseId,
      };
    }

    case "REVEAL_RECALL": {
      if (state.phase !== "presenting" || state.mode !== "recall") return state;
      return { phase: "revealed", mode: state.mode, current: state.current, index: state.index, total: state.total, attempts: state.attempts };
    }

    case "SUBMIT_RECALL": {
      if (state.phase !== "revealed") return state;
      const attempts = [...state.attempts, { caseId: state.current.caseId, type: state.current.type, correct: action.correct }];
      return {
        phase: "feedback",
        mode: state.mode,
        current: state.current,
        index: state.index,
        total: state.total,
        attempts,
        lastCorrect: action.correct,
      };
    }

    case "NEXT": {
      if (state.phase !== "feedback") return state;
      if (!action.nextCase) {
        return { phase: "complete", attempts: state.attempts, summary: getSessionSummary(state.attempts) };
      }
      return {
        phase: "presenting",
        mode: state.mode,
        current: action.nextCase,
        index: state.index + 1,
        total: state.total,
        attempts: state.attempts,
        choices: action.choices,
      };
    }

    case "END_SESSION": {
      if (state.phase === "complete") return state;
      return { phase: "complete", attempts: state.attempts, summary: getSessionSummary(state.attempts) };
    }

    default:
      return state;
  }
}
