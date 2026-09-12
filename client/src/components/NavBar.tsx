import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";

export function NavBar() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-slate-800 bg-slate-950 px-4 py-2.5">
      <Link to="/" className="font-bold text-slate-100">
        CubeCoach
      </Link>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <Link to="/solve" className="text-slate-300 hover:text-slate-100">
          Solve
        </Link>
        <Link to="/algorithms" className="text-slate-300 hover:text-slate-100">
          Algorithms
        </Link>
        <Link to="/trainer" className="text-slate-300 hover:text-slate-100">
          Trainer
        </Link>
        <Link to="/timer" className="text-slate-300 hover:text-slate-100">
          Timer
        </Link>
        {status === "authenticated" && user ? (
          <>
            <Link to="/profile" className="text-slate-300 hover:text-slate-100">
              {user.username}
            </Link>
            <button type="button" onClick={logout} className="text-slate-400 hover:text-slate-100">
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-slate-300 hover:text-slate-100">
              Log In
            </Link>
            <Link to="/register" className="rounded-md bg-sky-500 px-3 py-1 font-semibold text-slate-950 hover:bg-sky-400">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
