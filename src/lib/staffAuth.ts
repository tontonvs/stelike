import { supabase } from "./supabase";

export type StaffRole = "admin" | "sub_admin";
export type StaffProfile = { id: string; name: string; role: StaffRole };

export async function signInStaff(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signOutStaff(): Promise<void> {
  await supabase.auth.signOut();
}

/** Returns the logged-in Supabase Auth user's staff profile, or null if they're
 * not logged in, or logged in but not present in the staff table (unauthorized). */
export async function getCurrentStaff(): Promise<StaffProfile | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("staff")
    .select("id, name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as StaffProfile;
}
