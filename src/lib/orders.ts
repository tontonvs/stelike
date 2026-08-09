import { supabase } from "./supabase";

export type OrderItemSnapshot = { id: string; name: string; qty: number; price: number };

export type OrderRow = {
  id: string;
  reference: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  address: string;
  note: string | null;
  items: OrderItemSnapshot[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_status: "pending" | "paid" | "failed";
  payment_method: "paystack" | "manual";
  delivery_status: "processing" | "out_for_delivery" | "delivered";
  created_at: string;
  paid_at: string | null;
  delivered_at: string | null;
};

export type NewOrderInput = {
  reference: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  note?: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  deliveryFee: number;
  total: number;
};

/** Creates a pending order row. Call this before opening the Paystack popup so the
 * webhook has a matching `reference` to mark paid once payment actually completes.
 *
 * Deliberately does NOT use `.select()` to read the row back — under RLS that would
 * require a public SELECT policy on `orders`, which would let anyone with the
 * publishable key read every customer's name/phone/address. The caller already has
 * everything it sent (it generated `reference` itself), so nothing is lost. */
export async function createOrder(input: NewOrderInput): Promise<void> {
  const { error } = await supabase.from("orders").insert({
    reference: input.reference,
    customer_name: input.name,
    customer_phone: input.phone,
    customer_email: input.email,
    address: input.address,
    note: input.note || null,
    items: input.items,
    subtotal: input.subtotal,
    delivery_fee: input.deliveryFee,
    total: input.total,
  });

  if (error) throw new Error(error.message);
}

/** Looks up recent orders for a phone number, used to speed up checkout for returning
 * customers. Goes through the get_orders_by_phone() Postgres function rather than a
 * direct table read, since `orders` has no public SELECT policy. */
export async function lookupOrdersByPhone(phone: string): Promise<OrderRow[]> {
  const { data, error } = await supabase.rpc("get_orders_by_phone", { phone });
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderRow[];
}

/** Full order list for the staff dashboard. Relies on the "staff read all orders"
 * RLS policy — only succeeds for a logged-in user present in the `staff` table. */
export async function listOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderRow[];
}

/** Manual override for the rare case the Paystack webhook doesn't land (or an
 * order was taken by phone/WhatsApp outside the site). Staff-only via RLS. */
export async function confirmPaymentManually(orderId: string, staffId: string): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      payment_method: "manual",
      confirmed_by: staffId,
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
}

export async function markDelivered(orderId: string, staffId: string): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({
      delivery_status: "delivered",
      delivered_by: staffId,
      delivered_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
}
