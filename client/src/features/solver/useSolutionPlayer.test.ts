import { applyMoves, createSolvedCube, invertAlgorithm } from "@cube-coach/cube-engine";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Cube3DHandle } from "../../three/Cube3D.js";
import { useSolutionPlayer } from "./useSolutionPlayer.js";

function makeFakeCubeRef() {
  const handle: Cube3DHandle = {
    playMove: vi.fn(),
    playAlgorithm: vi.fn(),
    clearQueue: vi.fn(),
    stopAfterCurrentMove: vi.fn(),
    resetView: vi.fn(),
    isAnimating: vi.fn(() => false),
  };
  return { current: handle };
}

const MOVES = ["R", "U", "R'", "U'", "F", "R", "F'"];

function setup(moves: string[] = MOVES) {
  // scrambled + moves solves, so "reaching the final move" tests can check isCurrentCubeSolved for real.
  const scrambled = applyMoves(createSolvedCube(), invertAlgorithm(moves));
  const cubeRef = makeFakeCubeRef();
  const { result } = renderHook(() => useSolutionPlayer(scrambled, moves, cubeRef));
  return { result, cubeRef, scrambled };
}

describe("useSolutionPlayer", () => {
  it("starts at move 0, paused (or complete if there are no moves)", () => {
    const { result } = setup();
    expect(result.current.currentMoveIndex).toBe(0);
    expect(result.current.status).toBe("paused");
    expect(result.current.canGoPrevious).toBe(false);
    expect(result.current.canGoNext).toBe(true);
  });

  it("a solution with zero moves starts already complete", () => {
    const { result } = setup([]);
    expect(result.current.status).toBe("complete");
    expect(result.current.canGoNext).toBe(false);
  });

  it("next() calls playMove with the correct move and does not itself advance the index", () => {
    const { result, cubeRef } = setup();
    act(() => result.current.next());
    expect(cubeRef.current.playMove).toHaveBeenCalledWith("R");
    // The index only advances via handleAnimationComplete (wired to the real animation finishing).
    expect(result.current.currentMoveIndex).toBe(0);
  });

  it("handleAnimationComplete advances the index by exactly one", () => {
    const { result } = setup();
    act(() => result.current.handleAnimationComplete());
    expect(result.current.currentMoveIndex).toBe(1);
    act(() => result.current.handleAnimationComplete());
    expect(result.current.currentMoveIndex).toBe(2);
  });

  it("reaching the final move via handleAnimationComplete marks status complete", () => {
    const { result } = setup();
    act(() => {
      for (let i = 0; i < MOVES.length; i++) result.current.handleAnimationComplete();
    });
    expect(result.current.currentMoveIndex).toBe(MOVES.length);
    expect(result.current.status).toBe("complete");
    expect(result.current.isCurrentCubeSolved).toBe(true);
    expect(result.current.canGoNext).toBe(false);
  });

  it("goTo jumps directly to an index without calling playMove/playAlgorithm", () => {
    const { result, cubeRef } = setup();
    act(() => result.current.goTo(4));
    expect(result.current.currentMoveIndex).toBe(4);
    expect(result.current.status).toBe("paused");
    expect(cubeRef.current.playMove).not.toHaveBeenCalled();
    expect(cubeRef.current.playAlgorithm).not.toHaveBeenCalled();
  });

  it("goTo clamps to [0, moves.length]", () => {
    const { result } = setup();
    act(() => result.current.goTo(-5));
    expect(result.current.currentMoveIndex).toBe(0);
    act(() => result.current.goTo(999));
    expect(result.current.currentMoveIndex).toBe(MOVES.length);
    expect(result.current.status).toBe("complete");
  });

  it("previous() moves back exactly one index via an instant jump", () => {
    const { result, cubeRef } = setup();
    act(() => result.current.goTo(3));
    act(() => result.current.previous());
    expect(result.current.currentMoveIndex).toBe(2);
    expect(cubeRef.current.playAlgorithm).not.toHaveBeenCalled();
  });

  it("previous() at index 0 is a no-op (stays at 0, canGoPrevious is false)", () => {
    const { result } = setup();
    expect(result.current.canGoPrevious).toBe(false);
    act(() => result.current.previous());
    expect(result.current.currentMoveIndex).toBe(0);
  });

  it("play() sets status to playing and calls playAlgorithm with the remaining moves", () => {
    const { result, cubeRef } = setup();
    act(() => result.current.goTo(2));
    act(() => result.current.play());
    expect(result.current.status).toBe("playing");
    expect(cubeRef.current.playAlgorithm).toHaveBeenCalledWith(MOVES.slice(2));
  });

  it("play() at the final move is a no-op", () => {
    const { result, cubeRef } = setup();
    act(() => result.current.goTo(MOVES.length));
    act(() => result.current.play());
    expect(result.current.status).toBe("complete");
    expect(cubeRef.current.playAlgorithm).not.toHaveBeenCalled();
  });

  it("pause() calls stopAfterCurrentMove (not clearQueue) and returns to paused", () => {
    const { result, cubeRef } = setup();
    act(() => result.current.play());
    act(() => result.current.pause());
    expect(cubeRef.current.stopAfterCurrentMove).toHaveBeenCalledTimes(1);
    expect(cubeRef.current.clearQueue).not.toHaveBeenCalled();
    expect(result.current.status).toBe("paused");
  });

  it("pause() while not playing is a no-op", () => {
    const { result, cubeRef } = setup();
    act(() => result.current.pause());
    expect(cubeRef.current.stopAfterCurrentMove).not.toHaveBeenCalled();
  });

  it("restart() cancels immediately via clearQueue and resets to move 0", () => {
    const { result, cubeRef } = setup();
    act(() => result.current.goTo(5));
    act(() => result.current.play());
    act(() => result.current.restart());
    expect(cubeRef.current.clearQueue).toHaveBeenCalledTimes(1);
    expect(result.current.currentMoveIndex).toBe(0);
    expect(result.current.status).toBe("paused");
  });

  it("goTo while playing cancels immediately via clearQueue (random access always wins over active playback)", () => {
    const { result, cubeRef } = setup();
    act(() => result.current.play());
    act(() => result.current.goTo(1));
    expect(cubeRef.current.clearQueue).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("paused");
  });

  it("next() is a no-op while status is playing (button should be disabled, but guarded anyway)", () => {
    const { result, cubeRef } = setup();
    act(() => result.current.play());
    (cubeRef.current.playMove as ReturnType<typeof vi.fn>).mockClear();
    act(() => result.current.next());
    expect(cubeRef.current.playMove).not.toHaveBeenCalled();
  });

  it("currentCube always matches getCubeAtMove for the current index", () => {
    const { result, scrambled } = setup();
    act(() => result.current.goTo(3));
    expect(result.current.currentCube).toEqual(applyMoves(scrambled, MOVES.slice(0, 3)));
  });
});
