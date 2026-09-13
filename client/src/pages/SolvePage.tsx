import { createSolvedCube, generateScramble, type FaceletCube, type Move } from "@cube-coach/cube-engine";
import { useRef, useState, type CSSProperties } from "react";
import { CubeInputView } from "../features/solver/CubeInputView.js";
import { Cube3D, type AnimationSpeed, type Cube3DHandle } from "../three/Cube3D.js";
import { CubeControls } from "../three/CubeControls.js";

type ViewMode = "cube" | "net";

function tabStyle(active: boolean): { className: string; style?: CSSProperties } {
  if (active) {
    return {
      className: "rounded-md px-4 py-1.5 text-sm font-semibold text-slate-950 transition-all",
      style: { backgroundImage: "linear-gradient(135deg, var(--accent), var(--accent-hover))" },
    };
  }
  return { className: "rounded-md px-4 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-100" };
}

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
    <main className="cc-page flex min-h-[calc(100vh-57px)] flex-col text-slate-50">
      <header className="border-b px-6 py-5" style={{ borderColor: "var(--border)" }}>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Solve a Cube</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Enter your cube configuration, or explore moves in 3D.
        </p>

        <div className="mt-4 inline-flex gap-1 rounded-lg border p-1" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-solid)" }}>
          <button type="button" {...tabStyle(view === "net")} onClick={() => setView("net")}>
            Net View
          </button>
          <button type="button" {...tabStyle(view === "cube")} onClick={() => setView("cube")}>
            Cube View
          </button>
        </div>
      </header>

      <div className="flex-1 p-4">
        {view === "net" && <CubeInputView />}

        {view === "cube" && (
          <div className="flex flex-1 flex-col gap-4 lg:flex-row">
            <div className="cc-card min-h-[420px] flex-1 overflow-hidden">
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
