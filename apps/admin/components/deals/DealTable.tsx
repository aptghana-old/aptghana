"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowUp, ArrowDown, Columns3, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export interface DealColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "right";
  defaultVisible?: boolean;
}

/**
 * A row's cells are pre-rendered server-side (plain ReactNode, not a render
 * callback) — Server Components can pass JSX into Client Components, but
 * never a function, so the row→cell mapping must happen before this prop
 * crosses the client boundary.
 */
export interface DealTableRow {
  id: string;
  cells: Record<string, ReactNode>;
}

interface Props {
  columns: DealColumn[];
  rows: DealTableRow[];
  total: number;
  page: number;
  pageSize: number;
  storageKey: string;
  selectable?: boolean;
  selected?: Set<string>;
  onToggle?(id: string): void;
  onToggleAll?(): void;
  bulkBar?: ReactNode;
  emptyMessage?: string;
}

function loadVisible(storageKey: string, columns: DealColumn[]): Set<string> {
  try {
    const raw = localStorage.getItem(`apt:cols:${storageKey}`);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set(columns.filter((c) => c.defaultVisible !== false).map((c) => c.key));
}

export default function DealTable({
  columns, rows, total, page, pageSize, storageKey,
  selectable, selected, onToggle, onToggleAll, bulkBar, emptyMessage,
}: Props) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [visible, setVisible] = useState<Set<string>>(() => loadVisible(storageKey, columns));
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => { localStorage.setItem(`apt:cols:${storageKey}`, JSON.stringify([...visible])); }, [visible, storageKey]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- clears the nav spinner once fresh server-rendered rows arrive
  useEffect(() => { setNavigating(false); }, [rows]);

  function toggleColumn(key: string) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  const sort = params.get("sort");
  const dir = params.get("dir") === "asc" ? "asc" : "desc";

  function sortHref(key: string) {
    const qs = new URLSearchParams(params.toString());
    qs.set("sort", key);
    qs.set("dir", sort === key && dir === "desc" ? "asc" : "desc");
    return `${pathname}?${qs.toString()}`;
  }

  function pageHref(p: number) {
    const qs = new URLSearchParams(params.toString());
    qs.set("page", String(p));
    return `${pathname}?${qs.toString()}`;
  }

  const visibleColumns = columns.filter((c) => visible.has(c.key));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg-subtle)" }}>
        {bulkBar ?? <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{total.toLocaleString()} result{total !== 1 ? "s" : ""}</span>}
        <div className="relative shrink-0">
          <Button variant="ghost" size="sm" icon={<Columns3 size={13} />} onClick={() => setColMenuOpen((v) => !v)}>Columns</Button>
          {colMenuOpen && (
            <div className="absolute right-0 top-full mt-1 z-30 w-52 rounded-lg p-2 space-y-0.5" style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border-strong)", boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}>
              {columns.map((c) => (
                <label key={c.key} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[12.5px] cursor-pointer hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-secondary)" }}>
                  <input type="checkbox" className="rounded" checked={visible.has(c.key)} onChange={() => toggleColumn(c.key)} />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title={emptyMessage ?? "No results match your filters."} />
      ) : (
        <div className="overflow-x-auto" style={{ opacity: navigating ? 0.5 : 1 }}>
          <table className="data-table">
            <thead>
              <tr>
                {selectable && (
                  <th className="w-px"><input type="checkbox" className="rounded" checked={Boolean(selected?.size) && selected?.size === rows.length} onChange={onToggleAll} /></th>
                )}
                {visibleColumns.map((c) => (
                  <th key={c.key} className={c.align === "right" ? "text-right" : undefined}>
                    {c.sortable ? (
                      <Link href={sortHref(c.key)} onClick={() => setNavigating(true)} className="inline-flex items-center gap-1 hover:underline">
                        {c.label}
                        {sort === c.key && (dir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                      </Link>
                    ) : c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {selectable && (
                    <td><input type="checkbox" className="rounded" checked={selected?.has(row.id) ?? false} onChange={() => onToggle?.(row.id)} /></td>
                  )}
                  {visibleColumns.map((c) => (
                    <td key={c.key} className={c.align === "right" ? "text-right" : undefined}>{row.cells[c.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid var(--apt-border)" }}>
          <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            {navigating && <Loader2 size={13} className="animate-spin" style={{ color: "var(--apt-text-muted)" }} />}
            {page > 1 ? (
              <Link href={pageHref(page - 1)} onClick={() => setNavigating(true)}>
                <Button variant="outline" size="xs" icon={<ChevronLeft size={12} />}>Prev</Button>
              </Link>
            ) : (
              <Button variant="outline" size="xs" icon={<ChevronLeft size={12} />} disabled>Prev</Button>
            )}
            <span className="text-[12px] px-1" style={{ color: "var(--apt-text-muted)" }}>Page {page} of {totalPages}</span>
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} onClick={() => setNavigating(true)}>
                <Button variant="outline" size="xs" iconRight={<ChevronRight size={12} />}>Next</Button>
              </Link>
            ) : (
              <Button variant="outline" size="xs" iconRight={<ChevronRight size={12} />} disabled>Next</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
