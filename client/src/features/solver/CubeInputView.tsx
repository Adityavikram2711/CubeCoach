import { useEffect } from "react";
import { Cube3D } from "../../three/Cube3D.js";
import { CubeNet } from "./CubeNet.js";
import { ColorPalette } from "./ColorPalette.js";
import { SolutionPanel } from "./SolutionPanel.js";
import { SolutionViewer } from "./SolutionViewer.js";
import { ValidationPanel } from "./ValidationPanel.js";
import { toFaceletCube } from "./cubeInput.js";
import { useCubeInput } from "./useCubeInput.js";
import { useSolver } from "./useSolver.js";

const secondaryButtonClass = "cc-btn-secondary px-3 py-1.5";

export function CubeInputView() {
  const input = useCubeInput();
  const solver = useSolver();

  // A stale solution must never be offered for playback once the user edits the input
  // it was computed from -- editing already clears input.validation for the same reason.
  useEffect(() => {
    if (solver.state.status !== "idle") solver.reset();
  }, [input.facelets]);

  const handleSolve = () => {
    if (input.validation?.valid !== true) return;
    solver.solve(toFaceletCube(input.facelets));
  };

  const hasInteractiveSolution = solver.state.status === "success" && solver.state.result.moveCount > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          <div>
            <p className="text-sm text-slate-400">
              Hold the cube with the white center on top and the green center facing you, then enter the visible
              stickers. Centers (locked, with a lock icon) already establish orientation for you:{" "}
              <span className="text-slate-300">U=white, R=red, F=green, D=yellow, L=orange, B=blue.</span>
            </p>
          </div>

          <div className="cc-card flex justify-center p-4">
            <CubeNet facelets={input.facelets} onPaint={input.paintSticker} />
          </div>

          <ColorPalette selected={input.selectedColor} onSelect={input.selectColor} />

          <div className="flex flex-wrap gap-2">
            <button type="button" className={secondaryButtonClass} onClick={input.undo} disabled={!input.canUndo}>
              Undo
            </button>
            <button type="button" className={secondaryButtonClass} onClick={input.reset}>
              Reset
            </button>
            <button type="button" className={secondaryButtonClass} onClick={input.clear}>
              Clear
            </button>
          </div>

          {/* Once there's an interactive solution, its own 3D player replaces this plain preview. */}
          {input.complete && !hasInteractiveSolution && (
            <div className="cc-card overflow-hidden" style={{ height: 260 }}>
              <Cube3D cube={toFaceletCube(input.facelets)} />
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-96">
          <div className="cc-card p-4">
            <ValidationPanel
              filledCount={input.filledCount}
              totalEditable={input.totalEditable}
              colorCounts={input.colorCounts}
              validation={input.validation}
              onValidate={input.validate}
              onSolve={handleSolve}
            />
          </div>

          {!hasInteractiveSolution && <SolutionPanel state={solver.state} />}
        </div>
      </div>

      {solver.state.status === "success" && solver.state.result.moveCount > 0 && (
        <div className="cc-card p-4">
          <SolutionViewer originalCube={toFaceletCube(input.facelets)} result={solver.state.result} />
        </div>
      )}
    </div>
  );
}
