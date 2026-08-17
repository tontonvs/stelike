import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartLine = { id: string; qty: number };

const STORAGE_KEY = "yoglait_cart_v1";

/** Reads the saved cart on first client render only — SSR always renders an
 * empty cart (no localStorage on the server), then this hydrates right
 * after mount. Wrapped in try/catch since a corrupted or manually-edited
 * localStorage value shouldn't crash the whole cart — it just falls back to
 * empty, same as a first-time visitor. */
function loadStoredLines(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is CartLine =>
        typeof l === "object" &&
        l !== null &&
        typeof l.id === "string" &&
        typeof l.qty === "number" &&
        l.qty > 0,
    );
  } catch {
    return [];
  }
}

type CartContextValue = {
  count: number;
  lines: CartLine[];
  addItem: (id: string, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue>({
  count: 0,
  lines: [],
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  clear: () => {},
  isOpen: false,
  openCart: () => {},
  closeCart: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Hydrate from localStorage once, after mount (client-only — see
  // loadStoredLines above). `hydrated` is state, not a ref, so becoming
  // true triggers its own re-render — that's what lets the persist effect
  // below wait until `lines` has actually caught up to the stored value,
  // rather than firing once with the stale empty initial array.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const stored = loadStoredLines();
    if (stored.length > 0) setLines(stored);
    setHydrated(true);
  }, []);

  // Persists on every change, but only once hydration has landed.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage can fail (quota, private browsing) — the cart still works
      // for this session, it just won't survive a reload. Not worth
      // surfacing to the customer over.
    }
  }, [lines, hydrated]);

  const addItem = useCallback((id: string, qty = 1) => {
    const amount = Math.max(1, Math.floor(qty) || 1);
    setLines((prev) => {
      const existing = prev.find((l) => l.id === id);
      if (existing) {
        return prev.map((l) => (l.id === id ? { ...l, qty: l.qty + amount } : l));
      }
      return [...prev, { id, qty: amount }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    const amount = Math.max(1, Math.floor(qty) || 1);
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, qty: amount } : l)));
  }, []);

  const clear = useCallback(() => setLines([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const count = useMemo(() => lines.reduce((sum, l) => sum + l.qty, 0), [lines]);
  const value = useMemo(
    () => ({ count, lines, addItem, removeItem, updateQty, clear, isOpen, openCart, closeCart }),
    [count, lines, addItem, removeItem, updateQty, clear, isOpen, openCart, closeCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
