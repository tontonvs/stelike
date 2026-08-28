import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, Info } from "lucide-react";
import { categoryLabels, variantsOf, type Product } from "@/lib/products";
import { business } from "@/lib/business";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { useCart } from "./CartProvider";
import { QuantityStepper } from "./QuantityStepper";
import { EASE_OUT } from "@/lib/motion";

type Props = {
  product: Product | null;
  allProducts: Product[];
  onClose: () => void;
  onSelect: (p: Product) => void;
};

const AUTO_SLIDE_MS = 3200;

/** Full-screen product detail overlay. Images auto-advance on a timer;
 * tapping a thumbnail jumps straight to that image and resets the timer,
 * so manual browsing never fights the auto-slide. */
export function ProductSheet({ product, allProducts, onClose, onSelect }: Props) {
  const { addItem } = useCart();
  const reduce = useReducedMotion();
  const [slide, setSlide] = useState(0);
  const outOfStock = (product?.stock ?? 0) <= 0;

  useEffect(() => setSlide(0), [product?.id]);

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [product, onClose]);

  useEffect(() => {
    if (!product || product.images.length <= 1 || reduce) return undefined;
    const id = window.setInterval(() => {
      setSlide((s) => (s + 1) % product.images.length);
    }, AUTO_SLIDE_MS);
    return () => window.clearInterval(id);
  }, [product, reduce]);

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          role="dialog"
          aria-modal="true"
          aria-label={product.name}
          className="fixed inset-0 z-[60] overflow-y-auto bg-background"
        >
          <div className="mx-auto max-w-lg px-4 pb-28 pt-4 sm:px-6">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary transition-transform duration-150 hover:scale-105 active:scale-95"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Auto-sliding gallery */}
            <div className="relative mt-2 aspect-square w-full overflow-hidden rounded-md bg-secondary/40">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.img
                  key={slide}
                  src={product.images[slide]}
                  alt={`${product.name} view ${slide + 1}`}
                  width={1024}
                  height={1024}
                  loading="lazy"
                  decoding="async"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: EASE_OUT }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </AnimatePresence>
            </div>

            {/* Thumbnail previews — tap to jump, resets the auto-slide timer */}
            {product.images.length > 1 && (
              <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {product.images.map((src, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      aria-label={`Show image ${i + 1}`}
                      onClick={() => setSlide(i)}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded-sm ring-1 transition-opacity duration-150 ${
                        i === slide ? "ring-2 ring-primary" : "opacity-60 ring-border"
                      }`}
                    >
                      <img
                        src={src}
                        alt=""
                        width={112}
                        height={112}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Details */}
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {categoryLabels[product.category]}
              </p>
              <h2 className="font-display mt-1 text-2xl font-medium">{product.name}</h2>
              {outOfStock ? (
                <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-destructive">
                  <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Out of stock
                </span>
              ) : (
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {product.stock} left in stock
                </p>
              )}
              <p className="mt-3 text-sm text-muted-foreground">{product.description}</p>
              {product.colours && product.colours.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Available colours
                  </p>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {product.colours.map((c) => (
                      <li
                        key={c}
                        className="rounded-sm bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {variantsOf(product, allProducts).length > 0 && (
              <div className="mt-6">
                <p className="font-display text-sm font-medium">More in this category</p>
                <ul className="mt-3 flex gap-3 overflow-x-auto pb-2">
                  {variantsOf(product, allProducts).map((v) => (
                    <li key={v.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(v)}
                        className="w-24 shrink-0 rounded-sm bg-secondary/40 p-1.5 text-left transition-transform duration-150 hover:scale-105 active:scale-95"
                      >
                        <img
                          src={v.image}
                          alt={v.name}
                          width={192}
                          height={192}
                          loading="lazy"
                          decoding="async"
                          className="aspect-square w-full rounded-sm object-cover"
                        />
                        <span className="mt-1.5 block truncate text-[11px] font-medium">
                          {v.name}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sticky price + add-to-cart bar */}
          <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur">
            <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-4 py-3 sm:px-6">
              {product.priceOnRequest ? (
                <>
                  <span className="font-display text-lg font-semibold">Contact for price</span>
                  <a
                    href={buildWhatsAppLink(
                      business.whatsappNumber,
                      `Hi Stelike, I'd like to ask about the ${product.name}.`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-sm bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-transform duration-150 hover:scale-105 active:scale-95"
                  >
                    Ask on WhatsApp
                  </a>
                </>
              ) : (
                <>
                  <span className="font-display text-xl font-semibold">GH₵ {product.price}</span>
                  {outOfStock ? (
                    <span className="rounded-sm bg-destructive/10 px-6 py-2.5 text-sm font-semibold text-destructive">
                      Currently unavailable
                    </span>
                  ) : (
                    <QuantityStepper size="md" onAdd={(qty) => addItem(product.id, qty)} />
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
