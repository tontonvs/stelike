import type { OrderRow } from "./orders";
import { isGpsAddress, gpsMapsUrl } from "./address";

/** Normalizes a Ghanaian number for a wa.me link. Assumes local numbers
 * (leading 0) unless already given in international format. This is a
 * heuristic, not full phone validation — good enough for wa.me, which just
 * needs digits with the country code. */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  return digits;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(message)}`;
}

/** The message a staff member sends a rider once assigned to a delivery.
 * Only ever called for delivery orders (pickup orders never reach the rider
 * assignment UI), but `address` is nullable on the type either way, so this
 * still needs a fallback. */
export function riderDeliveryMessage(order: OrderRow): string {
  const location = order.address
    ? isGpsAddress(order.address)
      ? gpsMapsUrl(order.address)
      : order.address
    : "No address on file";

  return [
    `Yoglait delivery — ${order.reference}`,
    `Customer: ${order.customer_name}`,
    `Phone: ${order.customer_phone}`,
    `Location: ${location}`,
  ].join("\n");
}
