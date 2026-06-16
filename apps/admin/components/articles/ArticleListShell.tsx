"use client";

import { useState } from "react";
import type { ArticleFilterOptions } from "@/lib/articleFilters";
import ArticleFilterChips from "./ArticleFilterChips";
import ArticleFilterDrawer from "./ArticleFilterDrawer";
import DealTable, { type DealColumn, type DealTableRow } from "@/components/deals/DealTable";
import DealBulkBar from "@/components/deals/DealBulkBar";

interface Props {
  options: ArticleFilterOptions;
  current: Record<string, string | undefined>;
  columns: DealColumn[];
  rows: DealTableRow[];
  total: number;
  page: number;
  pageSize: number;
  canEdit: boolean;
}

export default function ArticleListShell({ options, current, columns, rows, total, page, pageSize, canEdit }: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  function toggleAll() {
    setSelected((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))));
  }

  return (
    <div>
      <ArticleFilterChips options={options} current={current} onOpenFilters={() => setFiltersOpen(true)} />
      <ArticleFilterDrawer options={options} current={current} open={filtersOpen} onClose={() => setFiltersOpen(false)} />

      <div className="p-4 sm:p-6">
        <DealTable
          columns={columns}
          rows={rows}
          total={total}
          page={page}
          pageSize={pageSize}
          storageKey="articles"
          selectable={canEdit}
          selected={selected}
          onToggle={toggle}
          onToggleAll={toggleAll}
          bulkBar={canEdit ? (
            <DealBulkBar
              selectedIds={[...selected]}
              statusOptions={[
                { value: "draft", label: "Draft" }, { value: "review", label: "Review" },
                { value: "published", label: "Published" }, { value: "archived", label: "Archived" },
              ]}
              bulkEndpoint="/api/articles/bulk"
              onClear={() => setSelected(new Set())}
            />
          ) : undefined}
          emptyMessage="No articles match your filters."
        />
      </div>
    </div>
  );
}
