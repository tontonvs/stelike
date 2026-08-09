import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "./CartProvider";
import { resolveCartItems, cartSubtotal } from "@/lib/cart";
import { flavourChip, flavourLabels } from "@/lib/products";
import { EASE_OUT } from "@/lib/motion";

export function CartDrawer() {
  const { lines, isOpen, closeCart, removeItem, updateQty } = useCart();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  const items = resolveCartItems(lines);
  const subtotal = cartSubtotal(items);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cart-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          onClick={closeCart}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-stretch sm:justify-end"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Your cart"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.98 }}
            transition={{ duration: 0.26, ease: EASE_OUT }}
            drag={reduce ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110) closeCart();
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-4xl bg-card shadow-float sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none sm:rounded-l-4xl"
          >
            <div
              className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border sm:hidden"
              aria-hidden="true"
            />

            <div className="flex shrink-0 items-center justify-between gap-3 p-5 pb-3">
              <h2 className="font-display text-2xl font-bold">Your Cart</h2>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary transition-transform duration-150 hover:scale-105 active:scale-95"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary/60">
                    <ShoppingBag className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                  </span>
                  <p className="text-sm text-muted-foreground">
                    Your cart's empty — chill, no pressure.
                  </p>
                  <Link
                    to="/menu"
                    onClick={closeCart}
                    className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
                  >
                    Browse Menu
                  </Link>
                </div>
              ) : (
                <ul className="flex flex-col gap-3 py-2">
                  <AnimatePresence initial={false}>
                    {items.map(({ line, product }) => (
                      <motion.li
                        key={line.id}
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18, ease: EASE_OUT }}
                        className="flex items-center gap-3 rounded-3xl bg-secondary/30 p-3"
                      >
                        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-secondary/50">
                          <img
                            src={product.image}
                            alt={product.name}
                            width={768}
                            height={768}
                            loading="lazy"
                            decoding="async"
                            className="h-12 w-auto object-contain"
                          />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border ${flavourChip[product.flavour]}`}
                              aria-hidden="true"
                            />
                            <span className="truncate text-xs font-medium text-muted-foreground">
                              {flavourLabels[product.flavour]} · {product.size}
                            </span>
                          </div>
                          <p className="font-display truncate text-sm font-semibold">
                            {product.name}
                          </p>
                          <p className="text-xs font-bold text-foreground">GH₵ {product.price}</p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <button
                            type="button"
                            aria-label={`Remove ${product.name} from cart`}
                            onClick={() => removeItem(line.id)}
                            className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-transform duration-150 hover:scale-110 hover:text-destructive active:scale-95"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <div className="flex items-center gap-1 rounded-full bg-card px-1 py-1 shadow-soft">
                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${product.name}`}
                              disabled={line.qty <= 1}
                              onClick={() => updateQty(line.id, line.qty - 1)}
                              className="grid h-6 w-6 place-items-center rounded-full transition-transform duration-150 hover:scale-110 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                            >
                              <Minus className="h-3 w-3" aria-hidden="true" />
                            </button>
                            <input
                              aria-label={`Quantity of ${product.name}`}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={line.qty}
                              onChange={(e) => {
                                const v = e.target.value.replace(/[^0-9]/g, "");
                                if (v === "") return;
                                updateQty(line.id, Number(v));
                              }}
                              onBlur={(e) => {
                                if (e.target.value === "" || Number(e.target.value) < 1) {
                                  updateQty(line.id, 1);
                                }
                              }}
                              className="w-7 bg-transparent text-center text-xs font-bold outline-none"
                            />
                            <button
                              type="button"
                              aria-label={`Increase quantity of ${product.name}`}
                              onClick={() => updateQty(line.id, line.qty + 1)}
                              className="grid h-6 w-6 place-items-center rounded-full transition-transform duration-150 hover:scale-110 active:scale-95"
                            >
                              <Plus className="h-3 w-3" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="shrink-0 border-t border-border p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Subtotal</span>
                  <span className="font-display text-2xl font-bold">GH₵ {subtotal}</span>
                </div>
                <Link
                  to="/checkout"
                  onClick={closeCart}
                  className="mt-4 block w-full rounded-full bg-primary py-3 text-center text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                  Checkout
                </Link>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Prefer WhatsApp?{" "}
                  <a
                    href="https://wa.me/233205527771"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-foreground underline"
                  >
                    Message us to order
                  </a>
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
