"use client";

import type { MeiliSettings } from "@apt/types";
import { Info } from "lucide-react";

interface FacetingEditorProps {
  faceting:   MeiliSettings["faceting"];
  pagination: MeiliSettings["pagination"];
  onChangeFaceting:   (v: MeiliSettings["faceting"])   => void;
  onChangePagination: (v: MeiliSettings["pagination"]) => void;
}

function NumberField({
  label, hint, value, onChange, min, max,
}: {
  label: string; hint: string; value: number;
  onChange: (v: number) => void; min: number; max: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
        {label}
      </label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
        className="h-9 w-40 px-3 rounded-md text-[13px] border focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
        style={{ background: "var(--apt-bg)", borderColor: "var(--apt-border)", color: "var(--apt-text-primary)" }}
      />
      <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{hint}</p>
    </div>
  );
}

export function FacetingEditor({
  faceting, pagination, onChangeFaceting, onChangePagination,
}: FacetingEditorProps) {
  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div
        className="flex items-start gap-2 p-3 rounded-lg"
        style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
      >
        <Info size={13} className="mt-0.5 shrink-0" style={{ color: "#3b82f6" }} />
        <p className="text-[12px]" style={{ color: "#1d4ed8" }}>
          These settings affect how facets are calculated and how many search results can be
          retrieved in total. Increasing these numbers improves coverage but may impact performance.
        </p>
      </div>

      <div className="card p-5 flex flex-col gap-5">
        <h3 className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
          Faceting
        </h3>
        <NumberField
          label="Max Values Per Facet"
          hint="Maximum number of values returned per facet in a search request"
          value={faceting.maxValuesPerFacet}
          onChange={(v) => onChangeFaceting({ maxValuesPerFacet: v })}
          min={1}
          max={10000}
        />
      </div>

      <div className="card p-5 flex flex-col gap-5">
        <h3 className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
          Pagination
        </h3>
        <NumberField
          label="Max Total Hits"
          hint="Upper bound on total hits retrievable across all pages. Does not affect relevance."
          value={pagination.maxTotalHits}
          onChange={(v) => onChangePagination({ maxTotalHits: v })}
          min={100}
          max={1000000}
        />
      </div>
    </div>
  );
}
