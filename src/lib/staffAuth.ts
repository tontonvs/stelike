import { FunctionsHttpError } from "@supabase/supabase-js";
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

/** Admin-only (enforced by RLS). Lists everyone in the staff table. */
export async function listStaff(): Promise<StaffProfile[]> {
  const { data, error } = await supabase
    .from("staff")
    .select("id, name, role")
    .order("role", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as StaffProfile[];
}

/** Admin-only (enforced by RLS). Removes a sub-admin's staff row — their login
 * still technically exists in Supabase Auth, but with no staff row every
 * is_staff()/is_admin() check fails, so they lose all dashboard access. */
export async function removeStaff(staffId: string): Promise<void> {
  const { error } = await supabase.from("staff").delete().eq("id", staffId);
  if (error) throw new Error(error.message);
}

/** Admin-only. Creates a new sub-admin login + staff row via the create-staff
 * edge function — this can't be done directly from the browser since it
 * needs the service-role key to create a Supabase Auth user. */
export async function createSubAdmin(input: {
  name: string;
  email: string;
  password: string;
}): Promise<StaffProfile> {
  const { data, error } = await supabase.functions.invoke<StaffProfile | { error: string }>(
    "create-staff",
    { body: input },
  );

  if (error) {
    // supabase-js's error.message for a failed function call is just a generic
    // "Edge Function returned a non-2xx status code" — the actual reason is in
    // the response body itself, which has to be pulled out separately.
    if (error instanceof FunctionsHttpError) {
      try {
        const body = await error.context.json();
        throw new Error(typeof body?.error === "string" ? body.error : error.message);
      } catch {
        throw new Error(error.message);
      }
    }
    throw new Error(error.message);
  }
  if (data && "error" in data) throw new Error(data.error);
  if (!data) throw new Error("No response from create-staff.");
  return data;
}
