import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type CartContextValue = {
  count: number;
  addItem: (id: string) => void;
};

const CartContext = createContext<CartContextValue>({ count: 0, addItem: () => {} });

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>([]);

  const addItem = useCallback((id: string) => {
    setItems((prev) => [...prev, id]);
  }, []);

  const value = useMemo(() => ({ count: items.length, addItem }), [items.length, addItem]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
