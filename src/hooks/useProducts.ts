import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/productsApi";

/** Shared across every component that needs the menu — React Query dedupes
 * identical queries, so this is one network fetch reused everywhere, not
 * one per component.
 *
 * staleTime is deliberately short (not the usual longer cache you'd want
 * for mostly-static data) — stock/availability status gates whether a
 * customer can actually place an order, so a stale "in stock" reading is
 * worse than the extra network requests from refetching often. Every fresh
 * page load already gets current data via SSR regardless; this mainly
 * affects someone staying on the same tab for a while. */
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 30 * 1000,
  });
}
