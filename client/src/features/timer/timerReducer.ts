import { INSPECTION_GRACE_MS, INSPECTION_MS, type Penalty } from "./types.js";

/**
 * An explicit discriminated-union state machine (same style as the Phase 5 solver
 * state, Phase 8 auth state, and Phase 9 trainer session) instead of a pile of
 * independent booleans -- the UI can never render "running" and "showing a result" at
 * once, and every transition below is reachable from exactly the phases it's valid in.
 *
 * Deliberately 5 phases, not 6: this collapses the suggested "stopped" and "result"
 * phases into one "result" phase, since there's no real UX or data difference between
 * "just stopped" and "showing the result with penalty controls" -- both display the
 * same raw time immediately and both accept a penalty choice. Documented here rather
 * than left as an unexplained deviation from the suggested phase list.
 *
 * Every transition takes real timestamps (performance.now() values) as action
 * payloads rather than reading the clock itself, which is what keeps this whole module
 * pure and exactly reproducible in tests with fabricated timestamps.
 */
export type TimerPhase = "idle" | "inspection" | "ready" | "running" | "result";

interface IdleState {
  phase: "idle";
  scramble: string;
}

interface InspectionState {
  phase: "inspection";
  scramble: string;
  inspectionStartedAt: number;
}

/** "Armed" -- the user has pressed (and is holding) start; releasing begins the solve. */
interface ReadyState {
  phase: "ready";
  scramble: string;
  inspectionStartedAt: number;
}

interface RunningState {
  phase: "running";
  scramble: string;
  runStartedAt: number;
  /** Determined at the moment inspection ended -- WCA rule: over 15s is +2, and this state is never entered past 17s (that's an immediate DNF instead, see INSPECTION_TIMEOUT/RELEASE_TO_RUN). */
  autoPenalty: Penalty;
}

interface ResultState {
  phase: "result";
  scramble: string;
  /** 0 when the solve never actually ran (auto-DNF from inspection overrunning 17s). */
  rawTimeMs: number;
  penalty: Penalty;
}

export type TimerState = IdleState | InspectionState | ReadyState | RunningState | ResultState;

export type TimerAction =
  | { type: "NEW_SCRAMBLE"; scramble: string }
  | { type: "BEGIN_INSPECTION"; now: number }
  | { type: "ARM"; now: number }
  | { type: "RELEASE_TO_RUN"; now: number }
  /** Dispatched by the ticking display once inspection has run past the 17s grace window with no input at all. */
  | { type: "INSPECTION_TIMEOUT" }
  | { type: "STOP"; now: number }
  | { type: "SET_PENALTY"; penalty: Penalty }
  /** Esc during inspection/ready: discard everything, no record created, back to idle with the same scramble still showing. */
  | { type: "CANCEL_SOLVE" }
  /**
   * SPACE_DOWN/SPACE_UP exist so the keyboard handler never has to decide "what should
   * Space do right now" itself by reading `state.phase` from a JS closure -- that
   * closure can be stale (React only re-subscribes the event listener effect after a
   * render commits, so several keydown/keyup events dispatched synchronously in the
   * same batch would otherwise all be judged against the *first* one's phase). Instead
   * the handler always dispatches the same intent, and this reducer -- which always
   * sees the true, correctly-threaded current state, even mid-batch -- decides which
   * concrete transition it maps to.
   */
  | { type: "SPACE_DOWN"; now: number }
  | { type: "SPACE_UP"; now: number };

export function createInitialTimerState(scramble: string): IdleState {
  return { phase: "idle", scramble };
}

function inspectionPenalty(elapsedMs: number): Penalty {
  if (elapsedMs <= INSPECTION_MS) return "NONE";
  if (elapsedMs <= INSPECTION_GRACE_MS) return "PLUS_TWO";
  return "DNF";
}

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case "NEW_SCRAMBLE": {
      // Never allowed mid-solve -- only from idle or after a result is showing.
      if (state.phase !== "idle" && state.phase !== "result") return state;
      return { phase: "idle", scramble: action.scramble };
    }

    case "BEGIN_INSPECTION": {
      if (state.phase !== "idle") return state;
      return { phase: "inspection", scramble: state.scramble, inspectionStartedAt: action.now };
    }

    case "ARM": {
      if (state.phase !== "inspection") return state;
      return { phase: "ready", scramble: state.scramble, inspectionStartedAt: state.inspectionStartedAt };
    }

    case "RELEASE_TO_RUN": {
      if (state.phase !== "ready") return state;
      const elapsed = action.now - state.inspectionStartedAt;
      const penalty = inspectionPenalty(elapsed);
      if (penalty === "DNF") {
        // Inspection ran out past the grace window before the solve actually started -- no run occurs at all.
        return { phase: "result", scramble: state.scramble, rawTimeMs: 0, penalty: "DNF" };
      }
      return { phase: "running", scramble: state.scramble, runStartedAt: action.now, autoPenalty: penalty };
    }

    case "INSPECTION_TIMEOUT": {
      if (state.phase !== "inspection" && state.phase !== "ready") return state;
      return { phase: "result", scramble: state.scramble, rawTimeMs: 0, penalty: "DNF" };
    }

    case "STOP": {
      if (state.phase !== "running") return state;
      const rawTimeMs = Math.max(0, action.now - state.runStartedAt);
      return { phase: "result", scramble: state.scramble, rawTimeMs, penalty: state.autoPenalty };
    }

    case "SET_PENALTY": {
      if (state.phase !== "result") return state;
      return { ...state, penalty: action.penalty };
    }

    case "CANCEL_SOLVE": {
      if (state.phase !== "inspection" && state.phase !== "ready") return state;
      return { phase: "idle", scramble: state.scramble };
    }

    case "SPACE_DOWN": {
      if (state.phase === "idle") return timerReducer(state, { type: "BEGIN_INSPECTION", now: action.now });
      if (state.phase === "inspection") return timerReducer(state, { type: "ARM", now: action.now });
      if (state.phase === "running") return timerReducer(state, { type: "STOP", now: action.now });
      return state;
    }

    case "SPACE_UP": {
      if (state.phase === "ready") return timerReducer(state, { type: "RELEASE_TO_RUN", now: action.now });
      return state;
    }

    default:
      return state;
  }
}
