import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { loginRider, type RiderSession } from "@/lib/riders";
import { fadeUp } from "@/lib/motion";

export const Route = createFileRoute("/rider-login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Rider Sign In — Yoglait" }] }),
  component: RiderLoginPage,
});

function RiderLoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rider, setRider] = useState<RiderSession | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await loginRider(identifier.trim(), password);
      if (!result) {
        setError("Name/number or password is incorrect.");
        return;
      }
      window.localStorage.setItem("yoglait_rider_session", JSON.stringify(result));
      setRider(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  if (rider) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-3 bg-hero-gradient px-5 text-center">
        <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden="true" />
        <p className="font-display text-xl font-bold">Welcome back, {rider.name}</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          You&apos;re signed in. A full rider dashboard (your assigned deliveries) isn&apos;t built
          yet — for now, staff will keep sending delivery details over WhatsApp as usual.
        </p>
      </section>
    );
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-hero-gradient px-5">
      <motion.form
        variants={fadeUp}
        initial="hidden"
        animate="show"
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-4xl bg-card p-8 shadow-float"
      >
        <p className="font-display text-2xl font-bold">Rider sign in</p>
        <p className="mt-1 text-xs text-muted-foreground">Yoglait delivery riders</p>

        <label className="mt-6 block">
          <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            Name or phone number
          </span>
          <input
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
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
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-70"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </motion.form>
    </section>
  );
}
