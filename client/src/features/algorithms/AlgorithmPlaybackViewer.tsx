/**
 * Case playback: reuses Phase 3's Cube3D/animation queue and Phase 6's
 * useSolutionPlayer/SolutionControls/MoveList/NotationHelp exactly as SolutionViewer
 * does -- the only new piece here is that "done" means "the case's own goal state" (an
 * oriented last layer for OLL, a solved cube for PLL, a placed pair for F2L), not always
 * a fully solved cube, so this never claims isSolved() when that isn't the real goal.
 */
import type { BaseMoveName, FaceletCube, Move } from "@cube-coach/cube-engine";
import { isSolved, parseAlgorithm } from "@cube-coach/cube-engine";
import { CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import { Cube3D, type AnimationSpeed, type Cube3DHandle } from "../../three/Cube3D.js";
import type { AlgorithmType } from "../../api/algorithms.js";
import { MoveExplanation } from "../solver/MoveExplanation.js";
import { MoveList } from "../solver/MoveList.js";
import { NotationHelp } from "../solver/NotationHelp.js";
import { SolutionControls } from "../solver/SolutionControls.js";
import { useSolutionPlayer } from "../solver/useSolutionPlayer.js";

interface AlgorithmPlaybackViewerProps {
  type: AlgorithmType;
  scrambledState: FaceletCube;
  algorithm: string;
}

const DONE_LABEL: Record<AlgorithmType, string> = {
  OLL: "Last Layer Oriented",
  PLL: "Cube Solved",
  F2L: "Pair Placed",
};

export function AlgorithmPlaybackViewer({ type, scrambledState, algorithm }: AlgorithmPlaybackViewerProps) {
  const cubeRef = useRef<Cube3DHandle>(null);
  const [speed, setSpeed] = useState<AnimationSpeed>("normal");
  const moves = parseAlgorithm(algorithm) as Move[];
  const player = useSolutionPlayer(scrambledState, moves, cubeRef);

  // Only PLL's goal is literally isSolved(); OLL/F2L cases legitimately leave other
  // pieces unsolved by design, so re-derive the real completion signal instead of
  // reusing player.isCurrentCubeSolved (which is always a plain isSolved() check).
  const isDone = player.status === "complete" && (type !== "PLL" || isSolved(player.currentCube));

  const basesUsed = Array.from(new Set(moves.map((m) => m.replace(/['2]$/, "")))) as BaseMoveName[];

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden cc-card" style={{ height: 280 }}>
        <Cube3D
          ref={cubeRef}
          cube={player.currentCube}
          animationSpeed={speed}
          onAnimationComplete={player.handleAnimationComplete}
        />
      </div>

      {isDone && (
        <div className="flex items-center gap-1.5 rounded-md border border-emerald-900/60 bg-emerald-950/40 p-3 text-sm font-medium text-emerald-300">
          <CheckCircle2 size={14} /> {DONE_LABEL[type]}
        </div>
      )}

      <MoveExplanation moves={moves} currentMoveIndex={player.currentMoveIndex} />

      <SolutionControls
        moves={moves}
        status={player.status}
        canGoPrevious={player.canGoPrevious}
        canGoNext={player.canGoNext}
        onPrevious={player.previous}
        onNext={player.next}
        onPlay={player.play}
        onPause={player.pause}
        onRestart={player.restart}
        speed={speed}
        onSpeedChange={setSpeed}
      />

      <MoveList moves={moves} currentMoveIndex={player.currentMoveIndex} onSelect={player.goTo} />

      <NotationHelp bases={basesUsed} />
    </div>
  );
}
