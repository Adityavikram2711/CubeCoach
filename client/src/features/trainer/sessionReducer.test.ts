import { describe, expect, it } from "vitest";
import { createInitialSessionState, sessionReducer, type SessionState } from "./sessionReducer.js";
import type { TrainerCase } from "./types.js";

function makeCase(caseId: string): TrainerCase {
  return {
    caseId,
    type: "OLL",
    number: 1,
    name: `Case ${caseId}`,
    recognition: "",
    algorithm: "R U R' U'",
    alternatives: [],
    fingerTricks: "",
    notes: "",
    difficulty: "Beginner",
    scrambledState: new Array(54).fill("white"),
  };
}

describe("recognition mode", () => {
  it("starts in the presenting phase with the given case and choices", () => {
    const state = createInitialSessionState("recognition", makeCase("a"), 3, [{ caseId: "a", label: "Case a" }]);
    expect(state.phase).toBe("presenting");
    expect(state.current.caseId).toBe("a");
    expect(state.index).toBe(0);
  });

  it("a correct answer moves to feedback with lastCorrect true and records the attempt", () => {
    const start = createInitialSessionState("recognition", makeCase("a"), 3, []);
    const next = sessionReducer(start, { type: "ANSWER_RECOGNITION", selectedCaseId: "a" });
    expect(next.phase).toBe("feedback");
    expect((next as any).lastCorrect).toBe(true);
    expect(next.attempts).toEqual([{ caseId: "a", type: "OLL", correct: true }]);
  });

  it("an incorrect answer moves to feedback with lastCorrect false", () => {
    const start = createInitialSessionState("recognition", makeCase("a"), 3, []);
    const next = sessionReducer(start, { type: "ANSWER_RECOGNITION", selectedCaseId: "b" });
    expect(next.phase).toBe("feedback");
    expect((next as any).lastCorrect).toBe(false);
    expect(next.attempts).toEqual([{ caseId: "a", type: "OLL", correct: false }]);
  });

  it("ignores ANSWER_RECOGNITION when not in the presenting phase (no double-submit)", () => {
    const start = createInitialSessionState("recognition", makeCase("a"), 3, []);
    const feedback = sessionReducer(start, { type: "ANSWER_RECOGNITION", selectedCaseId: "a" });
    const again = sessionReducer(feedback, { type: "ANSWER_RECOGNITION", selectedCaseId: "b" });
    expect(again).toBe(feedback); // unchanged
  });

  it("ignores REVEAL_RECALL/SUBMIT_RECALL entirely in recognition mode", () => {
    const start = createInitialSessionState("recognition", makeCase("a"), 3, []);
    expect(sessionReducer(start, { type: "REVEAL_RECALL" })).toBe(start);
  });
});

describe("recall mode", () => {
  it("REVEAL_RECALL moves presenting -> revealed without recording an attempt yet", () => {
    const start = createInitialSessionState("recall", makeCase("a"), 3);
    const revealed = sessionReducer(start, { type: "REVEAL_RECALL" });
    expect(revealed.phase).toBe("revealed");
    expect(revealed.attempts).toEqual([]);
  });

  it("SUBMIT_RECALL records the self-assessed attempt and moves to feedback", () => {
    const start = createInitialSessionState("recall", makeCase("a"), 3);
    const revealed = sessionReducer(start, { type: "REVEAL_RECALL" });
    const feedback = sessionReducer(revealed, { type: "SUBMIT_RECALL", correct: true });
    expect(feedback.phase).toBe("feedback");
    expect(feedback.attempts).toEqual([{ caseId: "a", type: "OLL", correct: true }]);
  });

  it("SUBMIT_RECALL is ignored before REVEAL_RECALL (can't self-assess before seeing the answer)", () => {
    const start = createInitialSessionState("recall", makeCase("a"), 3);
    const attempted = sessionReducer(start, { type: "SUBMIT_RECALL", correct: true });
    expect(attempted).toBe(start);
  });
});

describe("NEXT transitions", () => {
  it("moves feedback -> presenting with the next case and increments index", () => {
    const start = createInitialSessionState("recognition", makeCase("a"), 2, []);
    const feedback = sessionReducer(start, { type: "ANSWER_RECOGNITION", selectedCaseId: "a" });
    const nextState = sessionReducer(feedback, { type: "NEXT", nextCase: makeCase("b"), choices: [] });
    expect(nextState.phase).toBe("presenting");
    expect((nextState as any).current.caseId).toBe("b");
    expect((nextState as any).index).toBe(1);
    expect(nextState.attempts).toHaveLength(1); // carried over
  });

  it("moves feedback -> complete when nextCase is null, with a real summary computed from attempts", () => {
    const start = createInitialSessionState("recognition", makeCase("a"), 1, []);
    const feedback = sessionReducer(start, { type: "ANSWER_RECOGNITION", selectedCaseId: "a" });
    const done = sessionReducer(feedback, { type: "NEXT", nextCase: null });
    expect(done.phase).toBe("complete");
    if (done.phase === "complete") {
      expect(done.summary.total).toBe(1);
      expect(done.summary.correct).toBe(1);
      expect(done.summary.accuracy).toBe(100);
    }
  });

  it("ignores NEXT when not in the feedback phase", () => {
    const start = createInitialSessionState("recognition", makeCase("a"), 2, []);
    const unchanged = sessionReducer(start, { type: "NEXT", nextCase: makeCase("b") });
    expect(unchanged).toBe(start);
  });

  it("END_SESSION completes immediately from the presenting phase, dropping the unanswered case", () => {
    const start = createInitialSessionState("recognition", makeCase("a"), 5, []);
    const ended = sessionReducer(start, { type: "END_SESSION" });
    expect(ended.phase).toBe("complete");
    if (ended.phase === "complete") {
      expect(ended.summary).toEqual({ total: 0, correct: 0, incorrect: 0, accuracy: 0, weakCases: [], mostMissed: null });
    }
  });

  it("END_SESSION completes from feedback, keeping already-recorded attempts", () => {
    const start = createInitialSessionState("recognition", makeCase("a"), 5, []);
    const feedback = sessionReducer(start, { type: "ANSWER_RECOGNITION", selectedCaseId: "a" });
    const ended = sessionReducer(feedback, { type: "END_SESSION" });
    expect(ended.phase).toBe("complete");
    if (ended.phase === "complete") expect(ended.summary.total).toBe(1);
  });

  it("END_SESSION is a no-op once already complete", () => {
    const start = createInitialSessionState("recognition", makeCase("a"), 5, []);
    const feedback = sessionReducer(start, { type: "ANSWER_RECOGNITION", selectedCaseId: "a" });
    const done = sessionReducer(feedback, { type: "NEXT", nextCase: null });
    const again = sessionReducer(done, { type: "END_SESSION" });
    expect(again).toBe(done);
  });

  it("a full multi-case session accumulates all attempts correctly into the final summary", () => {
    let state: SessionState = createInitialSessionState("recognition", makeCase("a"), 3, []);
    state = sessionReducer(state, { type: "ANSWER_RECOGNITION", selectedCaseId: "a" }); // correct
    state = sessionReducer(state, { type: "NEXT", nextCase: makeCase("b") });
    state = sessionReducer(state, { type: "ANSWER_RECOGNITION", selectedCaseId: "z" }); // incorrect
    state = sessionReducer(state, { type: "NEXT", nextCase: makeCase("c") });
    state = sessionReducer(state, { type: "ANSWER_RECOGNITION", selectedCaseId: "c" }); // correct
    state = sessionReducer(state, { type: "NEXT", nextCase: null });

    expect(state.phase).toBe("complete");
    if (state.phase === "complete") {
      expect(state.summary).toEqual({ total: 3, correct: 2, incorrect: 1, accuracy: 67, weakCases: ["b"], mostMissed: "b" });
    }
  });
});
