import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { flavourChip, flavourLabels, lineLabels, variantsOf, type Product } from "@/lib/products";
import { useCart } from "./CartProvider";
import { QuantityStepper } from "./QuantityStepper";
import { EASE_OUT } from "@/lib/motion";

type Props = {
  product: Product | null;
  allProducts: Product[];
  onClose: () => void;
  onSelect: (p: Product) => void;
};

export function ProductSheet({ product, allProducts, onClose, onSelect }: Props) {
  const { addItem } = useCart();
  const reduce = useReducedMotion();
  const [slide, setSlide] = useState(0);

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

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center sm:p-6"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.98 }}
            transition={{ duration: 0.26, ease: EASE_OUT }}
            drag={reduce ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110) onClose();
            }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-4xl bg-card p-5 shadow-float sm:rounded-4xl"
          >
            <div
              className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border sm:hidden"
              aria-hidden="true"
            />

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {lineLabels[product.line]} · {product.size}
                </p>
                <h2 className="font-display truncate text-2xl font-bold">{product.name}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary transition-transform duration-150 hover:scale-105 active:scale-95"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Gallery */}
            <div className="relative mt-4 overflow-hidden rounded-3xl bg-secondary/40">
              <motion.div
                className="flex"
                animate={{ x: `-${slide * 100}%` }}
                transition={{ duration: reduce ? 0 : 0.28, ease: EASE_OUT }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60)
                    setSlide((s) => Math.min(s + 1, product.images.length - 1));
                  if (info.offset.x > 60) setSlide((s) => Math.max(s - 1, 0));
                }}
              >
                {product.images.map((src, i) => (
                  <div key={i} className="grid h-60 w-full shrink-0 place-items-center px-6">
                    <img
                      src={src}
                      alt={`${product.name} view ${i + 1}`}
                      width={768}
                      height={768}
                      loading="lazy"
                      decoding="async"
                      className="h-52 w-auto object-contain"
                      draggable={false}
                    />
                  </div>
                ))}
              </motion.div>

              {product.images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() => setSlide((s) => Math.max(s - 1, 0))}
                    className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-card/80 shadow-soft"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() => setSlide((s) => Math.min(s + 1, product.images.length - 1))}
                    className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-card/80 shadow-soft"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                    {product.images.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        aria-label={`Go to image ${i + 1}`}
                        onClick={() => setSlide(i)}
                        className={`h-2 w-2 rounded-full transition-transform duration-150 ${
                          i === slide ? "scale-125 bg-primary" : "bg-border"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ring-1 ring-border ${flavourChip[product.flavour]}`}
                aria-hidden="true"
              />
              <span className="text-sm text-muted-foreground">
                {flavourLabels[product.flavour]}
              </span>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">{product.description}</p>

            <ul className="mt-4 flex flex-wrap gap-2">
              {product.badges.map((b) => (
                <li
                  key={b}
                  className="rounded-full bg-secondary/70 px-3 py-1 text-[11px] font-semibold text-secondary-foreground"
                >
                  {b}
                </li>
              ))}
            </ul>

            {variantsOf(product, allProducts).length > 0 && (
              <div className="mt-6">
                <p className="font-display text-sm font-semibold">Other variants</p>
                <ul className="mt-3 flex gap-3 overflow-x-auto pb-2">
                  {variantsOf(product, allProducts).map((v) => (
                    <li key={v.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(v)}
                        className="w-28 shrink-0 rounded-2xl bg-secondary/40 p-2 text-left transition-transform duration-150 hover:scale-105 active:scale-95"
                      >
                        <img
                          src={v.image}
                          alt={v.name}
                          width={768}
                          height={768}
                          loading="lazy"
                          decoding="async"
                          className="mx-auto h-16 w-auto object-contain"
                        />
                        <span className="mt-2 block truncate text-[11px] font-semibold">
                          {flavourLabels[v.flavour]}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-4 rounded-full bg-card/90 py-3 backdrop-blur">
              <span className="font-display text-2xl font-bold">GH₵ {product.price}</span>
              <QuantityStepper size="md" onAdd={(qty) => addItem(product.id, qty)} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
