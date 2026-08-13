import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { X, Search } from "lucide-react";
import {
  lineLabels,
  flavourLabels,
  flavourChipActive,
  type Flavour,
  type Line,
  type Product,
} from "@/lib/products";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { ProductSheet } from "@/components/ProductSheet";
import { fadeUp, staggerParent, EASE_OUT } from "@/lib/motion";

export const Route = createFileRoute("/menu")({
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search["q"] === "string" ? { q: search["q"] } : {},
  head: () => ({
    meta: [
      { title: "Menu — Yoglait Drinking Yoghurt, Tubs & Fruit Cups" },
      {
        name: "description",
        content:
          "Browse the full Yoglait menu: drinking yoghurt pouches, probiotic and Greek tubs, and fruit cups. Filter by type, size and flavour.",
      },
      { property: "og:title", content: "Menu — Yoglait" },
      {
        property: "og:description",
        content:
          "Drinking pouches, probiotic tubs, Greek yoghurt and fruit cups, fresh from Accra.",
      },
    ],
  }),
  component: MenuPage,
});

const lineOptions = Object.keys(lineLabels) as Line[];
const sizeOptions = ["pouch", "cup", "tub", "480g", "500g"] as const;
const flavourOptions = Object.keys(flavourLabels) as Flavour[];

type SizeOption = (typeof sizeOptions)[number];

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function matchesSize(p: Product, size: SizeOption) {
  if (size === "pouch" || size === "cup" || size === "tub") return p.format === size;
  return p.size.includes(size);
}

function MenuPage() {
  const { data: products, isLoading } = useProducts();
  const search = Route.useSearch();
  const [query, setQuery] = useState(search.q ?? "");
  const [lines, setLines] = useState<Line[]>([]);
  const [sizes, setSizes] = useState<SizeOption[]>([]);
  const [flavours, setFlavours] = useState<Flavour[]>([]);
  const [active, setActive] = useState<Product | null>(null);

  // Keeps the search box in sync if the navbar search is used again while
  // already on this page (the route doesn't remount, so state won't pick up
  // a new ?q= on its own).
  useEffect(() => {
    if (search.q !== undefined) setQuery(search.q);
  }, [search.q]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products ?? []).filter(
      (p) =>
        (lines.length === 0 || lines.includes(p.line)) &&
        (sizes.length === 0 || sizes.some((s) => matchesSize(p, s))) &&
        (flavours.length === 0 || flavours.includes(p.flavour)) &&
        (q === "" ||
          p.name.toLowerCase().includes(q) ||
          flavourLabels[p.flavour].toLowerCase().includes(q)),
    );
  }, [products, lines, sizes, flavours, query]);

  const hasFilters = lines.length + sizes.length + flavours.length > 0 || query.trim() !== "";

  const clear = () => {
    setQuery("");
    setLines([]);
    setSizes([]);
    setFlavours([]);
  };

  const chipBase =
    "rounded-full px-4 py-2 text-xs font-semibold shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95";

  return (
    <div>
      <section className="relative overflow-hidden bg-hero-gradient px-5 pb-24 pt-32 sm:px-8 sm:pt-36">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" animate="show" variants={staggerParent}>
            <motion.span
              variants={fadeUp}
              className="inline-flex rounded-full bg-card/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur"
            >
              Yoglait On The Go
            </motion.span>
            <motion.h1 variants={fadeUp} className="mt-4 text-4xl font-bold sm:text-6xl">
              Your Daily Dose of Delicious
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-3 max-w-lg text-sm text-muted-foreground sm:text-base"
            >
              Every pouch, tub and cup we make — chilled, probiotic and ready for you.
            </motion.p>
          </motion.div>
        </div>

        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14 w-full text-background sm:h-20"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M0,64 C240,120 420,16 720,48 C1020,80 1200,120 1440,56 L1440,120 L0,120 Z"
          />
        </svg>
      </section>

      {/* Search + filter dropdown */}
      <section className="mx-auto mt-8 max-w-6xl px-5 sm:px-8">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search flavours — vanilla, strawberry, greek…"
              aria-label="Search products"
              className="w-full rounded-full bg-secondary/40 py-3 pl-11 pr-4 text-sm outline-none ring-primary/40 focus:ring-2"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filter
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        </div>

        <p aria-live="polite" className="mt-3 text-xs font-semibold text-muted-foreground sm:text-sm">
          {query.trim() !== "" && <span className="text-foreground">&ldquo;{query.trim()}&rdquo; — </span>}
          {results.length} {results.length === 1 ? "result" : "results"}
        </p>

        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="mt-3 origin-top rounded-3xl bg-card p-4 shadow-soft"
            >
              <FilterGroup label="Type">
                {lineOptions.map((l) => (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={lines.includes(l)}
                    onClick={() => setLines((prev) => toggle(prev, l))}
                    className={`${chipBase} ${
                      lines.includes(l)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 text-secondary-foreground"
                    }`}
                  >
                    {lineLabels[l]}
                  </button>
                ))}
              </FilterGroup>

              <FilterGroup label="Size">
                {sizeOptions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={sizes.includes(s)}
                    onClick={() => setSizes((prev) => toggle(prev, s))}
                    className={`${chipBase} capitalize ${
                      sizes.includes(s)
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary/50 text-secondary-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </FilterGroup>

              <FilterGroup label="Flavour">
                {flavourOptions.map((f) => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={flavours.includes(f)}
                    onClick={() => setFlavours((prev) => toggle(prev, f))}
                    className={`${chipBase} inline-flex items-center gap-2 ${
                      flavours.includes(f)
                        ? `${flavourChipActive[f]} ring-2 ring-foreground/10`
                        : "bg-secondary/50 text-secondary-foreground"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ring-1 ring-foreground/15 ${flavourChipActive[f].split(" ")[0]}`}
                      aria-hidden="true"
                    />
                    {flavourLabels[f]}
                  </button>
                ))}
              </FilterGroup>

              <AnimatePresence initial={false}>
                {hasFilters && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.18, ease: EASE_OUT }}
                    onClick={clear}
                    className={`${chipBase} mt-4 inline-flex items-center gap-1.5 bg-foreground/5 text-foreground`}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear filters
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Grid */}
      <section className="mx-auto mt-6 max-w-6xl px-5 sm:px-8">
        {isLoading ? (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </ul>
        ) : (
          <>
            <motion.ul
              initial="hidden"
              animate="show"
              variants={staggerParent}
              className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3"
            >
              <AnimatePresence initial={false}>
                {results.map((p) => (
                  <ProductCard key={p.id} product={p} onOpen={() => setActive(p)} />
                ))}
              </AnimatePresence>
            </motion.ul>

            {results.length === 0 && (
              <p className="rounded-3xl bg-card p-10 text-center text-sm text-muted-foreground shadow-soft">
                No products match those filters yet. Try clearing a few.
              </p>
            )}
          </>
        )}
      </section>

      <ProductSheet
        product={active}
        allProducts={products ?? []}
        onClose={() => setActive(null)}
        onSelect={setActive}
      />
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 first:mt-0">
      <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
