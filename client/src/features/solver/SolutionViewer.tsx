/**
 * The interactive solution viewer: wraps a verified solver result with move-by-move
 * playback, built entirely on Phase 3's existing Cube3D/animation-queue and Phase 5's
 * verified SolverSuccess -- no new cube engine, animation system, or solver here.
 */
import type { BaseMoveName, FaceletCube } from "@cube-coach/cube-engine";
import { CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import { Cube3D, type AnimationSpeed, type Cube3DHandle } from "../../three/Cube3D.js";
import { MoveExplanation } from "./MoveExplanation.js";
import { MoveList } from "./MoveList.js";
import { NotationHelp } from "./NotationHelp.js";
import { SolutionControls } from "./SolutionControls.js";
import type { SolverSuccess } from "./useSolver.js";
import { useSolutionPlayer } from "./useSolutionPlayer.js";

interface SolutionViewerProps {
  originalCube: FaceletCube;
  result: SolverSuccess;
}

export function SolutionViewer({ originalCube, result }: SolutionViewerProps) {
  const cubeRef = useRef<Cube3DHandle>(null);
  const [speed, setSpeed] = useState<AnimationSpeed>("normal");
  const player = useSolutionPlayer(originalCube, result.moves, cubeRef);

  const basesUsed = Array.from(new Set(result.moves.map((m) => m.replace(/['2]$/, "")))) as BaseMoveName[];
  const isDone = player.status === "complete" && player.isCurrentCubeSolved;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-100">Solution Found</h3>
          <p className="text-sm text-slate-400">
            {result.moveCount} moves &middot; {result.searchTimeMs.toFixed(0)}ms search time
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
          <CheckCircle2 size={16} />
          Verified Solution
        </div>
      </div>

      <div className="overflow-hidden cc-card" style={{ height: 280 }}>
        <Cube3D
          ref={cubeRef}
          cube={player.currentCube}
          animationSpeed={speed}
          onAnimationComplete={player.handleAnimationComplete}
        />
      </div>

      {isDone && (
        <div className="flex flex-col gap-1 rounded-md border border-emerald-900/60 bg-emerald-950/40 p-3 text-sm font-medium text-emerald-300">
          <span>Solution Complete</span>
          <span className="flex items-center gap-1.5 font-normal">
            <CheckCircle2 size={14} /> Cube Solved
          </span>
          <span className="flex items-center gap-1.5 font-normal">
            <CheckCircle2 size={14} /> Solution Verified
          </span>
        </div>
      )}

      <MoveExplanation moves={result.moves} currentMoveIndex={player.currentMoveIndex} />

      <SolutionControls
        moves={result.moves}
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

      <MoveList moves={result.moves} currentMoveIndex={player.currentMoveIndex} onSelect={player.goTo} />

      <NotationHelp bases={basesUsed} />
    </div>
  );
}
