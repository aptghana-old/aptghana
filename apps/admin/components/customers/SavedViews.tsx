"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Bookmark, Plus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SavedView { name: string; query: string }

const STORAGE_KEY = "apt:customers:savedViews";

function loadViews(): SavedView[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistViews(views: SavedView[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
}

/** Lightweight per-device saved filter sets (search + filters), stored in localStorage. */
export default function SavedViews() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [views, setViews] = useState<SavedView[]>(() => (typeof window === "undefined" ? [] : loadViews()));
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) { setOpen(false); setNaming(false); }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next = [...views.filter((v) => v.name !== trimmed), { name: trimmed, query: params.toString() }];
    persistViews(next);
    setViews(next);
    setName("");
    setNaming(false);
  }

  function remove(viewName: string) {
    const next = views.filter((v) => v.name !== viewName);
    persistViews(next);
    setViews(next);
  }

  return (
    <div ref={rootRef} className="relative">
      <Button variant="ghost" size="sm" icon={<Bookmark size={13} />} onClick={() => setOpen((v) => !v)}>
        Saved Views
      </Button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-40 w-64 rounded-lg p-2 space-y-1"
          style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border-strong)", boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}
        >
          {views.length === 0 && !naming && (
            <p className="px-2 py-2 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>No saved views yet.</p>
          )}
          {views.map((v) => (
            <div key={v.name} className="flex items-center gap-1 group">
              <button
                onClick={() => { router.push(`${pathname}?${v.query}`); setOpen(false); }}
                className="flex-1 text-left px-2 py-1.5 rounded-md text-[12.5px] truncate transition-colors hover:bg-[var(--apt-bg-raised)]"
                style={{ color: "var(--apt-text-secondary)" }}
              >
                {v.name}
              </button>
              <button onClick={() => remove(v.name)} aria-label={`Delete ${v.name}`} className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-muted)" }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {naming ? (
            <div className="flex items-center gap-1 pt-1">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setNaming(false); }}
                placeholder="View name…"
                className="flex-1 h-8 px-2 rounded-md text-[12.5px] border"
                style={{ background: "var(--apt-bg-subtle)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
              />
              <button onClick={save} className="w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-brand)" }}>
                <Plus size={14} />
              </button>
              <button onClick={() => setNaming(false)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-muted)" }}>
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setNaming(true)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[12.5px] transition-colors hover:bg-[var(--apt-bg-raised)]"
              style={{ color: "var(--apt-text-brand)" }}
            >
              <Plus size={13} /> Save current view
            </button>
          )}
        </div>
      )}
    </div>
  );
}
