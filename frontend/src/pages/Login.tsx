import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "../lib/toast";
import { useAuth } from "../hooks/useAuth";
import { apiErrorMessage } from "../api/client";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}`);
      navigate(user.role === "OWNER" ? "/owner" : user.role === "ADMIN" ? "/admin" : "/tenant");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not log in"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl font-semibold">Log in</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          type="email" required placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15"
        />
        <input
          type="password" required placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15"
        />
        <button
          disabled={loading}
          className="focus-ring w-full rounded-lg bg-teal py-2.5 font-medium text-sand hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-ink/60 dark:text-sand/60">
        No account? <Link to="/register" className="text-teal hover:underline">Sign up</Link>
      </p>
    </div>
  );
}
