import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "./CartProvider";
import { EASE_OUT } from "@/lib/motion";

const links = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const { count, openCart } = useCart();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // First-item pulse: only fires on the 0 -> 1 transition, not on every add,
  // so it draws a first-time visitor's eye to the cart without becoming
  // annoying on repeat purchases.
  const prevCount = useRef(count);
  const [justAddedFirst, setJustAddedFirst] = useState(false);
  useEffect(() => {
    const wasEmpty = prevCount.current === 0;
    prevCount.current = count;
    if (wasEmpty && count > 0) {
      setJustAddedFirst(true);
      const timeout = window.setTimeout(() => setJustAddedFirst(false), 1200);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [count]);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = searchValue.trim();
    navigate({ to: "/menu", search: q ? { q } : {} });
    setSearchOpen(false);
  };

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
          onClick={() => setSearchOpen((o) => !o)}
          aria-label={searchOpen ? "Close search" : "Search the menu"}
          aria-expanded={searchOpen}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-secondary/60 hover:text-foreground"
        >
          {searchOpen ? (
            <X className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={openCart}
          aria-label={`Cart, ${count} items`}
          className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          {justAddedFirst && (
            <motion.span
              initial={{ scale: 1, opacity: 0.55 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 1, ease: EASE_OUT, repeat: 1 }}
              className="absolute inset-0 rounded-full bg-primary"
              aria-hidden="true"
            />
          )}
          <ShoppingBag className="relative h-4 w-4" aria-hidden="true" />
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

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="mx-auto mt-2 max-w-4xl"
          >
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-2 rounded-full border border-card/60 bg-card/90 px-4 py-2.5 shadow-float backdrop-blur-xl"
            >
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search flavours — vanilla, strawberry, greek…"
                aria-label="Search the menu"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
