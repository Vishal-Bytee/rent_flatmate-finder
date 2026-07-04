import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "../lib/toast";
import { useAuth } from "../hooks/useAuth";
import { apiErrorMessage } from "../api/client";
import { Role } from "../types";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "TENANT" as Role, phone: "" });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register({ ...form, role: form.role as "TENANT" | "OWNER" });
      toast.success("Account created");
      navigate(user.role === "OWNER" ? "/owner" : "/tenant");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not register"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl font-semibold">Create an account</h1>

      <div className="mt-6 flex rounded-lg border border-ink/15 p-1 dark:border-sand/15">
        {(["TENANT", "OWNER"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setForm({ ...form, role: r })}
            className={`focus-ring flex-1 rounded-md py-2 text-sm font-medium transition ${
              form.role === r ? "bg-teal text-sand" : "text-ink/60 dark:text-sand/60"
            }`}
          >
            {r === "TENANT" ? "I'm looking for a room" : "I'm listing a room"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input required placeholder="Full name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15" />
        <input type="email" required placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15" />
        <input type="password" required minLength={8} placeholder="Password (min 8 characters)" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15" />
        {form.role === "OWNER" && (
          <input placeholder="Phone (optional)" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="focus-ring w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15" />
        )}
        <button
          disabled={loading}
          className="focus-ring w-full rounded-lg bg-teal py-2.5 font-medium text-sand hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-sm text-ink/60 dark:text-sand/60">
        Already have an account? <Link to="/login" className="text-teal hover:underline">Log in</Link>
      </p>
    </div>
  );
}
