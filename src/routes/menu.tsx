import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import {
  products,
  lineLabels,
  flavourLabels,
  flavourChipActive,
  type Flavour,
  type Line,
  type Product,
} from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { ProductSheet } from "@/components/ProductSheet";
import { fadeUp, staggerParent, EASE_OUT } from "@/lib/motion";

export const Route = createFileRoute("/menu")({
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
        content: "Drinking pouches, probiotic tubs, Greek yoghurt and fruit cups, fresh from Accra.",
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
  const [lines, setLines] = useState<Line[]>([]);
  const [sizes, setSizes] = useState<SizeOption[]>([]);
  const [flavours, setFlavours] = useState<Flavour[]>([]);
  const [active, setActive] = useState<Product | null>(null);

  const results = useMemo(
    () =>
      products.filter(
        (p) =>
          (lines.length === 0 || lines.includes(p.line)) &&
          (sizes.length === 0 || sizes.some((s) => matchesSize(p, s))) &&
          (flavours.length === 0 || flavours.includes(p.flavour)),
      ),
    [lines, sizes, flavours],
  );

  const hasFilters = lines.length + sizes.length + flavours.length > 0;

  const clear = () => {
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
            <motion.p variants={fadeUp} className="mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
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

      {/* Filter bar */}
      <section className="mx-auto mt-8 max-w-6xl px-5 sm:px-8">
        <div className="rounded-4xl bg-card p-5 shadow-soft">
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

          <div className="mt-5 flex items-center justify-between gap-3">
            <p aria-live="polite" className="text-xs font-semibold text-muted-foreground sm:text-sm">
              {results.length} {results.length === 1 ? "product" : "products"}
            </p>
            <AnimatePresence initial={false}>
              {hasFilters && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.18, ease: EASE_OUT }}
                  onClick={clear}
                  className={`${chipBase} inline-flex items-center gap-1.5 bg-foreground/5 text-foreground`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear filters
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto mt-8 max-w-6xl px-5 sm:px-8">
        <motion.ul
          initial="hidden"
          animate="show"
          variants={staggerParent}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
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
      </section>

      <ProductSheet product={active} onClose={() => setActive(null)} onSelect={setActive} />
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
