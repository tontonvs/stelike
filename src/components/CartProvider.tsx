import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type CartLine = { id: string; qty: number };

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
