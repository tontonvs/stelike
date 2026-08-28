import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

const messages = ["Hello, Customer.", "Get modern, luxury designed furniture."];

const ROTATE_MS = 3500;

/** ~1.7cm-tall banner just below the top nav. Auto-crossfades between
 * messages on a timer — no dots, no swipe, purely passive. */
export function GreetingBanner() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return undefined;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <div className="relative flex h-[1.7cm] items-center justify-center overflow-hidden bg-primary px-4">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          className="font-display text-center text-sm font-medium text-primary-foreground sm:text-base"
        >
          {messages[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
