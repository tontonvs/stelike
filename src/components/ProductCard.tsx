import { motion } from "framer-motion";
import { flavourChip, flavourLabels, type Product } from "@/lib/products";
import { useCart } from "./CartProvider";
import { QuantityStepper } from "./QuantityStepper";
import { fadeUp, EASE_OUT } from "@/lib/motion";

export function ProductCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
  const { addItem } = useCart();
  const outOfStock = product.inStock === false;

  return (
    <motion.li
      layout={false}
      variants={fadeUp}
      whileHover={outOfStock ? {} : { y: -4, scale: 1.01 }}
      transition={{ duration: 0.18, ease: EASE_OUT }}
      className={`relative flex flex-col rounded-2xl bg-card p-3 shadow-sm sm:p-4 ${
        outOfStock ? "opacity-60" : ""
      }`}
    >
      {outOfStock ? (
        <span className="absolute right-2 top-2 z-10 rounded-full bg-secondary px-2 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">
          Out of stock
        </span>
      ) : (
        product.badges.includes("NEW") && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold uppercase text-accent-foreground">
            New
          </span>
        )
      )}

      <button
        type="button"
        onClick={onOpen}
        aria-label={`View details for ${product.name}`}
        className="text-left"
      >
        <span className="grid h-28 w-full place-items-center rounded-xl bg-secondary/40 sm:h-36">
          <img
            src={product.image}
            alt={`${product.name} — ${flavourLabels[product.flavour]} yoghurt`}
            width={768}
            height={768}
            loading="lazy"
            decoding="async"
            className="h-24 w-auto object-contain sm:h-32"
          />
        </span>
        <span className="mt-2 flex min-w-0 items-center gap-1.5">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border ${flavourChip[product.flavour]}`}
            aria-hidden="true"
          />
          <span className="truncate text-[11px] font-medium text-muted-foreground">
            {flavourLabels[product.flavour]} · {product.size}
          </span>
        </span>
        <span className="font-display mt-0.5 block truncate text-sm font-semibold sm:text-base">
          {product.name}
        </span>
      </button>

      <ul className="mt-2 flex flex-wrap gap-1">
        {product.badges
          .filter((b) => b !== "NEW")
          .slice(0, 2)
          .map((b) => (
            <li
              key={b}
              className="rounded-full bg-secondary/60 px-2 py-0.5 text-[9px] font-semibold text-secondary-foreground"
            >
              {b}
            </li>
          ))}
      </ul>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="font-display text-sm font-bold sm:text-base">GH₵ {product.price}</span>
        {outOfStock ? (
          <span className="rounded-full bg-secondary/60 px-3.5 py-1.5 text-[11px] font-semibold text-muted-foreground sm:px-5 sm:py-2 sm:text-xs">
            Unavailable
          </span>
        ) : (
          <QuantityStepper onAdd={(qty) => addItem(product.id, qty)} size="md" />
        )}
      </div>
    </motion.li>
  );
}
