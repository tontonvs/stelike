import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Home, ListOrdered, Phone, Search, ShoppingBag, UtensilsCrossed, X } from "lucide-react";
import { useCart } from "./CartProvider";
import { EASE_OUT } from "@/lib/motion";

const links = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

const mobileTabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/contact", label: "Contact", icon: Phone },
  { to: "/orders", label: "Orders", icon: ListOrdered },
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

  const iconButton =
    "grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-secondary/60 hover:text-foreground";

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT }}
        className="fixed inset-x-0 top-0 z-50 px-0 sm:top-5 sm:px-6"
      >
        <nav className="mx-auto flex max-w-4xl items-center gap-2 border-b border-sky-deep/30 bg-sky/90 px-4 py-3 shadow-float backdrop-blur-xl sm:gap-4 sm:rounded-full sm:border sm:border-card/60 sm:bg-card/70 sm:px-5 sm:py-2">
          <Link
            to="/"
            className="font-display shrink-0 text-lg font-bold tracking-tight text-foreground sm:text-xl"
          >
            Yoglait
          </Link>

          {/* Desktop links — on mobile these live in the bottom tab bar */}
          <ul className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 sm:flex sm:gap-1">
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

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen((o) => !o)}
              aria-label={searchOpen ? "Close search" : "Search the menu"}
              aria-expanded={searchOpen}
              className={iconButton}
            >
              {searchOpen ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Search className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            <Link to="/notifications" aria-label="Notifications" className={iconButton}>
              <Bell className="h-4 w-4" aria-hidden="true" />
            </Link>

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
          </div>
        </nav>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="mx-auto mt-2 max-w-4xl px-3 sm:px-0"
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

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-sky-deep/30 bg-sky/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 py-1.5">
          {mobileTabs.map((t) => (
            <li key={t.to} className="flex-1">
              <Link
                to={t.to}
                activeOptions={{ exact: t.to === "/" }}
                activeProps={{ className: "text-primary" }}
                className="flex flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors"
              >
                <t.icon className="h-5 w-5" aria-hidden="true" />
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
