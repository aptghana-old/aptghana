"use client";

import { useState } from "react";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/Tabs";
import type { DealFilterOptions, DealKind, DealKpis, DealAnalytics } from "@/lib/dealFilters";
import FilterChips from "./FilterChips";
import FilterDrawer from "./FilterDrawer";
import DealKpiRow from "./DealKpiRow";
import DealAnalyticsPanels from "./DealAnalyticsPanels";
import DealTable, { type DealColumn, type DealTableRow } from "./DealTable";
import DealBulkBar from "./DealBulkBar";

interface Props {
  kind: DealKind;
  options: DealFilterOptions;
  current: Record<string, string | undefined>;
  storageNamespace: string;
  kpis: DealKpis;
  currency: string;
  analytics: DealAnalytics;
  columns: DealColumn[];
  rows: DealTableRow[];
  total: number;
  page: number;
  pageSize: number;
  bulkEndpoint?: string;
  bulkStatusOptions?: { value: string; label: string }[];
}

export default function DealListShell({
  kind, options, current, storageNamespace, kpis, currency, analytics,
  columns, rows, total, page, pageSize, bulkEndpoint, bulkStatusOptions,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  function toggleAll() {
    setSelected((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))));
  }

  const canBulk = Boolean(bulkEndpoint && bulkStatusOptions);

  return (
    <div>
      <FilterChips kind={kind} options={options} current={current} storageNamespace={storageNamespace} onOpenFilters={() => setFiltersOpen(true)} />
      <FilterDrawer kind={kind} options={options} current={current} open={filtersOpen} onClose={() => setFiltersOpen(false)} />

      <div className="p-4 sm:p-6 space-y-4">
        <DealKpiRow kind={kind} kpis={kpis} currency={currency} />

        <Tabs defaultValue="table">
          <TabList className="mb-3">
            <Tab value="table">Table</Tab>
            <Tab value="analytics">Analytics</Tab>
          </TabList>

          <TabPanel value="table">
            <DealTable
              columns={columns}
              rows={rows}
              total={total}
              page={page}
              pageSize={pageSize}
              storageKey={storageNamespace}
              selectable={canBulk}
              selected={selected}
              onToggle={toggle}
              onToggleAll={toggleAll}
              bulkBar={canBulk ? (
                <DealBulkBar
                  selectedIds={[...selected]}
                  statusOptions={bulkStatusOptions!}
                  bulkEndpoint={bulkEndpoint!}
                  onClear={() => setSelected(new Set())}
                />
              ) : undefined}
            />
          </TabPanel>

          <TabPanel value="analytics">
            <DealAnalyticsPanels analytics={analytics} />
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}
