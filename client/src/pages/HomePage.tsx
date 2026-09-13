import { Blocks, Sparkles, Timer as TimerIcon } from "lucide-react";
import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Real Two-Phase Solver",
    description: "An actual implementation of the algorithm family behind Kociemba's solver -- every solution independently re-verified before it's shown.",
    to: "/solve",
  },
  {
    icon: Blocks,
    title: "Verified Algorithm Library",
    description: "57 OLL, 21 PLL, and 24 F2L cases -- each one generated and re-verified against the cube engine, not transcribed from memory.",
    to: "/algorithms",
  },
  {
    icon: TimerIcon,
    title: "Trainer & Speed Timer",
    description: "Recognition and recall practice with weak-case weighting, plus a WCA-style inspection timer with Ao5/Ao12/Ao50 statistics.",
    to: "/trainer",
  },
];

export function HomePage() {
  return (
    <main className="cc-page flex flex-col">
      <section className="flex min-h-[calc(80vh-57px)] flex-col items-center justify-center gap-5 px-6 py-16 text-center">
        <span className="cc-badge">Solve. Learn. Practice. Master the Cube.</span>
        <h1 className="cc-heading-gradient text-5xl font-bold tracking-tight sm:text-6xl">CubeCoach</h1>
        <p className="max-w-xl text-lg" style={{ color: "var(--text-muted)" }}>
          A genuine two-phase solver, a fully verified algorithm library, a trainer, and a speedcubing timer -- all
          driven by one shared cube engine.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link to="/solve" className="cc-btn-primary">
            Solve a Cube
          </Link>
          <Link to="/algorithms" className="cc-btn-secondary">
            Algorithm Library
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-6 pb-16 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <Link key={feature.title} to={feature.to} className="cc-card-interactive flex flex-col gap-3 p-5">
            <feature.icon size={22} style={{ color: "var(--accent)" }} />
            <h2 className="font-semibold text-slate-100">{feature.title}</h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {feature.description}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
