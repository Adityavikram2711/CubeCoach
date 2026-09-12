import { generateScramble } from "@cube-coach/cube-engine";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { isEditableTarget } from "../solver/solutionUtils.js";
import { createInitialTimerState, timerReducer } from "./timerReducer.js";
import { INSPECTION_GRACE_MS, type Penalty } from "./types.js";

function newScrambleString(): string {
  return generateScramble(20).join(" ");
}

/** Space should start/stop the timer, but never while a form control has focus -- reuses Phase 6's guard, plus buttons (so Tab-focused "New Scramble" etc. don't double-fire: one native click from Space, and a second global timer action). */
function shouldIgnoreGlobalKey(target: EventTarget | null): boolean {
  if (isEditableTarget(target)) return true;
  return target instanceof HTMLElement && target.tagName === "BUTTON";
}

export function useTimerEngine() {
  const [state, dispatch] = useReducer(timerReducer, undefined, () => createInitialTimerState(newScrambleString()));
  const [displayNow, setDisplayNow] = useState(() => performance.now());
  const rafRef = useRef<number | null>(null);

  const isTicking = state.phase === "inspection" || state.phase === "ready" || state.phase === "running";

  // Drives the LIVE DISPLAY only -- every frame re-reads performance.now() and computes
  // elapsed as a fresh subtraction (see TimerDisplay.tsx), never accumulating a running
  // total. This is what "timestamp-based, not += every tick" means in practice: even if
  // a frame is dropped or the tab is backgrounded, the very next frame's calculation is
  // still exactly correct, because it derives from real timestamps rather than however
  // many ticks fired.
  useEffect(() => {
    if (!isTicking) return;
    const loop = () => {
      setDisplayNow(performance.now());
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isTicking]);

  // Inspection timeout: once past the 17s grace window with no input at all, force a DNF.
  useEffect(() => {
    if (state.phase !== "inspection") return;
    if (displayNow - state.inspectionStartedAt >= INSPECTION_GRACE_MS) {
      dispatch({ type: "INSPECTION_TIMEOUT" });
    }
  }, [state, displayNow]);

  const beginInspection = useCallback(() => dispatch({ type: "BEGIN_INSPECTION", now: performance.now() }), []);
  const stop = useCallback(() => dispatch({ type: "STOP", now: performance.now() }), []);
  /** For mouse/touch: a single "Start Solve" tap during inspection, with no hold gesture. Dispatches ARM then RELEASE_TO_RUN against the same timestamp, so inspection-elapsed is computed exactly as if the two happened at once. */
  const startSolveNow = useCallback(() => {
    const now = performance.now();
    dispatch({ type: "ARM", now });
    dispatch({ type: "RELEASE_TO_RUN", now });
  }, []);
  const cancel = useCallback(() => dispatch({ type: "CANCEL_SOLVE" }), []);
  const setPenalty = useCallback((penalty: Penalty) => dispatch({ type: "SET_PENALTY", penalty }), []);
  const newScramble = useCallback(() => dispatch({ type: "NEW_SCRAMBLE", scramble: newScrambleString() }), []);

  // Mounted once: the handlers below never branch on `state.phase` themselves (that
  // would mean reading `state` from a closure captured when this effect last ran,
  // which is only after a render commits -- several keydown/keyup events dispatched
  // synchronously in the same batch would then all be judged against the *first*
  // event's phase, silently dropping the 2nd/3rd). Instead they dispatch a
  // phase-agnostic SPACE_DOWN/SPACE_UP intent and let the reducer -- which always
  // threads the true current state correctly, even across several dispatches in one
  // batch -- decide what it means. See timerReducer.ts's SPACE_DOWN/SPACE_UP cases.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreGlobalKey(event.target)) return;

      if (event.key === "Escape") {
        cancel(); // no-op via the reducer's own guard if not in inspection/ready
        return;
      }

      if (event.key !== " ") return;
      event.preventDefault(); // always -- this is exactly the "avoid browser-default spacebar scrolling" requirement
      if (event.repeat) return; // holding the key fires keydown repeatedly; only the first matters
      dispatch({ type: "SPACE_DOWN", now: performance.now() });
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (shouldIgnoreGlobalKey(event.target)) return;
      if (event.key !== " ") return;
      event.preventDefault();
      dispatch({ type: "SPACE_UP", now: performance.now() });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [cancel]);

  return {
    state,
    displayNow,
    beginInspection,
    stop,
    startSolveNow,
    cancel,
    setPenalty,
    newScramble,
  };
}
