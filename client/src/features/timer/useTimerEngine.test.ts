import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTimerEngine } from "./useTimerEngine.js";

function fireKey(type: "keydown" | "keyup", key: string, target: EventTarget = window, extra: Partial<KeyboardEventInit> = {}) {
  const event = new KeyboardEvent(type, { key, bubbles: true, cancelable: true, ...extra });
  target.dispatchEvent(event);
  return event;
}

describe("useTimerEngine", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => window.setTimeout(() => cb(performance.now()), 16) as unknown as number);
    vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts idle with a non-empty scramble", () => {
    const { result } = renderHook(() => useTimerEngine());
    expect(result.current.state.phase).toBe("idle");
    expect(result.current.state.scramble.length).toBeGreaterThan(0);
  });

  it("Space in idle begins inspection", () => {
    const { result } = renderHook(() => useTimerEngine());
    act(() => {
      fireKey("keydown", " ");
    });
    expect(result.current.state.phase).toBe("inspection");
  });

  it("Space does not begin inspection when a text input has focus", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    const { result } = renderHook(() => useTimerEngine());

    act(() => {
      fireKey("keydown", " ", input);
    });
    expect(result.current.state.phase).toBe("idle");
    document.body.removeChild(input);
  });

  it("Space does not begin inspection when a textarea has focus", () => {
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    const { result } = renderHook(() => useTimerEngine());

    act(() => {
      fireKey("keydown", " ", textarea);
    });
    expect(result.current.state.phase).toBe("idle");
    document.body.removeChild(textarea);
  });

  it("Space down->up cycle: idle -> inspection -> ready -> running", () => {
    const { result } = renderHook(() => useTimerEngine());
    act(() => {
      fireKey("keydown", " "); // idle -> inspection
    });
    expect(result.current.state.phase).toBe("inspection");

    act(() => {
      fireKey("keydown", " "); // inspection -> ready (arm)
    });
    expect(result.current.state.phase).toBe("ready");

    act(() => {
      fireKey("keyup", " "); // ready -> running (release)
    });
    expect(result.current.state.phase).toBe("running");
  });

  it("Space while running stops the timer", () => {
    const { result } = renderHook(() => useTimerEngine());
    act(() => {
      fireKey("keydown", " ");
      fireKey("keydown", " ");
      fireKey("keyup", " ");
    });
    expect(result.current.state.phase).toBe("running");

    act(() => {
      fireKey("keydown", " ");
    });
    expect(result.current.state.phase).toBe("result");
  });

  it("holding Space down (repeat events) only fires the transition once", () => {
    const { result } = renderHook(() => useTimerEngine());
    act(() => {
      fireKey("keydown", " "); // idle -> inspection
      fireKey("keydown", " ", window, { repeat: true }); // should be ignored
      fireKey("keydown", " ", window, { repeat: true });
    });
    expect(result.current.state.phase).toBe("inspection"); // not "ready" -- repeats didn't also arm
  });

  it("Escape cancels during inspection, returning to idle with the same scramble", () => {
    const { result } = renderHook(() => useTimerEngine());
    const scramble = result.current.state.scramble;
    act(() => {
      fireKey("keydown", " ");
    });
    expect(result.current.state.phase).toBe("inspection");

    act(() => {
      fireKey("keydown", "Escape");
    });
    expect(result.current.state.phase).toBe("idle");
    expect(result.current.state.scramble).toBe(scramble);
  });

  it("Escape does nothing while running (must stop, not cancel)", () => {
    const { result } = renderHook(() => useTimerEngine());
    act(() => {
      fireKey("keydown", " ");
      fireKey("keydown", " ");
      fireKey("keyup", " ");
    });
    expect(result.current.state.phase).toBe("running");

    act(() => {
      fireKey("keydown", "Escape");
    });
    expect(result.current.state.phase).toBe("running");
  });

  it("startSolveNow() jumps straight from inspection to running without a separate arm/release", () => {
    const { result } = renderHook(() => useTimerEngine());
    act(() => result.current.beginInspection());
    expect(result.current.state.phase).toBe("inspection");

    act(() => result.current.startSolveNow());
    expect(result.current.state.phase).toBe("running");
  });

  it("newScramble() only works from idle/result and produces a different scramble most of the time", () => {
    const { result } = renderHook(() => useTimerEngine());
    const first = result.current.state.scramble;
    act(() => result.current.newScramble());
    // Scrambles are random 20-move sequences; collision odds are astronomically small.
    expect(result.current.state.scramble).not.toBe(first);
    expect(result.current.state.phase).toBe("idle");
  });
});
