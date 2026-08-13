import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/productsApi";

/** Shared across every component that needs the menu — React Query dedupes
 * identical queries, so this is one network fetch reused everywhere, not
 * one per component. staleTime keeps repeat page visits from refetching. */
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
  });
}
