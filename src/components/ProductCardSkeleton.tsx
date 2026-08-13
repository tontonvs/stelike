import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors ProductCard's actual layout (image block, flavour line, title,
 * badges, price/button row) rather than a plain pulsing box — a skeleton
 * shaped like the real content reads as "loading this" instead of just
 * "loading something", and avoids a layout jump once real cards arrive. */
export function ProductCardSkeleton() {
  return (
    <li className="flex flex-col rounded-3xl bg-card p-5 shadow-soft" aria-hidden="true">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="h-3 w-3 shrink-0 rounded-full" />
        <Skeleton className="h-3 w-24 rounded-full" />
      </div>
      <Skeleton className="mt-2 h-5 w-3/4 rounded-full" />
      <Skeleton className="mt-2 h-3 w-1/2 rounded-full" />
      <div className="mt-3 flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-6 w-14 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </li>
  );
}
