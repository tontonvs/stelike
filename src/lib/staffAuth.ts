import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type StaffRole = "admin" | "sub_admin";
export type StaffProfile = { id: string; name: string; role: StaffRole };
export type StaffLogEntry = {
  id: string;
  name: string;
  role: StaffRole;
  created_at: string;
  terminated_at: string | null;
};

export async function signInStaff(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signOutStaff(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

/** Returns the logged-in Supabase Auth user's staff profile, or null if they're
 * not logged in, logged in but not present in the staff table (unauthorized),
 * or logged in but terminated (also treated as unauthorized — same UX). */
export async function getCurrentStaff(): Promise<StaffProfile | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("staff")
    .select("id, name, role")
    .eq("id", user.id)
    .is("terminated_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return data as StaffProfile;
}

/** Admin-only (enforced by RLS). Lists everyone currently active in the
 * staff table — this is the "who has access right now" view used by the
 * Team tab. Terminated sub-admins don't show up here anymore; see
 * listStaffForLog() for the full history including terminated people. */
export async function listStaff(): Promise<StaffProfile[]> {
  const { data, error } = await supabase
    .from("staff")
    .select("id, name, role")
    .is("terminated_at", null)
    .order("role", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as StaffProfile[];
}

/** Admin-only (enforced by RLS). Every sub-admin ever added, active or
 * terminated, with dates — feeds the employee log. Deliberately excludes
 * admins (the log is scoped to sub-admins and riders only). */
export async function listStaffForLog(): Promise<StaffLogEntry[]> {
  const { data, error } = await supabase
    .from("staff")
    .select("id, name, role, created_at, terminated_at")
    .eq("role", "sub_admin")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as StaffLogEntry[];
}

/** Admin-only (enforced by RLS). Terminates a sub-admin: their Supabase Auth
 * login still technically exists, but getCurrentStaff() now filters out
 * terminated rows, so every is_staff()/is_admin() check fails the same way
 * it would if the row were deleted — they lose all dashboard access
 * immediately. Unlike the old removeStaff() (hard delete), the row stays
 * so their history remains visible in the employee log. */
export async function terminateStaff(staffId: string): Promise<void> {
  const { error } = await supabase
    .from("staff")
    .update({ terminated_at: new Date().toISOString() })
    .eq("id", staffId);
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
