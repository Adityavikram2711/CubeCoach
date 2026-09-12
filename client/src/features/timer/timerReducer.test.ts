import { describe, expect, it } from "vitest";
import { createInitialTimerState, timerReducer, type TimerState } from "./timerReducer.js";

const SCRAMBLE = "R U R' U'";

describe("idle phase", () => {
  it("starts idle with the given scramble", () => {
    const state = createInitialTimerState(SCRAMBLE);
    expect(state).toEqual({ phase: "idle", scramble: SCRAMBLE });
  });

  it("NEW_SCRAMBLE from idle updates the scramble and stays idle", () => {
    const state = createInitialTimerState(SCRAMBLE);
    const next = timerReducer(state, { type: "NEW_SCRAMBLE", scramble: "F2 L D'" });
    expect(next).toEqual({ phase: "idle", scramble: "F2 L D'" });
  });

  it("BEGIN_INSPECTION moves idle -> inspection, recording the timestamp", () => {
    const state = createInitialTimerState(SCRAMBLE);
    const next = timerReducer(state, { type: "BEGIN_INSPECTION", now: 1000 });
    expect(next).toEqual({ phase: "inspection", scramble: SCRAMBLE, inspectionStartedAt: 1000 });
  });

  it("STOP/ARM/SET_PENALTY are no-ops from idle", () => {
    const state = createInitialTimerState(SCRAMBLE);
    expect(timerReducer(state, { type: "ARM", now: 1 })).toBe(state);
    expect(timerReducer(state, { type: "STOP", now: 1 })).toBe(state);
    expect(timerReducer(state, { type: "SET_PENALTY", penalty: "DNF" })).toBe(state);
  });
});

describe("inspection phase", () => {
  const inspecting = timerReducer(createInitialTimerState(SCRAMBLE), { type: "BEGIN_INSPECTION", now: 1000 });

  it("ARM moves inspection -> ready, keeping the original inspection start time", () => {
    const ready = timerReducer(inspecting, { type: "ARM", now: 1500 });
    expect(ready).toEqual({ phase: "ready", scramble: SCRAMBLE, inspectionStartedAt: 1000 });
  });

  it("CANCEL_SOLVE returns to idle with the same scramble, no record", () => {
    const cancelled = timerReducer(inspecting, { type: "CANCEL_SOLVE" });
    expect(cancelled).toEqual({ phase: "idle", scramble: SCRAMBLE });
  });

  it("NEW_SCRAMBLE is refused mid-inspection (cannot change the scramble during an active attempt)", () => {
    expect(timerReducer(inspecting, { type: "NEW_SCRAMBLE", scramble: "F2" })).toBe(inspecting);
  });

  it("INSPECTION_TIMEOUT (17s+ with no input) goes straight to a DNF result with no run", () => {
    const timedOut = timerReducer(inspecting, { type: "INSPECTION_TIMEOUT" });
    expect(timedOut).toEqual({ phase: "result", scramble: SCRAMBLE, rawTimeMs: 0, penalty: "DNF" });
  });
});

describe("ready phase -> RELEASE_TO_RUN", () => {
  function readyAt(inspectionStartedAt: number): TimerState {
    const inspecting = timerReducer(createInitialTimerState(SCRAMBLE), { type: "BEGIN_INSPECTION", now: inspectionStartedAt });
    return timerReducer(inspecting, { type: "ARM", now: inspectionStartedAt + 100 });
  }

  it("releasing within 15s starts running with no auto-penalty", () => {
    const ready = readyAt(0);
    const running = timerReducer(ready, { type: "RELEASE_TO_RUN", now: 10_000 });
    expect(running).toEqual({ phase: "running", scramble: SCRAMBLE, runStartedAt: 10_000, autoPenalty: "NONE" });
  });

  it("releasing between 15s and 17s starts running with an auto +2", () => {
    const ready = readyAt(0);
    const running = timerReducer(ready, { type: "RELEASE_TO_RUN", now: 16_000 });
    expect(running).toEqual({ phase: "running", scramble: SCRAMBLE, runStartedAt: 16_000, autoPenalty: "PLUS_TWO" });
  });

  it("releasing exactly at 15s is still NONE (boundary is inclusive)", () => {
    const ready = readyAt(0);
    const running = timerReducer(ready, { type: "RELEASE_TO_RUN", now: 15_000 });
    expect((running as any).autoPenalty).toBe("NONE");
  });

  it("releasing past 17s never starts a run -- it's an immediate DNF result", () => {
    const ready = readyAt(0);
    const result = timerReducer(ready, { type: "RELEASE_TO_RUN", now: 17_001 });
    expect(result).toEqual({ phase: "result", scramble: SCRAMBLE, rawTimeMs: 0, penalty: "DNF" });
  });

  it("CANCEL_SOLVE also works from ready", () => {
    const ready = readyAt(0);
    expect(timerReducer(ready, { type: "CANCEL_SOLVE" })).toEqual({ phase: "idle", scramble: SCRAMBLE });
  });
});

describe("running phase", () => {
  const running = timerReducer(
    timerReducer(
      timerReducer(createInitialTimerState(SCRAMBLE), { type: "BEGIN_INSPECTION", now: 0 }),
      { type: "ARM", now: 0 },
    ),
    { type: "RELEASE_TO_RUN", now: 5000 },
  );

  it("STOP computes rawTimeMs from real elapsed time and carries over the auto-penalty", () => {
    const result = timerReducer(running, { type: "STOP", now: 5000 + 12_470 });
    expect(result).toEqual({ phase: "result", scramble: SCRAMBLE, rawTimeMs: 12_470, penalty: "NONE" });
  });

  it("NEW_SCRAMBLE and CANCEL_SOLVE are refused while running -- must stop first", () => {
    expect(timerReducer(running, { type: "NEW_SCRAMBLE", scramble: "F2" })).toBe(running);
    expect(timerReducer(running, { type: "CANCEL_SOLVE" })).toBe(running);
  });

  it("never produces a negative rawTimeMs even if timestamps are pathological", () => {
    const result = timerReducer(running, { type: "STOP", now: 4000 }); // "now" before runStartedAt, shouldn't happen but must not crash/go negative
    expect((result as any).rawTimeMs).toBe(0);
  });
});

describe("result phase", () => {
  const result = timerReducer(
    timerReducer(
      timerReducer(timerReducer(createInitialTimerState(SCRAMBLE), { type: "BEGIN_INSPECTION", now: 0 }), { type: "ARM", now: 0 }),
      { type: "RELEASE_TO_RUN", now: 0 },
    ),
    { type: "STOP", now: 12_470 },
  );

  it("starts with the auto-penalty from inspection (NONE here)", () => {
    expect((result as any).penalty).toBe("NONE");
  });

  it("SET_PENALTY lets the user override the penalty without touching rawTimeMs", () => {
    const withPlusTwo = timerReducer(result, { type: "SET_PENALTY", penalty: "PLUS_TWO" });
    expect((withPlusTwo as any).penalty).toBe("PLUS_TWO");
    expect((withPlusTwo as any).rawTimeMs).toBe(12_470);

    const withDnf = timerReducer(withPlusTwo, { type: "SET_PENALTY", penalty: "DNF" });
    expect((withDnf as any).penalty).toBe("DNF");
    expect((withDnf as any).rawTimeMs).toBe(12_470); // raw time is never discarded even under DNF
  });

  it("NEW_SCRAMBLE from result returns to idle with a fresh scramble", () => {
    const next = timerReducer(result, { type: "NEW_SCRAMBLE", scramble: "F2 L D'" });
    expect(next).toEqual({ phase: "idle", scramble: "F2 L D'" });
  });

  it("ARM/RELEASE_TO_RUN/CANCEL_SOLVE are no-ops from result", () => {
    expect(timerReducer(result, { type: "ARM", now: 1 })).toBe(result);
    expect(timerReducer(result, { type: "CANCEL_SOLVE" })).toBe(result);
  });
});

describe("SPACE_DOWN / SPACE_UP (phase-agnostic keyboard intent)", () => {
  it("SPACE_DOWN maps to BEGIN_INSPECTION from idle", () => {
    const idle = createInitialTimerState(SCRAMBLE);
    const next = timerReducer(idle, { type: "SPACE_DOWN", now: 1000 });
    expect(next).toEqual({ phase: "inspection", scramble: SCRAMBLE, inspectionStartedAt: 1000 });
  });

  it("SPACE_DOWN maps to ARM from inspection", () => {
    const inspecting = timerReducer(createInitialTimerState(SCRAMBLE), { type: "BEGIN_INSPECTION", now: 0 });
    const next = timerReducer(inspecting, { type: "SPACE_DOWN", now: 500 });
    expect(next).toEqual({ phase: "ready", scramble: SCRAMBLE, inspectionStartedAt: 0 });
  });

  it("SPACE_DOWN maps to STOP from running", () => {
    const running = timerReducer(
      timerReducer(timerReducer(createInitialTimerState(SCRAMBLE), { type: "BEGIN_INSPECTION", now: 0 }), { type: "ARM", now: 0 }),
      { type: "RELEASE_TO_RUN", now: 0 },
    );
    const next = timerReducer(running, { type: "SPACE_DOWN", now: 5000 });
    expect(next).toEqual({ phase: "result", scramble: SCRAMBLE, rawTimeMs: 5000, penalty: "NONE" });
  });

  it("SPACE_DOWN is a no-op from ready/result", () => {
    const ready = timerReducer(timerReducer(createInitialTimerState(SCRAMBLE), { type: "BEGIN_INSPECTION", now: 0 }), { type: "ARM", now: 0 });
    expect(timerReducer(ready, { type: "SPACE_DOWN", now: 100 })).toBe(ready);
  });

  it("SPACE_UP maps to RELEASE_TO_RUN from ready, and is a no-op everywhere else", () => {
    const ready = timerReducer(timerReducer(createInitialTimerState(SCRAMBLE), { type: "BEGIN_INSPECTION", now: 0 }), { type: "ARM", now: 0 });
    const running = timerReducer(ready, { type: "SPACE_UP", now: 1000 });
    expect(running).toEqual({ phase: "running", scramble: SCRAMBLE, runStartedAt: 1000, autoPenalty: "NONE" });

    const idle = createInitialTimerState(SCRAMBLE);
    expect(timerReducer(idle, { type: "SPACE_UP", now: 1 })).toBe(idle);
  });

  it("three SPACE actions applied in sequence (as if from one synchronous batch) correctly reach running, since each dispatch sees the true prior state, not a stale closure", () => {
    let state: TimerState = createInitialTimerState(SCRAMBLE);
    state = timerReducer(state, { type: "SPACE_DOWN", now: 0 }); // idle -> inspection
    state = timerReducer(state, { type: "SPACE_DOWN", now: 100 }); // inspection -> ready
    state = timerReducer(state, { type: "SPACE_UP", now: 200 }); // ready -> running
    expect(state.phase).toBe("running");
  });
});
