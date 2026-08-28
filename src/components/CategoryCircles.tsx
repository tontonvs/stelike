import { Link } from "@tanstack/react-router";
import { Sparkles, Tv, BedDouble, RectangleHorizontal, CircleDot } from "lucide-react";
import type { Category } from "@/lib/products";

const categories: { id: Category; label: string; icon: typeof Tv }[] = [
  { id: "tv-stands", label: "TV Stands", icon: Tv },
  { id: "bed-frames", label: "Bed Frames", icon: BedDouble },
  { id: "mirrors", label: "Mirrors", icon: CircleDot },
  { id: "center-tables", label: "Center Tables", icon: RectangleHorizontal },
  { id: "new", label: "New", icon: Sparkles },
];

export function CategoryCircles() {
  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-8">
      <h2 className="font-display text-lg font-medium">Browse Category</h2>
      <ul className="mt-4 flex justify-between gap-2 sm:justify-start sm:gap-6">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              to="/shop"
              search={{ category: c.id }}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-foreground transition-transform duration-150 hover:scale-105 sm:h-16 sm:w-16">
                <c.icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              </span>
              <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
                {c.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
