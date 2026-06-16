"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Clock, FolderTree } from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import CategoryMoveModal from "./CategoryMoveModal";

export interface ProductRow {
  id: string;
  name: string;
  sku: string;
  mpn?: string;
  brandName?: string;
  brandSlug?: string;
  primaryCategoryId?: string;
  categoryName?: string;
  status: string;
  listPrice?: number;
  currency?: string;
  stockQty: number;
  imageUrl?: string;
  imageAlt?: string;
  updatedAt: string;
}

interface Props {
  rows: ProductRow[];
  canEdit: boolean;
}

export default function ProductTable({ rows, canEdit }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [moveOpen, setMoveOpen] = useState(false);

  const allSelected = rows.length > 0 && selected.size === rows.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="card overflow-hidden">
      {selected.size > 0 && canEdit && (
        <div
          className="flex items-center gap-2.5 px-4 py-2.5"
          style={{ background: "var(--apt-bg-raised)", borderBottom: "1px solid var(--apt-border)" }}
        >
          <span className="text-[12.5px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
            {selected.size} selected
          </span>
          <Button variant="secondary" size="sm" icon={<FolderTree size={12} />} onClick={() => setMoveOpen(true)}>
            Move to…
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {canEdit && (
                <th className="w-px hidden sm:table-cell">
                  <input type="checkbox" className="rounded" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
                </th>
              )}
              <th>Product</th>
              <th className="hidden sm:table-cell">SKU</th>
              <th className="hidden md:table-cell">Brand</th>
              <th className="hidden lg:table-cell">Category</th>
              <th>Status</th>
              <th className="text-right hidden sm:table-cell">Price</th>
              <th className="text-right">Stock</th>
              <th className="hidden lg:table-cell">Updated</th>
              <th className="w-px" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const stockBadge = p.stockQty === 0 ? "error" : p.stockQty < 5 ? "warning" : "success";
              return (
                <tr key={p.id}>
                  {canEdit && (
                    <td className="hidden sm:table-cell">
                      <input type="checkbox" className="rounded" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} aria-label={`Select ${p.name}`} />
                    </td>
                  )}
                  <td>
                    <Link href={`/dashboard/products/${p.id}`} className="flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-md shrink-0 overflow-hidden flex items-center justify-center" style={{ background: "var(--apt-bg-raised)" }}>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.imageAlt ?? p.name} className="w-full h-full object-contain p-0.5" />
                        ) : (
                          <Package size={15} style={{ color: "var(--apt-text-muted)" }} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium truncate group-hover:text-[#0057b8] transition-colors max-w-[160px] sm:max-w-[220px]" style={{ color: "var(--apt-text-primary)" }}>
                          {p.name}
                        </div>
                        {p.mpn && <div className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>MPN: {p.mpn}</div>}
                      </div>
                    </Link>
                  </td>
                  <td className="hidden sm:table-cell">
                    <span className="font-mono text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{p.sku}</span>
                  </td>
                  <td className="hidden md:table-cell">
                    {p.brandName ? (
                      <Link href={`/dashboard/brands?slug=${p.brandSlug}`} className="text-[13px] hover:underline" style={{ color: "var(--apt-text-secondary)" }}>
                        {p.brandName}
                      </Link>
                    ) : <span className="text-[13px]" style={{ color: "var(--apt-text-muted)" }}>—</span>}
                  </td>
                  <td className="hidden lg:table-cell">
                    {p.categoryName ? (
                      <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{p.categoryName}</span>
                    ) : (
                      <span className="text-[12px]" style={{ color: "var(--apt-text-disabled)" }}>Uncategorised</span>
                    )}
                  </td>
                  <td><Badge variant={statusVariant(p.status)} dot>{p.status}</Badge></td>
                  <td className="text-right hidden sm:table-cell">
                    {p.listPrice ? (
                      <span className="text-[13px] font-medium tabular-nums" style={{ color: "var(--apt-text-primary)" }}>
                        {p.currency ?? "GHS"} {p.listPrice.toLocaleString()}
                      </span>
                    ) : <span className="text-[12px]" style={{ color: "var(--apt-text-disabled)" }}>—</span>}
                  </td>
                  <td className="text-right">
                    <Badge variant={stockBadge}>{p.stockQty === 0 ? "Out" : p.stockQty.toLocaleString()}</Badge>
                  </td>
                  <td className="hidden lg:table-cell">
                    <span className="flex items-center gap-1 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                      <Clock size={11} />{new Date(p.updatedAt).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
                    </span>
                  </td>
                  <td>
                    <Link href={`/dashboard/products/${p.id}/edit`} className="text-[12px] px-2 py-1 rounded hover:bg-[var(--apt-bg-raised)] transition-colors" style={{ color: "var(--apt-text-muted)" }}>
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {moveOpen && (
        <CategoryMoveModal
          productIds={Array.from(selected)}
          onClose={() => setMoveOpen(false)}
          onMoved={() => { setSelected(new Set()); router.refresh(); }}
        />
      )}
    </div>
  );
}
