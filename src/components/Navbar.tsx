import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Home, Mail, Search, ShoppingBag, ShoppingCart, X } from "lucide-react";
import { useCart } from "./CartProvider";
import { EASE_OUT } from "@/lib/motion";

const mobileTabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/contact", label: "Contact", icon: Mail },
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
    navigate({ to: "/shop", search: q ? { q } : {} });
    setSearchOpen(false);
  };

  const iconButton =
    "grid h-9 w-9 shrink-0 place-items-center rounded-full text-foreground transition-colors duration-150 hover:bg-secondary";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background">
        <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-8">
          <Link to="/" className="font-brand shrink-0 text-3xl tracking-tight sm:text-4xl">
            Stelike Exclusives
          </Link>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen((o) => !o)}
              aria-label={searchOpen ? "Close search" : "Search products"}
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
              className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform duration-200 hover:scale-105 active:scale-95"
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
              className="border-t border-border px-4 py-3 sm:px-8"
            >
              <form onSubmit={handleSearchSubmit} className="mx-auto flex max-w-6xl items-center gap-2">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="search"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search TV stands, bed frames, mirrors, tables…"
                  aria-label="Search products"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 py-1.5">
          {mobileTabs.map((t) => (
            <li key={t.to} className="flex-1">
              <Link
                to={t.to}
                activeOptions={{ exact: t.to === "/" }}
                activeProps={{ className: "text-primary" }}
                className="flex flex-col items-center gap-0.5 rounded-sm px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors"
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
