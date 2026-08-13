import { supabase } from "./supabase";

export type Rider = { id: string; name: string; phone: string; active: boolean };

export async function listRiders(): Promise<Rider[]> {
  const { data, error } = await supabase
    .from("riders")
    .select("id, name, phone, active")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Rider[];
}

export async function addRider(name: string, phone: string): Promise<void> {
  const { error } = await supabase.from("riders").insert({ name, phone });
  if (error) throw new Error(error.message);
}

export async function removeRider(id: string): Promise<void> {
  const { error } = await supabase.from("riders").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
