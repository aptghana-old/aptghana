"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight, Loader2, FolderTree, Package, Plus, Pencil, Trash2,
  Search, X, GripVertical,
} from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { LEVEL_LABEL, LEVEL_BADGE_VARIANT, LEVEL_DOT } from "@/lib/categoryLevels";
import CategorySidePanel from "./CategorySidePanel";
import type { ParentContext } from "./CategoryForm";

export interface TreeNode {
  id: string;
  name: string;
  slug: string;
  level: string;
  status: string;
  displayOrder: number;
  productCount: number;
  hasChildren?: boolean;
}

interface SearchResultNode extends TreeNode {
  breadcrumb: { name: string; slug: string }[];
}

const CHILD_LEVEL: Record<string, string | undefined> = { group: "category", category: "subcategory", subcategory: "range", range: undefined };

type DropPosition = "before" | "after" | "inside";
interface DragOverInfo { id: string; position: DropPosition }

interface Props {
  rootNodes: TreeNode[];
  canEdit: boolean;
  canDelete: boolean;
}

export default function CategoryTree({ rootNodes, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [roots, setRoots] = useState<TreeNode[]>(rootNodes);

  // Re-sync when the server component re-fetches root nodes (e.g. after router.refresh()).
  useEffect(() => { setRoots(rootNodes); }, [rootNodes]);
  const [childrenByParent, setChildrenByParent] = useState<Record<string, TreeNode[]>>({});
  const [parentOf, setParentOf] = useState<Record<string, string | undefined>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loadingParent, setLoadingParent] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultNode[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [panel, setPanel] = useState<{ mode: "create" | "edit"; parentContext?: ParentContext; categoryId?: string; initial?: Record<string, unknown> } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<DragOverInfo | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bulkStatus, setBulkStatus] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setSearchResults(null); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/categories/tree?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        setSearchResults(json.nodes ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const loadChildren = useCallback(async (parentId: string) => {
    setLoadingParent((prev) => new Set(prev).add(parentId));
    try {
      const res = await fetch(`/api/categories/tree?parentId=${parentId}`);
      const json = await res.json();
      const nodes: TreeNode[] = json.nodes ?? [];
      setChildrenByParent((prev) => ({ ...prev, [parentId]: nodes }));
      setParentOf((prev) => { const next = { ...prev }; for (const n of nodes) next[n.id] = parentId; return next; });
    } finally {
      setLoadingParent((prev) => { const next = new Set(prev); next.delete(parentId); return next; });
    }
  }, []);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else { next.add(id); if (!childrenByParent[id]) loadChildren(id); }
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function siblingsOf(node: TreeNode): TreeNode[] {
    const parentId = parentOf[node.id];
    return parentId ? (childrenByParent[parentId] ?? []) : roots;
  }

  async function refreshNode(parentId: string | undefined) {
    if (parentId) await loadChildren(parentId);
    else router.refresh();
  }

  async function handleDrop(target: TreeNode, position: DropPosition) {
    if (!dragId || dragId === target.id) { setDragId(null); setDragOver(null); return; }
    setError(null);

    try {
      if (position === "inside") {
        const childLevel = CHILD_LEVEL[target.level];
        if (!childLevel) { setError(`A ${LEVEL_LABEL[target.level]} cannot have children`); return; }
        setBusyId(dragId);
        const res = await fetch(`/api/categories/${dragId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ parentId: target.id }),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error ?? "Move failed"); return; }
        await refreshNode(parentOf[dragId]);
        await refreshNode(target.id);
        setExpanded((prev) => new Set(prev).add(target.id));
      } else {
        const targetParentId = parentOf[target.id];
        const targetSiblings = siblingsOf(target).filter((n) => n.id !== dragId);
        const idx = targetSiblings.findIndex((n) => n.id === target.id);
        const insertAt = position === "before" ? idx : idx + 1;
        const orderedIds = [...targetSiblings.slice(0, insertAt).map((n) => n.id), dragId, ...targetSiblings.slice(insertAt).map((n) => n.id)];

        setBusyId(dragId);
        const draggedParentId = parentOf[dragId];
        if (draggedParentId !== targetParentId) {
          const moveRes = await fetch(`/api/categories/${dragId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ parentId: targetParentId ?? null }),
          });
          const moveJson = await moveRes.json();
          if (!moveRes.ok) { setError(moveJson.error ?? "Move failed"); return; }
        }
        const reorderRes = await fetch("/api/categories/reorder", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderedIds }),
        });
        if (!reorderRes.ok) { setError("Reorder failed"); return; }

        await refreshNode(targetParentId);
        if (draggedParentId !== targetParentId) await refreshNode(draggedParentId);
      }
    } finally {
      setBusyId(null);
      setDragId(null);
      setDragOver(null);
    }
  }

  async function handleDelete(node: TreeNode) {
    if (!confirm(`Delete "${node.name}"? This cannot be undone.`)) return;
    setBusyId(node.id);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${node.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Delete failed"); return; }
      await refreshNode(parentOf[node.id]);
    } finally {
      setBusyId(null);
    }
  }

  async function applyBulkStatus(status: string) {
    if (selected.size === 0) return;
    setBulkStatus(status);
    await fetch("/api/categories/bulk", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: Array.from(selected), action: "set_status", status }),
    });
    setSelected(new Set());
    setBulkStatus("");
    router.refresh();
  }

  async function applyBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} categories? Items with children or products will be skipped.`)) return;
    const res = await fetch("/api/categories/bulk", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: Array.from(selected), action: "delete" }),
    });
    const json = await res.json();
    if (json.skipped?.length) setError(`${json.skipped.length} item(s) could not be deleted (children or products still assigned).`);
    setSelected(new Set());
    router.refresh();
  }

  function pathFor(node: TreeNode): string {
    const chain: string[] = [node.name];
    let cur: string | undefined = parentOf[node.id];
    while (cur) {
      const parentNode = [...roots, ...Object.values(childrenByParent).flat()].find((n) => n.id === cur);
      if (!parentNode) break;
      chain.unshift(parentNode.name);
      cur = parentOf[parentNode.id];
    }
    return chain.join(" → ");
  }

  function Row({ node, depth }: { node: TreeNode; depth: number }) {
    const isExpanded = expanded.has(node.id);
    const children = childrenByParent[node.id];
    const isLoading = loadingParent.has(node.id);
    const childLevel = CHILD_LEVEL[node.level];
    const isDragOverInside = dragOver?.id === node.id && dragOver.position === "inside";
    const isDragOverBefore = dragOver?.id === node.id && dragOver.position === "before";
    const isDragOverAfter = dragOver?.id === node.id && dragOver.position === "after";

    function onDragOver(e: React.DragEvent) {
      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;
      const ratio = y / rect.height;
      const position: DropPosition = ratio < 0.25 ? "before" : ratio > 0.75 ? "after" : "inside";
      setDragOver({ id: node.id, position });
    }

    return (
      <div>
        <div
          draggable={canEdit}
          onDragStart={() => setDragId(node.id)}
          onDragOver={onDragOver}
          onDragLeave={() => setDragOver((prev) => (prev?.id === node.id ? null : prev))}
          onDrop={(e) => { e.preventDefault(); if (dragOver) handleDrop(node, dragOver.position); }}
          className="flex items-center gap-2 px-2 py-2 rounded-md group relative"
          style={{
            paddingLeft: depth * 22 + 8,
            background: isDragOverInside ? "var(--apt-bg-raised)" : "transparent",
            outline: isDragOverInside ? "2px dashed var(--apt-text-brand)" : "none",
            opacity: busyId === node.id ? 0.5 : 1,
          }}
        >
          {isDragOverBefore && <div className="absolute left-2 right-2 top-0 h-0.5" style={{ background: "var(--apt-text-brand)" }} />}
          {isDragOverAfter && <div className="absolute left-2 right-2 bottom-0 h-0.5" style={{ background: "var(--apt-text-brand)" }} />}

          {canEdit && <GripVertical size={13} className="shrink-0 cursor-grab opacity-0 group-hover:opacity-40" style={{ color: "var(--apt-text-muted)" }} />}

          {canEdit && (
            <input type="checkbox" className="rounded shrink-0" checked={selected.has(node.id)} onChange={() => toggleSelect(node.id)} />
          )}

          <button
            onClick={() => toggleExpand(node.id)}
            className="w-5 h-5 flex items-center justify-center shrink-0 rounded hover:bg-[var(--apt-bg-raised)]"
            style={{ visibility: node.hasChildren || children?.length ? "visible" : "hidden" }}
          >
            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <ChevronRight size={13} style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 120ms", color: "var(--apt-text-muted)" }} />}
          </button>

          <FolderTree size={13} className="shrink-0" style={{ color: depth === 0 ? "var(--apt-text-brand)" : "var(--apt-text-muted)" }} />

          <Link href={`/dashboard/categories/${node.id}`} className="text-[13px] font-medium truncate hover:underline" style={{ color: "var(--apt-text-primary)" }}>
            {node.name}
          </Link>

          <Badge variant={LEVEL_BADGE_VARIANT[node.level] ?? "default"}>{LEVEL_LABEL[node.level] ?? node.level}</Badge>
          <Badge variant={statusVariant(node.status)} dot>{node.status}</Badge>

          <span className="flex items-center gap-1 text-[11px] ml-auto shrink-0" style={{ color: "var(--apt-text-muted)" }}>
            <Package size={11} />{node.productCount}
          </span>

          {canEdit && (
            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {childLevel && (
                <button
                  title={`Add ${LEVEL_LABEL[childLevel]}`}
                  onClick={() => setPanel({ mode: "create", parentContext: { id: node.id, name: node.name, level: node.level, path: pathFor(node) } })}
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-muted)" }}
                ><Plus size={12} /></button>
              )}
              <button
                title="Edit"
                onClick={() => setPanel({ mode: "edit", categoryId: node.id })}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-muted)" }}
              ><Pencil size={12} /></button>
              {canDelete && (
                <button
                  title="Delete"
                  onClick={() => handleDelete(node)}
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#fef2f2]" style={{ color: "var(--apt-text-muted)" }}
                ><Trash2 size={12} /></button>
              )}
            </div>
          )}
        </div>

        {isExpanded && children && children.map((child) => <Row key={child.id} node={child} depth={depth + 1} />)}
        {isExpanded && children && children.length === 0 && (
          <p className="text-[12px] py-1.5" style={{ paddingLeft: (depth + 1) * 22 + 32, color: "var(--apt-text-muted)" }}>No {LEVEL_LABEL[childLevel ?? ""] ?? "items"} yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)" }}>
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 flex-wrap" style={{ borderBottom: "1px solid var(--apt-border)" }}>
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--apt-text-muted)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories…"
            className="w-full h-8 pl-8 pr-8 rounded-md text-[13px] border"
            style={{ background: "var(--apt-bg-subtle)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
          />
          {query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--apt-text-muted)" }}><X size={13} /></button>}
        </div>

        <div className="hidden sm:flex items-center gap-3">
          {(["group", "category", "subcategory"] as const).map((lvl) => (
            <span key={lvl} className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--apt-text-secondary)" }}>
              <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: LEVEL_DOT[lvl] }} />
              {LEVEL_LABEL[lvl]}
            </span>
          ))}
        </div>

        {canEdit && (
          <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setPanel({ mode: "create" })} className="ml-auto">
            Add Group
          </Button>
        )}
      </div>

      {selected.size > 0 && canEdit && (
        <div className="flex items-center gap-2.5 px-4 sm:px-6 py-2.5" style={{ background: "var(--apt-bg-raised)", borderBottom: "1px solid var(--apt-border)" }}>
          <span className="text-[12.5px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{selected.size} selected</span>
          <Select
            placeholder="Set status…"
            options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
            value={bulkStatus}
            onChange={(e) => applyBulkStatus(e.target.value)}
            className="!h-8 w-36"
          />
          {canDelete && <Button variant="destructive" size="sm" icon={<Trash2 size={12} />} onClick={applyBulkDelete}>Delete</Button>}
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 text-[12.5px]" style={{ background: "#fef2f2", color: "#b91c1c", borderBottom: "1px solid #fca5a5" }}>
          {error}
          <button onClick={() => setError(null)}><X size={13} /></button>
        </div>
      )}

      <div className="p-2 sm:p-4">
        {query.trim() ? (
          searching ? (
            <p className="text-[12px] px-4 py-6 text-center" style={{ color: "var(--apt-text-muted)" }}>Searching…</p>
          ) : !searchResults || searchResults.length === 0 ? (
            <p className="text-[12px] px-4 py-6 text-center" style={{ color: "var(--apt-text-muted)" }}>No categories match &ldquo;{query}&rdquo;.</p>
          ) : (
            <div className="space-y-1">
              {searchResults.map((r) => (
                <Link key={r.id} href={`/dashboard/categories/${r.id}`} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[var(--apt-bg-raised)]">
                  <FolderTree size={13} style={{ color: "var(--apt-text-muted)" }} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>{r.name}</div>
                    <div className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{r.breadcrumb.map((b) => b.name).join(" / ") || "Top level"}</div>
                  </div>
                  <Badge variant={LEVEL_BADGE_VARIANT[r.level] ?? "default"} className="ml-auto">{LEVEL_LABEL[r.level] ?? r.level}</Badge>
                </Link>
              ))}
            </div>
          )
        ) : roots.length === 0 ? (
          <p className="text-[13px] px-4 py-10 text-center" style={{ color: "var(--apt-text-muted)" }}>No groups yet. Create the first one to start building your catalogue taxonomy.</p>
        ) : (
          roots.map((node) => <Row key={node.id} node={node} depth={0} />)
        )}
      </div>

      {panel && (
        <CategorySidePanel
          mode={panel.mode}
          parentContext={panel.parentContext}
          categoryId={panel.categoryId}
          initial={panel.initial}
          onClose={() => setPanel(null)}
          onSaved={async () => {
            setPanel(null);
            if (panel.parentContext) await refreshNode(panel.parentContext.id);
            else if (panel.categoryId) await refreshNode(parentOf[panel.categoryId]);
            else router.refresh();
          }}
        />
      )}
    </div>
  );
}
