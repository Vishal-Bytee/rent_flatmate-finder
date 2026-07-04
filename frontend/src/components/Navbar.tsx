import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDarkMode } from "../hooks/useDarkMode";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useDarkMode();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 dark:border-sand/10 bg-sand/90 dark:bg-ink/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-display text-xl font-semibold tracking-tight">
           Rent & Flatmate Finder<span className="text-clay">.</span>
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link to="/browse" className="hover:text-teal transition-colors">Browse rooms</Link>

          {user?.role === "OWNER" && (
            <Link to="/owner" className="hover:text-teal transition-colors">Owner dashboard</Link>
          )}
          {user?.role === "TENANT" && (
            <Link to="/tenant" className="hover:text-teal transition-colors">My dashboard</Link>
          )}
          {user?.role === "ADMIN" && (
            <Link to="/admin" className="hover:text-teal transition-colors">Admin</Link>
          )}

          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="focus-ring rounded-full px-2 py-1 hover:bg-ink/5 dark:hover:bg-sand/10"
          >
            {dark ? "☀️" : "🌙"}
          </button>

          {user ? (
            <>
              <Link to="/profile" className="hover:text-teal transition-colors">{user.name}</Link>
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="focus-ring rounded-lg bg-ink text-sand dark:bg-sand dark:text-ink px-3 py-1.5 font-medium hover:opacity-90"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-teal transition-colors">Log in</Link>
              <Link
                to="/register"
                className="focus-ring rounded-lg bg-teal text-sand px-3 py-1.5 font-medium hover:opacity-90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
