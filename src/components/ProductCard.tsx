import { motion } from "framer-motion";
import { flavourChip, flavourLabels, type Product } from "@/lib/products";
import { useCart } from "./CartProvider";
import { QuantityStepper } from "./QuantityStepper";
import { fadeUp, EASE_OUT } from "@/lib/motion";

export function ProductCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
  const { addItem } = useCart();

  return (
    <motion.li
      layout={false}
      variants={fadeUp}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.18, ease: EASE_OUT }}
      className="relative flex flex-col rounded-3xl bg-card p-5 shadow-soft"
    >
      {product.badges.includes("NEW") && (
        <span className="absolute right-4 top-4 z-10 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase text-accent-foreground">
          New
        </span>
      )}

      <button
        type="button"
        onClick={onOpen}
        aria-label={`View details for ${product.name}`}
        className="text-left"
      >
        <span className="grid h-44 w-full place-items-center rounded-2xl bg-secondary/40">
          <img
            src={product.image}
            alt={`${product.name} — ${flavourLabels[product.flavour]} yoghurt`}
            width={768}
            height={768}
            loading="lazy"
            decoding="async"
            className="h-40 w-auto object-contain"
          />
        </span>
        <span className="mt-4 flex min-w-0 items-center gap-2">
          <span
            className={`h-3 w-3 shrink-0 rounded-full ring-1 ring-border ${flavourChip[product.flavour]}`}
            aria-hidden="true"
          />
          <span className="text-xs font-medium text-muted-foreground">
            {flavourLabels[product.flavour]} · {product.size}
          </span>
        </span>
        <span className="font-display mt-1 block truncate text-lg font-semibold">
          {product.name}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{product.tagline}</span>
      </button>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {product.badges
          .filter((b) => b !== "NEW")
          .slice(0, 2)
          .map((b) => (
            <li
              key={b}
              className="rounded-full bg-secondary/60 px-2.5 py-1 text-[10px] font-semibold text-secondary-foreground"
            >
              {b}
            </li>
          ))}
      </ul>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="font-display text-lg font-bold">GH₵ {product.price}</span>
        <QuantityStepper onAdd={(qty) => addItem(product.id, qty)} />
      </div>
    </motion.li>
  );
}
