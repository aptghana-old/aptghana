"use client";

import {
  createContext, useContext, useReducer, useEffect, useCallback, useState, useRef,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";

export const COMPARE_MAX = 4;
const LS_KEY = "apt-compare";

/* ─── Types ───────────────────────────────────────────────────────────────── */
export interface CompareItem {
  id:        string;
  name:      string;
  slug:      string;
  imageUrl:  string;
  brandName: string;
}

/* ─── Reducer ─────────────────────────────────────────────────────────────── */
interface State { items: CompareItem[] }

type Action =
  | { type: "hydrate"; items: CompareItem[] }
  | { type: "add";    item: CompareItem }
  | { type: "remove"; id: string }
  | { type: "clear" };

function persist(items: CompareItem[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { items: action.items.slice(0, COMPARE_MAX) };

    case "add": {
      if (state.items.some((i) => i.id === action.item.id)) return state;
      if (state.items.length >= COMPARE_MAX) return state;
      const items = [...state.items, action.item];
      persist(items);
      return { items };
    }

    case "remove": {
      const items = state.items.filter((i) => i.id !== action.id);
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
interface CompareContextValue {
  items:       CompareItem[];
  count:       number;
  isAtMax:     boolean;
  isModalOpen: boolean;
  has:         (id: string) => boolean;
  toggle:      (item: CompareItem) => void;
  remove:      (id: string) => void;
  clear:       () => void;
  openModal:   () => void;
  closeModal:  () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

/* ─── Provider ────────────────────────────────────────────────────────────── */
export function CompareProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useSession();
  const isAuth = authStatus === "authenticated";
  const [state, dispatch] = useReducer(reducer, { items: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const serverSynced = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const items = JSON.parse(raw) as CompareItem[];
        if (Array.isArray(items)) dispatch({ type: "hydrate", items });
      }
    } catch {}
  }, []);

  // Signed-in users keep comparisons across devices: merge the server copy
  // in once, then persist every change back (debounced)
  useEffect(() => {
    if (!isAuth || serverSynced.current) return;
    serverSynced.current = true;
    fetch("/api/me/compare")
      .then((r) => r.json())
      .then((data: { items?: CompareItem[] }) => {
        if (!Array.isArray(data.items) || data.items.length === 0) return;
        dispatch({ type: "hydrate", items: data.items });
        persist(data.items.slice(0, COMPARE_MAX));
      })
      .catch(() => {});
  }, [isAuth]);

  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isAuth || !serverSynced.current) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    const items = state.items;
    pushTimer.current = setTimeout(() => {
      fetch("/api/me/compare", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }).catch(() => {});
    }, 800);
    return () => { if (pushTimer.current) clearTimeout(pushTimer.current); };
  }, [isAuth, state.items]);

  // Modal can only be open while there are products to compare
  const modalOpen = isModalOpen && state.items.length > 0;

  const has    = useCallback((id: string) => state.items.some((i) => i.id === id), [state.items]);
  const toggle = useCallback(
    (item: CompareItem) => {
      if (state.items.some((i) => i.id === item.id)) {
        dispatch({ type: "remove", id: item.id });
      } else {
        dispatch({ type: "add", item });
      }
    },
    [state.items]
  );
  const remove     = useCallback((id: string) => dispatch({ type: "remove", id }), []);
  const clear      = useCallback(() => dispatch({ type: "clear" }), []);
  const openModal  = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  return (
    <CompareContext.Provider value={{
      items:   state.items,
      count:   state.items.length,
      isAtMax: state.items.length >= COMPARE_MAX,
      isModalOpen: modalOpen, has, toggle, remove, clear, openModal, closeModal,
    }}>
      {children}
    </CompareContext.Provider>
  );
}

/* ─── Hook ────────────────────────────────────────────────────────────────── */
export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
