import type { Move } from "@cube-coach/cube-engine";
import { Check, ChevronLeft, ChevronRight, Clipboard, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import type { AnimationSpeed } from "../../three/Cube3D.js";
import type { PlaybackStatus } from "./useSolutionPlayer.js";
import { isEditableTarget } from "./solutionUtils.js";

interface SolutionControlsProps {
  moves: readonly Move[];
  status: PlaybackStatus;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  speed: AnimationSpeed;
  onSpeedChange: (speed: AnimationSpeed) => void;
}

const buttonClass = "cc-btn-secondary px-3 py-2";

export function SolutionControls({
  moves,
  status,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onPlay,
  onPause,
  onRestart,
  speed,
  onSpeedChange,
}: SolutionControlsProps) {
  const [copied, setCopied] = useState(false);

  // Left/Right step, Space toggles play/pause, R restarts -- never while the user is typing elsewhere.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      if (event.key === "ArrowLeft" && canGoPrevious) {
        event.preventDefault();
        onPrevious();
      } else if (event.key === "ArrowRight" && canGoNext) {
        event.preventDefault();
        onNext();
      } else if (event.key === " ") {
        event.preventDefault();
        if (status === "playing") onPause();
        else if (canGoNext) onPlay();
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        onRestart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, canGoPrevious, canGoNext, onPrevious, onNext, onPlay, onPause, onRestart]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(moves.join(" "));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied by the browser; silently ignore rather than show an alarming error.
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={buttonClass} onClick={onPrevious} disabled={!canGoPrevious} aria-label="Previous move">
        <ChevronLeft size={16} />
        Previous
      </button>

      {status === "playing" ? (
        <button type="button" className="cc-btn-primary px-3 py-2" onClick={onPause} aria-label="Pause playback">
          <Pause size={16} />
          Pause
        </button>
      ) : (
        <button type="button" className="cc-btn-primary px-3 py-2" onClick={onPlay} disabled={!canGoNext} aria-label="Play solution">
          <Play size={16} />
          Play
        </button>
      )}

      <button type="button" className={buttonClass} onClick={onNext} disabled={!canGoNext} aria-label="Next move">
        Next
        <ChevronRight size={16} />
      </button>

      <button type="button" className={buttonClass} onClick={onRestart} aria-label="Restart solution">
        <RotateCcw size={16} />
        Restart
      </button>

      <button type="button" className={buttonClass} onClick={handleCopy} aria-label="Copy solution to clipboard">
        {copied ? <Check size={16} /> : <Clipboard size={16} />}
        {copied ? "Copied" : "Copy Solution"}
      </button>

      <label className="ml-auto flex items-center gap-2 text-sm text-slate-300">
        Speed
        <select
          value={speed}
          onChange={(e) => onSpeedChange(e.target.value as AnimationSpeed)}
          className="cc-input w-auto px-2 py-1"
        >
          <option value="slow">Slow</option>
          <option value="normal">Normal</option>
          <option value="fast">Fast</option>
        </select>
      </label>
    </div>
  );
}
