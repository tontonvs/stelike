import type { Variants } from "framer-motion";

/** Strict motion system: short, ease-out, transform/opacity only. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } },
};

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

export const viewportOnce = { once: true, amount: 0.2 } as const;

export const hoverLift = {
  whileHover: { scale: 1.03, y: -4 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.18, ease: EASE_OUT },
};
