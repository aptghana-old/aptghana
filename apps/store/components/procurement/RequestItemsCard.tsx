"use client";

import { useState, type ReactNode } from "react";
import QtyStepper from "@/components/ui/QtyStepper";
import { Icon } from "@/components/account/ui";
import type { DraftItem } from "@/lib/store/request-draft";
import { Card, D } from "./icons";

function ItemThumb({ url, alt, custom }: { url: string; alt: string; custom?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-(--bg-raised)">
      {url && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} className="w-full h-full object-contain p-1.5" onError={() => setFailed(true)} />
      ) : (
        <Icon d={custom ? D.wrench : D.box} size={24} strokeWidth={1.25} className="text-(--text-4)" />
      )}
    </div>
  );
}

interface RowHandlers {
  onSetQty: (productId: string, qty: number) => void;
  onSetNote: (productId: string, notes: string) => void;
  onRemove: (productId: string) => void;
}

function ItemRow({ item, onSetQty, onSetNote, onRemove }: { item: DraftItem } & RowHandlers) {
  const [noteOpen, setNoteOpen] = useState(Boolean(item.notes));

  const controls = (size: "sm" | "md") => (
    <div className="flex items-center gap-2">
      <QtyStepper
        qty={item.qty}
        minQty={item.minQty}
        size={size}
        onChange={(q) => onSetQty(item.productId, q)}
        label={`Quantity for ${item.name}`}
      />
      <button
        type="button"
        onClick={() => onRemove(item.productId)}
        aria-label={`Remove ${item.name} from request`}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-(--text-4) hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <Icon d={D.trash} size={15} />
      </button>
    </div>
  );

  return (
    <li className="px-5 sm:px-6 py-4">
      <div className="flex gap-3 sm:gap-4 items-start">
        <ItemThumb url={item.imageUrl} alt={item.name} custom={item.custom} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {item.brandName && (
              <p className="text-[11px] font-bold text-navy-500 uppercase tracking-wide truncate">{item.brandName}</p>
            )}
            {item.custom && (
              <span className="px-1.5 py-px text-[9px] font-bold rounded uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Custom item
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-(--text-1) leading-snug line-clamp-2">{item.name}</p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {item.sku && <span className="text-[11px] font-mono text-(--text-4)">{item.custom ? "Part no." : "SKU"} {item.sku}</span>}
            {item.minQty > 1 && <span className="text-[11px] text-(--text-4)">Min {item.minQty} units</span>}
          </div>

          {/* Mobile controls */}
          <div className="mt-2.5 sm:hidden">{controls("sm")}</div>

          {/* Per-item note */}
          {noteOpen ? (
            <textarea
              value={item.notes}
              onChange={(e) => onSetNote(item.productId, e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Notes for this item — voltage, configuration, alternatives accepted…"
              aria-label={`Notes for ${item.name}`}
              className="mt-2.5 w-full px-3 py-2 rounded-lg border text-[13px] text-(--text-1) placeholder:text-(--text-4) focus:outline-none focus:border-navy-500 transition-colors resize-y"
              style={{ background: "var(--bg-base)", borderColor: "var(--border)" }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setNoteOpen(true)}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-(--text-4) hover:text-navy-500 transition-colors"
            >
              <Icon d={D.note} size={11} strokeWidth={2} />
              Add item note
            </button>
          )}
        </div>

        {/* Desktop controls */}
        <div className="hidden sm:block shrink-0">{controls("md")}</div>
      </div>
    </li>
  );
}

interface RequestItemsCardProps extends RowHandlers {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  items: DraftItem[];
  hydrated: boolean;
  /** Rendered below the item list inside the card (e.g. a custom-item form). */
  footer?: ReactNode;
}

export default function RequestItemsCard({
  title, subtitle, action, items, hydrated, footer,
  onSetQty, onSetNote, onRemove,
}: RequestItemsCardProps) {
  return (
    <Card title={title} subtitle={subtitle} action={action}>
      {/* Desktop header row */}
      <div
        className="hidden sm:flex items-center px-6 py-2.5 border-b text-[11px] font-bold uppercase tracking-wider text-(--text-4)"
        style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
      >
        <span className="flex-1">Product</span>
        <span className="w-[150px] text-center">Quantity</span>
        <span className="w-11" aria-hidden />
      </div>

      {hydrated ? (
        <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
          {items.map((item) => (
            <ItemRow key={item.productId} item={item} onSetQty={onSetQty} onSetNote={onSetNote} onRemove={onRemove} />
          ))}
        </ul>
      ) : (
        <div className="p-5 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-16 h-16 rounded-xl bg-(--bg-raised)" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-24 bg-(--bg-raised) rounded" />
                <div className="h-4 w-3/4 bg-(--bg-raised) rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {footer}
    </Card>
  );
}
