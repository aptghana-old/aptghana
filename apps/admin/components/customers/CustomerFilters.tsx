"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import SavedViews from "./SavedViews";

interface Option { value: string; label: string }

interface Props {
  industries: Option[];
  countries: Option[];
  salesReps: Option[];
}

const TYPE_OPTIONS: Option[] = [
  { value: "personal", label: "Individual" },
  { value: "business", label: "Business" },
];

const STATUS_OPTIONS: Option[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "pending", label: "Pending" },
];

export default function CustomerFilters({ industries, countries, salesReps }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [showFilters, setShowFilters] = useState(
    Boolean(params.get("type") || params.get("status") || params.get("industry") || params.get("country") || params.get("rep") || params.get("from") || params.get("to"))
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback((key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }, [params, pathname, router]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (q !== (params.get("q") ?? "")) update("q", q);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const activeCount = ["type", "status", "industry", "country", "rep", "from", "to"].filter((k) => params.get(k)).length;

  function clearAll() {
    setQ("");
    router.push(pathname);
  }

  return (
    <div style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}>
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--apt-text-muted)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, or company…"
            className="w-full h-8 pl-8 pr-3 rounded-md text-[13px] border focus:outline-none focus:ring-2"
            style={{ background: "var(--apt-bg-subtle)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
          />
        </div>

        <Button
          variant={showFilters ? "secondary" : "ghost"}
          size="sm"
          icon={<SlidersHorizontal size={13} />}
          onClick={() => setShowFilters((v) => !v)}
        >
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>

        {activeCount > 0 || q ? (
          <Button variant="ghost" size="sm" icon={<X size={13} />} onClick={clearAll}>Clear</Button>
        ) : null}

        <div className="ml-auto">
          <SavedViews />
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 px-4 sm:px-6 pb-3.5">
          <Select
            placeholder="Customer type"
            options={TYPE_OPTIONS}
            value={params.get("type") ?? ""}
            onChange={(e) => update("type", e.target.value)}
          />
          <Select
            placeholder="Status"
            options={STATUS_OPTIONS}
            value={params.get("status") ?? ""}
            onChange={(e) => update("status", e.target.value)}
          />
          <Select
            placeholder="Industry"
            options={industries}
            value={params.get("industry") ?? ""}
            onChange={(e) => update("industry", e.target.value)}
          />
          <Select
            placeholder="Country"
            options={countries}
            value={params.get("country") ?? ""}
            onChange={(e) => update("country", e.target.value)}
          />
          <Select
            placeholder="Sales rep"
            options={salesReps}
            value={params.get("rep") ?? ""}
            onChange={(e) => update("rep", e.target.value)}
          />
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={params.get("from") ?? ""}
              onChange={(e) => update("from", e.target.value)}
              className="w-full h-9 px-2 rounded-md text-[12px] border"
              style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
              aria-label="Registered from"
            />
            <input
              type="date"
              value={params.get("to") ?? ""}
              onChange={(e) => update("to", e.target.value)}
              className="w-full h-9 px-2 rounded-md text-[12px] border"
              style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
              aria-label="Registered to"
            />
          </div>
        </div>
      )}
    </div>
  );
}
