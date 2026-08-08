import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./CartProvider";
import { EASE_OUT } from "@/lib/motion";

const links = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const { count } = useCart();

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
      className="fixed inset-x-0 top-3 z-50 px-3 sm:top-5 sm:px-6"
    >
      <nav className="mx-auto flex max-w-4xl items-center gap-2 rounded-full border border-card/60 bg-card/70 px-3 py-2 shadow-float backdrop-blur-xl sm:gap-4 sm:px-5">
        <Link
          to="/"
          className="font-display shrink-0 text-lg font-bold tracking-tight text-foreground sm:text-xl"
        >
          Yoglait
        </Link>

        <ul className="flex min-w-0 flex-1 items-center justify-center gap-0.5 sm:gap-1">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                activeProps={{ className: "bg-secondary text-secondary-foreground" }}
                className="inline-flex rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground sm:px-4 sm:text-sm"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          aria-label={`Cart, ${count} items`}
          className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          {count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 0.6 }}
              animate={{ scale: [1.35, 1] }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
              className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground"
            >
              {count}
            </motion.span>
          )}
        </button>
      </nav>
    </motion.header>
  );
}
