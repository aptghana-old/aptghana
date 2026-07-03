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
  align?: "left" | "center" | "right";
  defaultVisible?: boolean;
}

const ALIGN_CLASS: Record<string, string | undefined> = { center: "text-center", right: "text-right" };

/** Windowed page list: 1 … around current … last (all pages when few). */
function pageItems(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const wanted = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (const p of wanted) {
    const prev = out[out.length - 1];
    if (typeof prev === "number" && p - prev > 1) out.push("…");
    out.push(p);
  }
  return out;
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
                  <th key={c.key} className={ALIGN_CLASS[c.align ?? "left"]}>
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
                    <td key={c.key} className={ALIGN_CLASS[c.align ?? "left"]}>{row.cells[c.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap" style={{ borderTop: "1px solid var(--apt-border)", background: "var(--apt-bg-subtle)" }}>
          <span className="font-mono text-[11.5px]" style={{ color: "var(--apt-text-muted)" }}>
            Showing {((page - 1) * pageSize + 1).toLocaleString()}–{Math.min(page * pageSize, total).toLocaleString()} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-1.5">
            {navigating && <Loader2 size={13} className="animate-spin mr-1" style={{ color: "var(--apt-text-muted)" }} />}
            <PageArrow dir="prev" disabled={page <= 1} href={pageHref(page - 1)} onNavigate={() => setNavigating(true)} />
            {pageItems(page, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`gap-${i}`} className="px-1 font-mono text-[12px]" style={{ color: "var(--apt-text-muted)" }}>…</span>
              ) : (
                <PageNumber key={p} page={p} current={p === page} href={pageHref(p)} onNavigate={() => setNavigating(true)} />
              )
            )}
            <PageArrow dir="next" disabled={page >= totalPages} href={pageHref(page + 1)} onNavigate={() => setNavigating(true)} />
          </div>
        </div>
      )}
    </div>
  );
}

function PageArrow({ dir, disabled, href, onNavigate }: { dir: "prev" | "next"; disabled: boolean; href: string; onNavigate(): void }) {
  const icon = dir === "prev" ? <ChevronLeft size={14} /> : <ChevronRight size={14} />;
  const cls = "w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-colors";
  if (disabled) {
    return (
      <span className={cls} style={{ border: "1px solid var(--apt-border)", color: "var(--apt-text-disabled)", background: "var(--apt-bg)" }} aria-hidden>
        {icon}
      </span>
    );
  }
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`${cls} hover:bg-[var(--apt-bg-raised)]`}
      style={{ border: "1px solid var(--apt-border)", color: "var(--apt-text-secondary)", background: "var(--apt-bg)" }}
      aria-label={dir === "prev" ? "Previous page" : "Next page"}
    >
      {icon}
    </Link>
  );
}

function PageNumber({ page, current, href, onNavigate }: { page: number; current: boolean; href: string; onNavigate(): void }) {
  const cls = "min-w-[30px] h-[30px] px-2 rounded-lg flex items-center justify-center font-mono text-[12px] transition-colors";
  if (current) {
    return (
      <span className={`${cls} font-semibold`} style={{ background: "var(--apt-text-primary)", color: "var(--apt-bg)" }} aria-current="page">
        {page}
      </span>
    );
  }
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`${cls} hover:bg-[var(--apt-bg-raised)]`}
      style={{ border: "1px solid var(--apt-border)", color: "var(--apt-text-secondary)", background: "var(--apt-bg)" }}
    >
      {page}
    </Link>
  );
}
