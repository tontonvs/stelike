import type { Product } from "./products";
import type { CartLine } from "@/components/CartProvider";

export type ResolvedCartItem = { line: CartLine; product: Product };

/** Turns stored {id, qty} lines back into full product records, dropping any
 * unknown ids. Takes the current product list as a parameter (from
 * useProducts()) rather than importing a hardcoded array, since the menu is
 * now database-backed and can change without a code deploy. */
export function resolveCartItems(lines: CartLine[], products: Product[]): ResolvedCartItem[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return lines
    .map((line) => ({ line, product: byId.get(line.id) }))
    .filter((entry): entry is ResolvedCartItem => Boolean(entry.product));
}

export function cartSubtotal(items: ResolvedCartItem[]): number {
  return items.reduce((sum, { line, product }) => sum + line.qty * product.price, 0);
}

/** Flat placeholder delivery fee — swap for a real rate table/API once that's defined. */
export const DELIVERY_FEE = 10;
