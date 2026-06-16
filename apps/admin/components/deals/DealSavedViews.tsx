"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Bookmark, Plus, X, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SavedView { name: string; query: string }

function load(key: string): SavedView[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
}
function persist(key: string, views: SavedView[]) {
  localStorage.setItem(key, JSON.stringify(views));
}

interface Props {
  /** Unique per module, e.g. "quotes" or "orders" — namespaces localStorage keys. */
  storageNamespace: string;
}

/** Saved + automatically-tracked recent filter combinations, shared shape for Quotes and Orders. */
export default function DealSavedViews({ storageNamespace }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const savedKey = `apt:${storageNamespace}:savedViews`;
  const recentKey = `apt:${storageNamespace}:recentFilters`;

  const [open, setOpen] = useState(false);
  const [views, setViews] = useState<SavedView[]>(() => (typeof window === "undefined" ? [] : load(savedKey)));
  const [recent, setRecent] = useState<SavedView[]>(() => (typeof window === "undefined" ? [] : load(recentKey)));
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  // Track the current query as a "recent" entry whenever real filters are active.
  useEffect(() => {
    const query = params.toString();
    if (!query) return;
    const next = [{ name: query, query }, ...load(recentKey).filter((r) => r.query !== query)].slice(0, 5);
    persist(recentKey, next);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing localStorage-derived "recent" list to the URL changing, not render-derivable
    setRecent(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!rootRef.current?.contains(e.target as Node)) { setOpen(false); setNaming(false); } };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next = [...views.filter((v) => v.name !== trimmed), { name: trimmed, query: params.toString() }];
    persist(savedKey, next);
    setViews(next);
    setName("");
    setNaming(false);
  }

  function remove(viewName: string) {
    const next = views.filter((v) => v.name !== viewName);
    persist(savedKey, next);
    setViews(next);
  }

  function describeQuery(query: string): string {
    const qs = new URLSearchParams(query);
    const parts: string[] = [];
    if (qs.get("status")) parts.push(qs.get("status")!.replace(/_/g, " "));
    if (qs.get("preset")) parts.push(qs.get("preset")!.replace(/_/g, " "));
    if (qs.get("salesRep")) parts.push("by rep");
    if (qs.get("brand")) parts.push(qs.get("brand")!);
    return parts.length ? parts.join(" · ") : `${qs.size} filter${qs.size !== 1 ? "s" : ""}`;
  }

  return (
    <div ref={rootRef} className="relative">
      <Button variant="ghost" size="sm" icon={<Bookmark size={13} />} onClick={() => setOpen((v) => !v)}>Saved Views</Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-40 w-72 rounded-lg p-2 space-y-2" style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border-strong)", boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}>
          <div>
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>Saved</p>
            {views.length === 0 ? (
              <p className="px-2 py-1.5 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>No saved views yet.</p>
            ) : views.map((v) => (
              <div key={v.name} className="flex items-center gap-1 group">
                <button onClick={() => { router.push(`${pathname}?${v.query}`); setOpen(false); }} className="flex-1 text-left px-2 py-1.5 rounded-md text-[12.5px] truncate transition-colors hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-secondary)" }}>
                  {v.name}
                </button>
                <button onClick={() => remove(v.name)} aria-label={`Delete ${v.name}`} className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-muted)" }}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>

          {recent.length > 0 && (
            <div style={{ borderTop: "1px solid var(--apt-border)", paddingTop: 8 }}>
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--apt-text-muted)" }}><History size={10} /> Recently Used</p>
              {recent.map((r) => (
                <button key={r.query} onClick={() => { router.push(`${pathname}?${r.query}`); setOpen(false); }} className="w-full text-left px-2 py-1.5 rounded-md text-[12px] truncate transition-colors hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-secondary)" }}>
                  {describeQuery(r.query)}
                </button>
              ))}
            </div>
          )}

          <div style={{ borderTop: "1px solid var(--apt-border)", paddingTop: 8 }}>
            {naming ? (
              <div className="flex items-center gap-1">
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setNaming(false); }} placeholder="View name…" className="flex-1 h-8 px-2 rounded-md text-[12.5px] border" style={{ background: "var(--apt-bg-subtle)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }} />
                <button onClick={save} className="w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-brand)" }}><Plus size={14} /></button>
                <button onClick={() => setNaming(false)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-muted)" }}><X size={13} /></button>
              </div>
            ) : (
              <button onClick={() => setNaming(true)} className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[12.5px] transition-colors hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-brand)" }}>
                <Plus size={13} /> Save current view
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
