import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-50">
      <h1 className="text-5xl font-bold tracking-tight">CubeCoach</h1>
      <p className="text-lg text-slate-400">Solve. Learn. Practice. Master the Cube.</p>
      <div className="mt-4 flex gap-3">
        <Link to="/solve" className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400">
          Solve a Cube
        </Link>
        <Link
          to="/algorithms"
          className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-slate-500"
        >
          Algorithm Library
        </Link>
      </div>
    </main>
  );
}
