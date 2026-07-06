"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal, Eye, Pencil, Ban, CheckCircle2, Download, Loader2,
} from "lucide-react";

export interface ProductSummary {
  id: string;
  name: string;
  sku: string;
  status: string;
  stockQty: number;
  updatedAt: string;
}

interface Props {
  product: ProductSummary;
  canEdit: boolean;
  canExport: boolean;
  /** "menu" = compact "..." dropdown (table rows); "buttons" = inline row of buttons (detail header) */
  variant?: "menu" | "buttons";
  onChanged?: () => void;
}

export default function ProductQuickActions({ product, canEdit, canExport, variant = "menu", onChanged }: Props) {
  const router = useRouter();
  const [ open, setOpen ] = useState(false);
  const [ busy, setBusy ] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [ open ]);

  async function setStatus(status: string) {
    setBusy(status);
    try {
      await fetch(`/api/products/${product.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
      onChanged?.();
    } finally {
      setBusy(null);
      setOpen(false);
    }
  }

  const items: { key: string; label: string; icon: React.ReactNode; show: boolean; onClick?: () => void; href?: string; danger?: boolean }[] = [
    { key: "view", label: "View", icon: <Eye size={13} />, show: true, href: `/dashboard/products/${product.id}` },
    { key: "edit", label: "Edit", icon: <Pencil size={13} />, show: canEdit, href: `/dashboard/products/${product.id}/edit` },
    {
      key: "delete", label: "Delete", icon: <Ban size={13} />, show: canEdit && product.status !== "deleted",
      onClick: () => setStatus("deleted"), danger: true,
    },
    {
      key: "activate", label: "Activate", icon: <CheckCircle2 size={13} />, show: canEdit && product.status !== "active",
      onClick: () => setStatus("active"),
    },
    {
      key: "export", label: "Export Product", icon: <Download size={13} />, show: canExport,
      href: ``,
    },
  ].filter((i) => i.show);

  return (
    <div ref={rootRef} className="relative inline-flex items-center gap-1">
      {variant === "buttons" ? (
        <div className="flex items-center gap-1.5 flex-wrap">
          {items.map((item) =>
            item.href ? (
              <a
                key={item.key}
                href={item.href}
                target={item.key === "export" ? "_blank" : undefined}
                rel={item.key === "export" ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-medium transition-colors hover:bg-(--apt-bg-raised)"
                style={{ border: "1px solid var(--apt-border)", color: item.danger ? "#dc2626" : "var(--apt-text-secondary)" }}
              >
                {item.icon}{item.label}
              </a>
            ) : (
              <button
                key={item.key}
                onClick={item.onClick}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-medium transition-colors hover:bg-(--apt-bg-raised) disabled:opacity-50"
                style={{ border: "1px solid var(--apt-border)", color: item.danger ? "#dc2626" : "var(--apt-text-secondary)" }}
              >
                {busy === item.key ? <Loader2 size={13} className="animate-spin" /> : item.icon}{item.label}
              </button>
            )
          )}
        </div>
      ) : (
        <>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="More actions"
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-(--apt-bg-raised)"
            style={{ color: "var(--apt-text-muted)" }}
          >
            <MoreHorizontal size={15} />
          </button>
          {open && (
            <div
              className="absolute right-0 top-full mt-1 z-40 w-48 rounded-lg py-1 overflow-hidden"
              style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border-strong)", boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}
              role="menu"
            >
              {items.map((item) =>
                item.href ? (
                  <Link
                    key={item.key}
                    href={item.href}
                    target={item.key === "export" ? "_blank" : undefined}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[12.5px] transition-colors hover:bg-(--apt-bg-raised)"
                    style={{ color: item.danger ? "#dc2626" : "var(--apt-text-secondary)" }}
                  >
                    {item.icon}{item.label}
                  </Link>
                ) : (
                  <button
                    key={item.key}
                    onClick={item.onClick}
                    disabled={busy !== null}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-left transition-colors hover:bg-(--apt-bg-raised) disabled:opacity-50"
                    style={{ color: item.danger ? "#dc2626" : "var(--apt-text-secondary)" }}
                  >
                    {busy === item.key ? <Loader2 size={13} className="animate-spin" /> : item.icon}{item.label}
                  </button>
                )
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
