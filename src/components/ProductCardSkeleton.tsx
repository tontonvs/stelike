import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors ProductCard's actual layout (image block, flavour line, title,
 * badges, price/button row) rather than a plain pulsing box — a skeleton
 * shaped like the real content reads as "loading this" instead of just
 * "loading something", and avoids a layout jump once real cards arrive. */
export function ProductCardSkeleton() {
  return (
    <li className="rounded-2xl bg-card p-3 shadow-sm sm:p-4" aria-hidden="true">
      <Skeleton className="h-28 w-full rounded-xl sm:h-36" />
      <div className="mt-2 flex items-center gap-1.5">
        <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full" />
        <Skeleton className="h-3 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-1.5 h-4 w-2/3 rounded-full" />
      <div className="mt-2 flex gap-1">
        <Skeleton className="h-4 w-14 rounded-full" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>
    </li>
  );
}
