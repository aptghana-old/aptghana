"use client";

import {
  createContext, useContext, useReducer, useEffect, useCallback,
  type ReactNode,
} from "react";
import type { RfqSource } from "@apt/types";

/* ─── Types ───────────────────────────────────────────────────────────────── */
export interface DraftItem {
  productId: string;
  sku?:      string;
  name:      string;
  brandName?: string;
  imageUrl:  string;
  qty:       number;
  minQty:    number;
  notes:     string;
  /** Product not listed on the website (manually described) */
  custom?:   boolean;
  addedAt:   number;
}

export interface DraftItemInput {
  productId: string;
  sku?:      string;
  name:      string;
  brandName?: string;
  imageUrl?: string;
  qty?:      number;
  minQty?:   number;
  notes?:    string;
  custom?:   boolean;
}

export interface DraftAttachment {
  id:   string;
  name: string;
  size: number;
  contentType: string;
}

interface DraftState {
  hydrated:    boolean;
  items:       DraftItem[];
  attachments: DraftAttachment[];
  message:     string;
  source:      RfqSource;
}

interface PersistedDraft {
  items:       DraftItem[];
  attachments: DraftAttachment[];
  message:     string;
  source:      RfqSource;
}

/* ─── Reducer ─────────────────────────────────────────────────────────────── */
type Action =
  | { type: "hydrate"; draft: PersistedDraft }
  | { type: "add-items"; inputs: DraftItemInput[]; source?: RfqSource }
  | { type: "remove"; productId: string }
  | { type: "set-qty"; productId: string; qty: number }
  | { type: "set-note"; productId: string; notes: string }
  | { type: "set-message"; message: string }
  | { type: "add-attachment"; attachment: DraftAttachment }
  | { type: "remove-attachment"; id: string }
  | { type: "clear" };

function toItem(input: DraftItemInput): DraftItem {
  const minQty = Math.max(1, input.minQty ?? 1);
  return {
    productId: input.productId,
    sku:       input.sku,
    name:      input.name,
    brandName: input.brandName,
    imageUrl:  input.imageUrl ?? "",
    qty:       Math.max(minQty, input.qty ?? minQty),
    minQty,
    notes:     input.notes ?? "",
    custom:    input.custom,
    addedAt:   Date.now(),
  };
}

function sanitize(parsed: Partial<PersistedDraft>): PersistedDraft {
  return {
    items:       Array.isArray(parsed.items) ? parsed.items : [],
    attachments: Array.isArray(parsed.attachments) ? parsed.attachments : [],
    message:     typeof parsed.message === "string" ? parsed.message : "",
    source:      parsed.source === "single_product" || parsed.source === "custom" ? parsed.source : "cart",
  };
}

/* ─── Context value ───────────────────────────────────────────────────────── */
export interface RequestDraftValue {
  hydrated:    boolean;
  items:       DraftItem[];
  attachments: DraftAttachment[];
  count:       number;
  message:     string;
  source:      RfqSource;
  has:         (productId: string) => boolean;
  addItems:    (inputs: DraftItemInput[], source?: RfqSource) => void;
  remove:      (productId: string) => void;
  setQty:      (productId: string, qty: number) => void;
  setNote:     (productId: string, notes: string) => void;
  setMessage:  (message: string) => void;
  addAttachment:    (attachment: DraftAttachment) => void;
  removeAttachment: (id: string) => void;
  clear:       () => void;
}

/**
 * Factory for persisted procurement drafts. Two isolated instances exist:
 * the Request for Approval draft (cart procurement) and the RFQ draft
 * (single/custom products) — same behaviour, separate storage keys.
 */
export function createRequestDraftStore(lsKey: string, displayName: string) {
  const EMPTY: DraftState = { hydrated: false, items: [], attachments: [], message: "", source: "cart" };

  function persist(state: DraftState) {
    try {
      const payload: PersistedDraft = {
        items: state.items, attachments: state.attachments,
        message: state.message, source: state.source,
      };
      localStorage.setItem(lsKey, JSON.stringify(payload));
    } catch {}
  }

  function reducer(state: DraftState, action: Action): DraftState {
    switch (action.type) {
      case "hydrate":
        return { ...state, ...action.draft, hydrated: true };

      case "add-items": {
        // Additive merge: never overwrite qty/notes the user already set
        const fresh = action.inputs
          .filter((input) => !state.items.some((i) => i.productId === input.productId))
          .map(toItem);
        if (!fresh.length && (!action.source || action.source === state.source)) return state;
        const next = {
          ...state,
          items: [...state.items, ...fresh],
          source: action.source ?? state.source,
        };
        persist(next);
        return next;
      }

      case "remove": {
        const next = { ...state, items: state.items.filter((i) => i.productId !== action.productId) };
        persist(next);
        return next;
      }

      case "set-qty": {
        const next = {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.productId ? { ...i, qty: Math.max(i.minQty, action.qty) } : i
          ),
        };
        persist(next);
        return next;
      }

      case "set-note": {
        const next = {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.productId ? { ...i, notes: action.notes } : i
          ),
        };
        persist(next);
        return next;
      }

      case "set-message": {
        const next = { ...state, message: action.message };
        persist(next);
        return next;
      }

      case "add-attachment": {
        if (state.attachments.some((a) => a.id === action.attachment.id)) return state;
        const next = { ...state, attachments: [...state.attachments, action.attachment] };
        persist(next);
        return next;
      }

      case "remove-attachment": {
        const next = { ...state, attachments: state.attachments.filter((a) => a.id !== action.id) };
        persist(next);
        return next;
      }

      case "clear": {
        const next = { ...EMPTY, hydrated: true };
        persist(next);
        return next;
      }

      default:
        return state;
    }
  }

  const Ctx = createContext<RequestDraftValue | null>(null);

  function Provider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, EMPTY);

    // Hydrate from localStorage once on mount
    useEffect(() => {
      let draft: PersistedDraft = sanitize({});
      try {
        const raw = localStorage.getItem(lsKey);
        if (raw) draft = sanitize(JSON.parse(raw) as Partial<PersistedDraft>);
      } catch {}
      dispatch({ type: "hydrate", draft });
    }, []);

    // Cross-tab sync
    useEffect(() => {
      const handler = (e: StorageEvent) => {
        if (e.key !== lsKey || !e.newValue) return;
        try {
          dispatch({ type: "hydrate", draft: sanitize(JSON.parse(e.newValue) as Partial<PersistedDraft>) });
        } catch {}
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    }, []);

    const has        = useCallback((id: string) => state.items.some((i) => i.productId === id), [state.items]);
    const addItems   = useCallback((inputs: DraftItemInput[], source?: RfqSource) => dispatch({ type: "add-items", inputs, source }), []);
    const remove     = useCallback((productId: string) => dispatch({ type: "remove", productId }), []);
    const setQty     = useCallback((productId: string, qty: number) => dispatch({ type: "set-qty", productId, qty }), []);
    const setNote    = useCallback((productId: string, notes: string) => dispatch({ type: "set-note", productId, notes }), []);
    const setMessage = useCallback((message: string) => dispatch({ type: "set-message", message }), []);
    const addAttachment    = useCallback((attachment: DraftAttachment) => dispatch({ type: "add-attachment", attachment }), []);
    const removeAttachment = useCallback((id: string) => dispatch({ type: "remove-attachment", id }), []);
    const clear      = useCallback(() => dispatch({ type: "clear" }), []);

    return (
      <Ctx.Provider value={{
        hydrated: state.hydrated, items: state.items, attachments: state.attachments,
        count: state.items.length, message: state.message, source: state.source,
        has, addItems, remove, setQty, setNote, setMessage,
        addAttachment, removeAttachment, clear,
      }}>
        {children}
      </Ctx.Provider>
    );
  }
  Provider.displayName = `${displayName}Provider`;

  function useDraft(): RequestDraftValue {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error(`use${displayName} must be used within ${displayName}Provider`);
    return ctx;
  }

  return { Provider, useDraft };
}

/* ─── Instances ───────────────────────────────────────────────────────────── */
const rfa = createRequestDraftStore("apt-rfa-draft-v1", "ApprovalDraft");
const rfq = createRequestDraftStore("apt-rfq-draft-v1", "RfqDraft");

/** Request for Approval draft — cart-based procurement. */
export const ApprovalDraftProvider = rfa.Provider;
export const useApprovalDraft = rfa.useDraft;

/** RFQ draft — single-product and custom-product quotations. */
export const RfqDraftProvider = rfq.Provider;
export const useRfqDraft = rfq.useDraft;
