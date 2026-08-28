import { products as catalog, type Product } from "./products";

/**
 * No database for this demo — Paystack handles payment, everything else is
 * static. This mirrors the old fetchProducts() signature (still returns a
 * Promise<Product[]>) purely so the rest of the app — useProducts(),
 * whichever components call it — doesn't need to change when a real backend
 * eventually replaces this.
 */
export async function fetchProducts(): Promise<Product[]> {
  return catalog;
}
