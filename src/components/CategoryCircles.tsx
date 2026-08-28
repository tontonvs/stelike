import { Link } from "@tanstack/react-router";
import { Sparkles, BedDouble } from "lucide-react";
import type { Category } from "@/lib/products";
import zenTvConsole from "@/assets/products/zen-tv-console.png";
import centreTable from "@/assets/products/centre-table.png";
import halfMoonMirror from "@/assets/products/half-moon-mirror.png";

// Real photos where we have them; icon fallback (bed-frames, new) until
// clean product shots are supplied for those categories.
const categories: { id: Category; label: string; image?: string; icon?: typeof BedDouble }[] = [
  { id: "tv-stands", label: "TV Stands", image: zenTvConsole },
  { id: "bed-frames", label: "Bed Frames", icon: BedDouble },
  { id: "mirrors", label: "Mirrors", image: halfMoonMirror },
  { id: "center-tables", label: "Center Tables", image: centreTable },
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
              <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-secondary text-foreground ring-1 ring-border transition-transform duration-150 hover:scale-105 sm:h-16 sm:w-16">
                {c.image ? (
                  <img
                    src={c.image}
                    alt=""
                    width={128}
                    height={128}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  c.icon && <c.icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                )}
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
