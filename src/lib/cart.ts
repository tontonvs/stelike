import { productById, type Product } from "./products";
import type { CartLine } from "@/components/CartProvider";

export type ResolvedCartItem = { line: CartLine; product: Product };

/** Turns stored {id, qty} lines back into full product records, dropping any unknown ids. */
export function resolveCartItems(lines: CartLine[]): ResolvedCartItem[] {
  return lines
    .map((line) => ({ line, product: productById(line.id) }))
    .filter((entry): entry is ResolvedCartItem => Boolean(entry.product));
}

export function cartSubtotal(items: ResolvedCartItem[]): number {
  return items.reduce((sum, { line, product }) => sum + line.qty * product.price, 0);
}

/** Flat placeholder delivery fee — swap for a real rate table/API once that's defined. */
export const DELIVERY_FEE = 10;
