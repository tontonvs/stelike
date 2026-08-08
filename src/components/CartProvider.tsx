import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type CartLine = { id: string; qty: number };

type CartContextValue = {
  count: number;
  lines: CartLine[];
  addItem: (id: string, qty?: number) => void;
};

const CartContext = createContext<CartContextValue>({
  count: 0,
  lines: [],
  addItem: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

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

  const count = useMemo(() => lines.reduce((sum, l) => sum + l.qty, 0), [lines]);
  const value = useMemo(() => ({ count, lines, addItem }), [count, lines, addItem]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
