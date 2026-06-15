"use client";

import {
  createContext, useContext, useReducer, useEffect, useCallback,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";

const LS_KEY = "apt-wishlist";

/* ─── Reducer ─────────────────────────────────────────────────────────────── */
interface State {
  ids:    Set<string>;
  status: "idle" | "syncing" | "ready";
}

type Action =
  | { type: "hydrate"; ids: string[] }
  | { type: "add";     id: string }
  | { type: "remove";  id: string }
  | { type: "status";  value: State["status"] };

function writeLs(ids: Set<string>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify([...ids])); } catch {}
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate": {
      const ids = new Set(action.ids);
      writeLs(ids);
      return { ...state, ids, status: "ready" };
    }
    case "add": {
      const ids = new Set(state.ids);
      ids.add(action.id);
      writeLs(ids);
      return { ...state, ids };
    }
    case "remove": {
      const ids = new Set(state.ids);
      ids.delete(action.id);
      writeLs(ids);
      return { ...state, ids };
    }
    case "status":
      return { ...state, status: action.value };
    default:
      return state;
  }
}

/* ─── Context ─────────────────────────────────────────────────────────────── */
interface WishlistContextValue {
  ids:    Set<string>;
  status: State["status"];
  has:    (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
  isAuth: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

/* ─── Provider ────────────────────────────────────────────────────────────── */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { data: session, status: authStatus } = useSession();
  const isAuth = authStatus === "authenticated";

  const [state, dispatch] = useReducer(reducer, {
    ids:    new Set<string>(),
    status: "idle",
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const ids = JSON.parse(raw) as string[];
        if (Array.isArray(ids)) dispatch({ type: "hydrate", ids });
      } else {
        dispatch({ type: "status", value: "ready" });
      }
    } catch {
      dispatch({ type: "status", value: "ready" });
    }
  }, []);

  // Sync from server when authenticated (server is source of truth)
  useEffect(() => {
    if (!isAuth) return;
    dispatch({ type: "status", value: "syncing" });
    fetch("/api/me/wishlist")
      .then((r) => r.json())
      .then((data: { ids?: string[] }) => {
        dispatch({ type: "hydrate", ids: data.ids ?? [] });
      })
      .catch(() => dispatch({ type: "status", value: "ready" }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, session?.user?.id]);

  const toggle = useCallback(
    async (id: string) => {
      const wasIn = state.ids.has(id);

      // Optimistic update
      dispatch({ type: wasIn ? "remove" : "add", id });

      if (!isAuth) return; // guests: localStorage only

      // Sync to server
      try {
        if (wasIn) {
          await fetch(`/api/me/wishlist?productId=${id}`, { method: "DELETE" });
        } else {
          await fetch("/api/me/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: id }),
          });
        }
      } catch {
        // Rollback on error
        dispatch({ type: wasIn ? "add" : "remove", id });
      }
    },
    [state.ids, isAuth]
  );

  const has = useCallback((id: string) => state.ids.has(id), [state.ids]);

  return (
    <WishlistContext.Provider value={{ ids: state.ids, status: state.status, has, toggle, isAuth }}>
      {children}
    </WishlistContext.Provider>
  );
}

/* ─── Hook ────────────────────────────────────────────────────────────────── */
export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
