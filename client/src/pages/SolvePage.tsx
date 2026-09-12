import { createSolvedCube, generateScramble, type FaceletCube, type Move } from "@cube-coach/cube-engine";
import { useRef, useState } from "react";
import { CubeInputView } from "../features/solver/CubeInputView.js";
import { Cube3D, type AnimationSpeed, type Cube3DHandle } from "../three/Cube3D.js";
import { CubeControls } from "../three/CubeControls.js";

type ViewMode = "cube" | "net";

const tabClass = (active: boolean) =>
  `rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
    active ? "bg-slate-800 text-slate-50" : "text-slate-400 hover:text-slate-200"
  }`;

export function SolvePage() {
  const [view, setView] = useState<ViewMode>("net");
  const [cube, setCube] = useState<FaceletCube>(createSolvedCube);
  const [speed, setSpeed] = useState<AnimationSpeed>("normal");
  const cubeRef = useRef<Cube3DHandle>(null);

  const handleMove = (move: Move) => cubeRef.current?.playMove(move);

  const handleReset = () => {
    cubeRef.current?.clearQueue();
    setCube(createSolvedCube());
  };

  const handleScramble = () => {
    const scramble = generateScramble(20);
    cubeRef.current?.playAlgorithm(scramble);
  };

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 px-6 py-4">
        <h1 className="text-2xl font-bold tracking-tight">Solve a Cube</h1>
        <p className="text-sm text-slate-400">Enter your cube configuration, or explore moves in 3D.</p>

        <div className="mt-3 inline-flex gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
          <button type="button" className={tabClass(view === "net")} onClick={() => setView("net")}>
            Net View
          </button>
          <button type="button" className={tabClass(view === "cube")} onClick={() => setView("cube")}>
            Cube View
          </button>
        </div>
      </header>

      <div className="flex-1 p-4">
        {view === "net" && <CubeInputView />}

        {view === "cube" && (
          <div className="flex flex-1 flex-col gap-4 lg:flex-row">
            <div className="min-h-[420px] flex-1 overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
              <Cube3D ref={cubeRef} cube={cube} animationSpeed={speed} onCubeChange={setCube} />
            </div>

            <div className="w-full lg:w-96">
              <CubeControls
                onMove={handleMove}
                onReset={handleReset}
                onScramble={handleScramble}
                onResetView={() => cubeRef.current?.resetView()}
                speed={speed}
                onSpeedChange={setSpeed}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
