import { supabase } from "./supabase";

export type OrderUpdate = {
  id: string;
  order_id: string;
  message: string;
  created_by: string;
  created_at: string;
};

/** Staff: updates for one order, newest first. RLS-gated to staff. */
export async function listOrderUpdates(orderId: string): Promise<OrderUpdate[]> {
  const { data, error } = await supabase
    .from("order_updates")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderUpdate[];
}

/** Staff: sends a short update on an order (e.g. "delayed 20 mins", "out for
 * delivery"), visible to the customer via phone lookup on /orders. */
export async function sendOrderUpdate(
  orderId: string,
  message: string,
  staffId: string,
): Promise<void> {
  const { error } = await supabase
    .from("order_updates")
    .insert({ order_id: orderId, message, created_by: staffId });
  if (error) throw new Error(error.message);
}

/** Customer-facing: every update across every order tied to a phone number.
 * Goes through get_order_updates_by_phone() rather than a direct table
 * read, since `order_updates` has no public SELECT policy — same reasoning
 * as lookupOrdersByPhone() in orders.ts. */
export async function lookupOrderUpdatesByPhone(phone: string): Promise<OrderUpdate[]> {
  const { data, error } = await supabase.rpc("get_order_updates_by_phone", { p_phone: phone });
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderUpdate[];
}
