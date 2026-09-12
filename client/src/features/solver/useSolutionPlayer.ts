import { isSolved, type FaceletCube, type Move } from "@cube-coach/cube-engine";
import { useMemo, useState, type RefObject } from "react";
import type { Cube3DHandle } from "../../three/Cube3D.js";
import { getCubeAtMove } from "./solutionUtils.js";

export type PlaybackStatus = "paused" | "playing" | "complete";

export interface UseSolutionPlayer {
  /** 0 = original cube, before any solution move; N = state after move N. */
  currentMoveIndex: number;
  status: PlaybackStatus;
  /** The cube state to display right now -- feed this straight to Cube3D's `cube` prop. */
  currentCube: FaceletCube;
  /** Whether currentCube is actually solved -- checked directly, not inferred from the index (spec: don't just trust the count). */
  isCurrentCubeSolved: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  goTo: (index: number) => void;
  next: () => void;
  previous: () => void;
  play: () => void;
  pause: () => void;
  restart: () => void;
  /** Called once per completed move animation -- wire this to Cube3D's onAnimationComplete. */
  handleAnimationComplete: () => void;
}

export function useSolutionPlayer(
  originalCube: FaceletCube,
  moves: readonly Move[],
  cubeRef: RefObject<Cube3DHandle>,
): UseSolutionPlayer {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [status, setStatus] = useState<PlaybackStatus>(moves.length === 0 ? "complete" : "paused");

  const currentCube = useMemo(
    () => getCubeAtMove(originalCube, moves, currentMoveIndex),
    [originalCube, moves, currentMoveIndex],
  );
  const isCurrentCubeSolved = useMemo(() => isSolved(currentCube), [currentCube]);

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(moves.length, index));
    if (status === "playing") cubeRef.current?.clearQueue(); // jumping cancels any in-flight animation immediately
    setCurrentMoveIndex(clamped);
    setStatus(clamped >= moves.length ? "complete" : "paused");
  };

  const next = () => {
    if (status === "playing" || currentMoveIndex >= moves.length) return;
    cubeRef.current?.playMove(moves[currentMoveIndex]!);
  };

  const previous = () => goTo(currentMoveIndex - 1);

  const play = () => {
    if (currentMoveIndex >= moves.length) return;
    setStatus("playing");
    cubeRef.current?.playAlgorithm(moves.slice(currentMoveIndex) as Move[]);
  };

  const pause = () => {
    if (status !== "playing") return;
    cubeRef.current?.stopAfterCurrentMove(); // lets the in-flight move land cleanly, drops the rest of the queue
    setStatus("paused");
  };

  const restart = () => {
    cubeRef.current?.clearQueue();
    setCurrentMoveIndex(0);
    setStatus(moves.length === 0 ? "complete" : "paused");
  };

  const handleAnimationComplete = () => {
    setCurrentMoveIndex((i) => {
      const next = i + 1;
      if (next >= moves.length) setStatus("complete");
      return next;
    });
  };

  return {
    currentMoveIndex,
    status,
    currentCube,
    isCurrentCubeSolved,
    canGoPrevious: status !== "playing" && currentMoveIndex > 0,
    canGoNext: status !== "playing" && currentMoveIndex < moves.length,
    goTo,
    next,
    previous,
    play,
    pause,
    restart,
    handleAnimationComplete,
  };
}
