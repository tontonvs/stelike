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

/** The message a staff member sends a rider once assigned to a delivery. */
export function riderDeliveryMessage(order: OrderRow): string {
  const location = isGpsAddress(order.address) ? gpsMapsUrl(order.address) : order.address;

  return [
    `Yoglait delivery — ${order.reference}`,
    `Customer: ${order.customer_name}`,
    `Phone: ${order.customer_phone}`,
    `Location: ${location}`,
  ].join("\n");
}
