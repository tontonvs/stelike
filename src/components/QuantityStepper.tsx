import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { EASE_OUT } from "@/lib/motion";

type Props = {
  onAdd: (qty: number) => void;
  label?: string;
  size?: "sm" | "md";
};

/**
 * "Buy" button that morphs into a compact stepper.
 * Auto-confirms (adds to cart) once interaction settles.
 */
export function QuantityStepper({ onAdd, label = "Buy", size = "sm" }: Props) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [raw, setRaw] = useState("1");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();

  const scheduleConfirm = (nextQty: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onAdd(nextQty);
      setOpen(false);
      setQty(1);
      setRaw("1");
    }, 3500);
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const change = (delta: number) => {
    const next = Math.max(1, qty + delta);
    setQty(next);
    setRaw(String(next));
    scheduleConfirm(next);
  };

  const pad = size === "md" ? "px-5 py-2.5 text-sm" : "px-5 py-2 text-xs";

  return (
    <div className="relative">
      <AnimatePresence mode="wait" initial={false}>
        {!open ? (
          <motion.button
            key="buy"
            type="button"
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduce ? 1 : 0.9 }}
            transition={{ duration: 0.16, ease: EASE_OUT }}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
              setQty(1);
              setRaw("1");
              scheduleConfirm(1);
            }}
            className={`rounded-full bg-primary font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95 ${pad}`}
          >
            {label}
          </motion.button>
        ) : (
          <motion.div
            key="stepper"
            initial={reduce ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduce ? 1 : 0.92 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 rounded-full bg-primary px-1.5 py-1 text-primary-foreground shadow-soft"
          >
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={qty <= 1}
              onClick={() => change(-1)}
              className="grid h-7 w-7 place-items-center rounded-full bg-card/25 transition-transform duration-150 hover:scale-110 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <input
              aria-label="Quantity"
              inputMode="numeric"
              pattern="[0-9]*"
              value={raw}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                setRaw(v);
                const n = Number(v);
                if (n >= 1) {
                  setQty(n);
                  scheduleConfirm(n);
                }
              }}
              onBlur={() => {
                const n = Number(raw);
                const next = !n || n < 1 ? 1 : n;
                setQty(next);
                setRaw(String(next));
                scheduleConfirm(next);
              }}
              className="w-9 bg-transparent text-center text-sm font-bold outline-none"
            />
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => change(1)}
              className="grid h-7 w-7 place-items-center rounded-full bg-card/25 transition-transform duration-150 hover:scale-110 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
