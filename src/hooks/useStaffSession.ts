import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentStaff, type StaffProfile } from "@/lib/staffAuth";

export type StaffSessionState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "unauthorized" } // has a Supabase Auth session, but no row in `staff`
  | { status: "staff"; staff: StaffProfile };

/** Client-only by design — this hook is only ever used inside the ssr:false
 * /staff route tree, so it's safe to touch browser-only Supabase auth state
 * directly without worrying about server rendering. */
export function useStaffSession(): StaffSessionState {
  const [state, setState] = useState<StaffSessionState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    const evaluate = async () => {
      const staff = await getCurrentStaff();
      if (!active) return;
      if (staff) {
        setState({ status: "staff", staff });
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setState(data.session ? { status: "unauthorized" } : { status: "signed-out" });
    };

    evaluate();
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      evaluate();
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return state;
}
