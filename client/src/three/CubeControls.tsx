import type { BaseMoveName, Move } from "@cube-coach/cube-engine";
import type { AnimationSpeed } from "./Cube3D.js";

const BASIC_FACES: BaseMoveName[] = ["U", "D", "L", "R", "F", "B"];
const ADVANCED_MOVES: BaseMoveName[] = ["M", "E", "S", "Uw", "Dw", "Lw", "Rw", "Fw", "Bw", "x", "y", "z"];
const SUFFIXES: Array<"" | "'" | "2"> = ["", "'", "2"];

interface CubeControlsProps {
  onMove: (move: Move) => void;
  onReset: () => void;
  onScramble: () => void;
  onResetView: () => void;
  speed: AnimationSpeed;
  onSpeedChange: (speed: AnimationSpeed) => void;
}

const buttonClass = "cc-btn-secondary min-w-[2.75rem] px-2 py-1.5 text-sm";

function MoveButtonRow({ moves, onMove }: { moves: BaseMoveName[]; onMove: (move: Move) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {moves.map((base) =>
        SUFFIXES.map((suffix) => (
          <button
            key={`${base}${suffix}`}
            type="button"
            className={buttonClass}
            onClick={() => onMove(`${base}${suffix}`)}
          >
            {base}
            {suffix}
          </button>
        )),
      )}
    </div>
  );
}

export function CubeControls({ onMove, onReset, onScramble, onResetView, speed, onSpeedChange }: CubeControlsProps) {
  return (
    <div className="cc-card flex flex-col gap-4 p-4">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Face moves</h3>
        <MoveButtonRow moves={BASIC_FACES} onMove={onMove} />
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Slice, wide &amp; rotation moves
        </h3>
        <MoveButtonRow moves={ADVANCED_MOVES} onMove={onMove} />
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <button type="button" className={buttonClass} onClick={onReset}>
          Reset Cube
        </button>
        <button type="button" className={buttonClass} onClick={onScramble}>
          Scramble
        </button>
        <button type="button" className={buttonClass} onClick={onResetView}>
          Reset View
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
    </div>
  );
}
