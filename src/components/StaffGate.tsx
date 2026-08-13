import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useStaffSession } from "@/hooks/useStaffSession";
import { signOutStaff } from "@/lib/staffAuth";
import { fadeUp, EASE_OUT } from "@/lib/motion";
import type { StaffProfile } from "@/lib/staffAuth";

/** Wraps any /staff/* page (except the login page itself). Handles the loading,
 * signed-out, and unauthorized states, and renders `children` with the staff
 * profile once there's a confirmed staff session. A plain component rather than
 * a router layout — this is what avoids the router nesting /staff-login under
 * the same gate as everything else, which would infinite-loop the redirect. */
export function StaffGate({ children }: { children: (staff: StaffProfile) => ReactNode }) {
  const session = useStaffSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session.status === "signed-out") {
      navigate({ to: "/staff-login" });
    }
  }, [session.status, navigate]);

  if (session.status === "loading" || session.status === "signed-out") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-hero-gradient"
      >
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </motion.div>
    );
  }

  if (session.status === "unauthorized") {
    return (
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-hero-gradient px-5 text-center"
      >
        <p className="font-display text-xl font-bold">Not authorized</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          This account isn't set up as Yoglait staff. Contact an admin if you think this is a
          mistake.
        </p>
        <button
          type="button"
          onClick={() => signOutStaff()}
          className="mt-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          Sign out
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="min-h-screen bg-hero-gradient"
    >
      <header className="flex items-center justify-between px-6 py-5">
        <div>
          <p className="font-display text-lg font-bold">Yoglait Staff</p>
          <p className="text-xs text-muted-foreground">
            {session.staff.name} · {session.staff.role === "admin" ? "Admin" : "Sub-admin"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => signOutStaff()}
          className="rounded-full bg-card px-4 py-2 text-xs font-semibold shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          Sign out
        </button>
      </header>
      <main className="px-6 pb-16">{children(session.staff)}</main>
    </motion.div>
  );
}
