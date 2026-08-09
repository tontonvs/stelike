import { createClient } from "@supabase/supabase-js";

const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const publishableKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;

if (!url || !publishableKey) {
  console.warn(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY — order saving and order lookup won't work until these are set in .env.",
  );
}

/**
 * Client-side Supabase client. Uses the publishable key only — this is safe
 * to ship in the browser bundle, Row Level Security still gates every query.
 * Never put the secret key here or in any frontend file.
 */
export const supabase = createClient(url ?? "", publishableKey ?? "");
