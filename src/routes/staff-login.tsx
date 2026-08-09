import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { signInStaff } from "@/lib/staffAuth";

export const Route = createFileRoute("/staff-login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Staff Sign In — Yoglait" }] }),
  component: StaffLoginPage,
});

function StaffLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInStaff(email, password);
      navigate({ to: "/staff" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-hero-gradient px-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-4xl bg-card p-8 shadow-float"
      >
        <p className="font-display text-2xl font-bold">Staff sign in</p>
        <p className="mt-1 text-xs text-muted-foreground">Yoglait order management</p>

        <label className="mt-6 block">
          <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Password</span>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
          />
        </label>

        {error && (
          <p className="mt-4 rounded-2xl bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-70"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </section>
  );
}
