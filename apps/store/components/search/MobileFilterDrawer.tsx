"use client";

import { useState } from "react";
import FilterSidebar from "./FilterSidebar";

interface Props {
  facets?: Record<string, Record<string, number>>;
  total?: number;
  basePath?: string;
}

export default function MobileFilterDrawer({ facets, total, basePath = "/search" }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium border lg:hidden"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          color: "var(--text-2)",
        }}
        aria-label="Open filters"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75 4.5 4.5m0 0-4.5 4.5m4.5-4.5H11.25" />
        </svg>
        Filters
        {total !== undefined && (
          <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "var(--bg-raised)", color: "var(--text-4)" }}>
            {total.toLocaleString()}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="absolute left-0 top-0 bottom-0 w-[min(100vw,320px)] overflow-y-auto flex flex-col"
            style={{ background: "var(--bg-base)" }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="font-bold text-sm" style={{ color: "var(--text-1)" }}>Filters</span>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--text-3)" }}
                aria-label="Close filters"
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 flex-1">
              <FilterSidebar facets={facets} basePath={basePath} />
            </div>
            <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setOpen(false)}
                className="w-full py-3 rounded-xl font-bold text-sm text-white"
                style={{ background: "#3DCD58" }}
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
