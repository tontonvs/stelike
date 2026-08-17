import { supabase } from "./supabase";

export type Rider = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
  terminated_at: string | null;
};

export type RiderSession = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export async function listRiders(): Promise<Rider[]> {
  const { data, error } = await supabase
    .from("riders")
    .select("id, name, phone, email, active, created_at, terminated_at")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Rider[];
}

/** Staff: adds a rider with a login password. `contact` is whatever the
 * staff member typed into the single "Email or phone number" field — split
 * here into the right column based on whether it looks like an email, so
 * the existing WhatsApp "send details" feature (which needs a real phone
 * number — see staff.tsx) keeps working for riders registered with a phone,
 * and is simply unavailable for riders registered with email only.
 * Password hashing happens server-side in create_rider_with_password() —
 * the plaintext password travels over TLS to Supabase and is never stored
 * or logged on the client. */
export async function addRider(name: string, contact: string, password: string): Promise<void> {
  const isEmail = contact.includes("@");
  const { error } = await supabase.rpc("create_rider_with_password", {
    p_name: name,
    p_phone: isEmail ? "" : contact,
    p_email: isEmail ? contact : "",
    p_password: password,
  });
  if (error) throw new Error(error.message);
}

/** Staff: terminates a rider — kept in the log, no longer able to log in
 * (rider_login() only matches riders where `active`), and no longer
 * assignable to new orders (the assignment dropdown filters to active
 * riders only). Replaces the old hard-delete removeRider(); a rider's
 * history would be lost if the row were actually deleted. */
export async function terminateRider(id: string): Promise<void> {
  const { error } = await supabase
    .from("riders")
    .update({ active: false, terminated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Public: verifies a rider's login (name or phone number, plus password)
 * via the rider_login() SECURITY DEFINER function. Riders don't have a
 * Supabase Auth account — this checks a hashed password stored directly on
 * the `riders` row instead, matched by name, phone, or email (phone is
 * normalized — spacing, dashes, and a "+233" prefix are all treated as
 * equivalent). Returns null on any
 * mismatch, deliberately without saying which part was wrong. */
export async function loginRider(
  identifier: string,
  password: string,
): Promise<RiderSession | null> {
  const { data, error } = await supabase.rpc("rider_login", {
    p_identifier: identifier,
    p_password: password,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return (row as RiderSession | undefined) ?? null;
}
