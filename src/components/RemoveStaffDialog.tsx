import { useState, type FormEvent } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, ShieldAlert, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { terminateStaff, type StaffProfile } from "@/lib/staffAuth";
import { EASE_OUT } from "@/lib/motion";

type Props = {
  member: StaffProfile;
  onClose: () => void;
  onRemoved: () => void;
};

/** Real re-authentication, not just a typed string — this calls
 * signInWithPassword against the CURRENT admin's own email to verify the
 * password is actually correct before allowing a termination.
 *
 * Named RemoveStaffDialog for historical reasons — the action itself is now
 * a soft termination (terminateStaff), not a hard delete, so the sub-admin's
 * history stays visible in the employee log. */
export function RemoveStaffDialog({ member, onClose, onRemoved }: Props) {
  const reduce = useReducedMotion();
  const [typedName, setTypedName] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<"confirm" | "removing">("confirm");
  const [error, setError] = useState<string | null>(null);

  const nameMatches = typedName.trim().toLowerCase() === member.name.trim().toLowerCase();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!nameMatches) {
      setError(`Type "${member.name}" exactly to confirm.`);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email;
    if (!email) {
      setError("Could not verify your session — try signing out and back in.");
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Incorrect password.");
      return;
    }

    setStage("removing");
    try {
      // Deliberate 3s pause — gives real visual weight to a destructive,
      // access-revoking action rather than it vanishing instantly.
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await terminateStaff(member.id);
      toast.success(`${member.name} terminated.`);
      onRemoved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not terminate staff.");
      setStage("confirm");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/40 px-5 backdrop-blur-sm">
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: EASE_OUT }}
        className="w-full max-w-sm rounded-4xl bg-card p-6 shadow-float"
      >
        <AnimatePresence mode="wait">
          {stage === "confirm" ? (
            <motion.form
              key="confirm"
              initial={reduce ? { opacity: 0 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              onSubmit={handleSubmit}
              className="flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
                    <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <p className="font-display text-base font-bold">Terminate {member.name}?</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cancel"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary/60"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                They&apos;ll lose dashboard access immediately, but stay visible in the employee log
                with their order history. This can&apos;t be undone from here.
              </p>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Type <span className="font-bold text-foreground">{member.name}</span> to confirm
                </span>
                <input
                  autoFocus
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-destructive/40 focus:ring-2"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Your password
                </span>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-destructive/40 focus:ring-2"
                />
              </label>

              {error && (
                <p className="rounded-2xl bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive">
                  {error}
                </p>
              )}

              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-full bg-secondary py-2.5 text-sm font-semibold text-secondary-foreground transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!nameMatches || !password}
                  className="flex-1 rounded-full bg-destructive py-2.5 text-sm font-bold text-destructive-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  Terminate
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="removing"
              initial={reduce ? { opacity: 0 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              className="flex flex-col items-center gap-3 py-6 text-center"
            >
              <Loader2 className="h-6 w-6 animate-spin text-destructive" aria-hidden="true" />
              <p className="text-sm font-semibold text-foreground">Terminating {member.name}…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
