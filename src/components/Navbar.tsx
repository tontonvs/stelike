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

// Off-white text sits on the orange pill; the active page gets its own dark
// (not pure-black) pill behind it, matching the requested selector style.
const navLinkBase =
  "rounded-full px-3.5 py-1.5 text-sm font-medium text-[#F9F9F9]/85 transition-colors";
const navLinkActive = "bg-[var(--pill-dark)] text-[#F9F9F9]";

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
    "grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#F9F9F9] transition-colors duration-150 hover:bg-black/10";

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
        <header className="mx-auto max-w-6xl rounded-full bg-[#FF6E42] shadow-float">
          <nav className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
            <Link
              to="/"
              className="shrink-0 font-sans text-2xl font-bold tracking-tight text-gold-gradient sm:text-3xl"
            >
              Stelike Exclusives
            </Link>

            <ul className="ml-6 hidden items-center gap-1 sm:flex">
              {mobileTabs.map((t) => (
                <li key={t.to}>
                  <Link
                    to={t.to}
                    activeOptions={{ exact: t.to === "/" }}
                    activeProps={{ className: navLinkActive }}
                    className={navLinkBase}
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>

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
                className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--pill-dark)] text-[#F9F9F9] transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                {justAddedFirst && (
                  <motion.span
                    initial={{ scale: 1, opacity: 0.55 }}
                    animate={{ scale: 2.4, opacity: 0 }}
                    transition={{ duration: 1, ease: EASE_OUT, repeat: 1 }}
                    className="absolute inset-0 rounded-full bg-[var(--pill-dark)]"
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
                    className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
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
                className="border-t border-black/10 px-4 py-3 sm:px-6"
              >
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                  <Search className="h-4 w-4 shrink-0 text-[#F9F9F9]/70" aria-hidden="true" />
                  <input
                    ref={inputRef}
                    type="search"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Search TV stands, bed frames, mirrors, tables…"
                    aria-label="Search products"
                    className="w-full bg-transparent text-sm text-[#F9F9F9] outline-none placeholder:text-[#F9F9F9]/60"
                  />
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      </div>

      {/* Mobile bottom tab bar — unchanged shape, kept separate from the floating pill */}
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
