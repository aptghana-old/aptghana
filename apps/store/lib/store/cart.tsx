"use client";

import {
  createContext, useContext, useReducer, useEffect, useCallback,
  type ReactNode,
} from "react";

const LS_KEY = "apt-cart-v2";

/* ─── Types ───────────────────────────────────────────────────────────────── */
export interface CartItem {
  productId: string;
  sku?:      string;
  name:      string;
  imageUrl:  string;
  price:     number;
  currency:  string;
  qty:       number;
  minQty:    number;
  addedAt:   number;
}

export interface CartProductInput {
  id:       string;
  sku?:     string;
  name:     string;
  imageUrl: string;
  price:    number;
  currency: string;
  minQty?:  number;
}

/* ─── Reducer ─────────────────────────────────────────────────────────────── */
interface State { items: CartItem[] }

type Action =
  | { type: "hydrate"; items: CartItem[] }
  | { type: "add";     input: CartProductInput; qty: number }
  | { type: "remove";  productId: string }
  | { type: "set-qty"; productId: string; qty: number }
  | { type: "clear" };

function persist(items: CartItem[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { items: action.items };

    case "add": {
      const exists = state.items.some((i) => i.productId === action.input.id);
      const items = exists
        ? state.items.map((i) =>
            i.productId === action.input.id ? { ...i, qty: i.qty + action.qty } : i
          )
        : [
            ...state.items,
            {
              productId: action.input.id,
              sku:       action.input.sku,
              name:      action.input.name,
              imageUrl:  action.input.imageUrl,
              price:     action.input.price,
              currency:  action.input.currency,
              qty:       action.qty,
              minQty:    action.input.minQty ?? 1,
              addedAt:   Date.now(),
            },
          ];
      persist(items);
      return { items };
    }

    case "remove": {
      const items = state.items.filter((i) => i.productId !== action.productId);
      persist(items);
      return { items };
    }

    case "set-qty": {
      const items = state.items.map((i) =>
        i.productId === action.productId
          ? { ...i, qty: Math.max(i.minQty, action.qty) }
          : i
      );
      persist(items);
      return { items };
    }

    case "clear":
      persist([]);
      return { items: [] };

    default:
      return state;
  }
}

/* ─── Context ─────────────────────────────────────────────────────────────── */
interface CartContextValue {
  items:   CartItem[];
  count:   number;
  total:   number;
  has:     (productId: string) => boolean;
  getQty:  (productId: string) => number;
  add:     (input: CartProductInput, qty?: number) => void;
  remove:  (productId: string) => void;
  setQty:  (productId: string, qty: number) => void;
  clear:   () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/* ─── Provider ────────────────────────────────────────────────────────────── */
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const items = JSON.parse(raw) as CartItem[];
        if (Array.isArray(items)) dispatch({ type: "hydrate", items });
      }
    } catch {}
  }, []);

  // Cross-tab sync: update state when another tab writes to localStorage
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== LS_KEY) return;
      try {
        const items = e.newValue ? (JSON.parse(e.newValue) as CartItem[]) : [];
        if (Array.isArray(items)) dispatch({ type: "hydrate", items });
      } catch {}
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const count  = state.items.reduce((n, i) => n + i.qty, 0);
  const total  = state.items.reduce((n, i) => n + i.price * i.qty, 0);
  const has    = useCallback((id: string) => state.items.some((i) => i.productId === id), [state.items]);
  const getQty = useCallback((id: string) => state.items.find((i) => i.productId === id)?.qty ?? 0, [state.items]);
  const add    = useCallback((input: CartProductInput, qty = 1) => dispatch({ type: "add", input, qty }), []);
  const remove = useCallback((productId: string) => dispatch({ type: "remove", productId }), []);
  const setQty = useCallback((productId: string, qty: number) => dispatch({ type: "set-qty", productId, qty }), []);
  const clear  = useCallback(() => dispatch({ type: "clear" }), []);

  return (
    <CartContext.Provider value={{ items: state.items, count, total, has, getQty, add, remove, setQty, clear }}>
      {children}
    </CartContext.Provider>
  );
}

/* ─── Hook ────────────────────────────────────────────────────────────────── */
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
