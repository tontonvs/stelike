import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors ProductCard's actual layout (image block, title, price/stock row)
 * rather than a plain pulsing box — a skeleton shaped like the real content
 * reads as "loading this" instead of just "loading something", and avoids a
 * layout jump once real cards arrive. */
export function ProductCardSkeleton() {
  return (
    <li className="rounded-md bg-card p-3 shadow-sm sm:p-4" aria-hidden="true">
      <Skeleton className="aspect-square w-full rounded-sm" />
      <Skeleton className="mt-2.5 h-4 w-2/3 rounded-sm" />
      <div className="mt-2 flex items-center justify-between">
        <Skeleton className="h-4 w-14 rounded-sm" />
        <Skeleton className="h-4 w-12 rounded-sm" />
      </div>
    </li>
  );
}
