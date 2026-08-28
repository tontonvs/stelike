import { motion } from "framer-motion";
import type { Product } from "@/lib/products";
import { fadeUp, EASE_OUT } from "@/lib/motion";

export function ProductCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
  const outOfStock = product.stock <= 0;

  return (
    <motion.li
      layout={false}
      variants={fadeUp}
      whileHover={outOfStock ? {} : { y: -4 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      className={`relative flex flex-col rounded-md bg-card p-3 shadow-sm sm:p-4 ${
        outOfStock ? "opacity-70" : ""
      }`}
    >
      {product.hot && (
        <span className="absolute left-2 top-2 z-10 rounded-sm bg-accent px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent-foreground">
          Hot
        </span>
      )}

      <button
        type="button"
        onClick={onOpen}
        aria-label={`View details for ${product.name}`}
        className="text-left"
      >
        <span className="grid aspect-square w-full place-items-center overflow-hidden rounded-sm bg-secondary/40">
          <img
            src={product.image}
            alt={product.name}
            width={768}
            height={768}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </span>

        <span className="font-display mt-2.5 block truncate text-sm font-medium sm:text-base">
          {product.name}
        </span>
      </button>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="font-display text-sm font-semibold text-primary sm:text-base">
          {product.priceOnRequest ? "Contact for price" : `GH₵ ${product.price}`}
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">
          {outOfStock ? "Out of stock" : `${product.stock} left`}
        </span>
      </div>
    </motion.li>
  );
}
