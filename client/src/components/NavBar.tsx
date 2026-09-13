import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";

const NAV_LINKS = [
  { to: "/solve", label: "Solve" },
  { to: "/algorithms", label: "Algorithms" },
  { to: "/trainer", label: "Trainer" },
  { to: "/timer", label: "Timer" },
];

export function NavBar() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();

  const linkClass = (to: string) =>
    `relative px-1 py-1 text-sm font-medium transition-colors ${
      location.pathname === to ? "text-slate-50" : "text-slate-300 hover:text-slate-50"
    }`;

  return (
    <nav
      className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3 backdrop-blur-md"
      style={{ borderColor: "var(--border)", backgroundColor: "rgba(8, 11, 20, 0.85)" }}
    >
      <Link to="/" className="cc-heading-gradient text-lg font-bold tracking-tight">
        CubeCoach
      </Link>
      <div className="flex flex-wrap items-center gap-y-2 text-sm">
        <div className="flex flex-wrap items-center gap-x-5">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={linkClass(link.to)}>
              {link.label}
              {location.pathname === link.to && (
                <span className="absolute -bottom-3 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
              )}
            </Link>
          ))}
        </div>

        <div className="ml-5 flex flex-wrap items-center gap-x-4 border-l pl-5" style={{ borderColor: "var(--border)" }}>
          {status === "authenticated" && user ? (
            <>
              <Link to="/profile" className={linkClass("/profile")}>
                {user.username}
                {location.pathname === "/profile" && (
                  <span className="absolute -bottom-3 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                )}
              </Link>
              <button type="button" onClick={logout} className="text-slate-400 transition-colors hover:text-slate-100">
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClass("/login")}>
                Log In
              </Link>
              <Link to="/register" className="cc-btn-primary px-3 py-1.5 text-xs">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
