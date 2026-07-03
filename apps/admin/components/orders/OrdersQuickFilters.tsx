"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

/** Lifecycle order for the pills; anything unexpected sorts after these. */
const STATUS_FLOW = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

interface Props {
  statusCounts: { status: string; count: number }[];
  searchPlaceholder?: string;
}

export default function OrdersQuickFilters({ statusCounts, searchPlaceholder = "Search order, customer…" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activeStatus = params.get("status") ?? "";
  const total = statusCounts.reduce((n, s) => n + s.count, 0);

  const pills = [...statusCounts].sort((a, b) => {
    const ai = STATUS_FLOW.indexOf(a.status), bi = STATUS_FLOW.indexOf(b.status);
    return (ai === -1 ? STATUS_FLOW.length : ai) - (bi === -1 ? STATUS_FLOW.length : bi);
  });

  function push(mutate: (qs: URLSearchParams) => void) {
    const qs = new URLSearchParams(params.toString());
    mutate(qs);
    qs.delete("page");
    router.push(`${pathname}${qs.size ? `?${qs.toString()}` : ""}`);
  }

  function selectStatus(status: string) {
    push((qs) => { if (status) qs.set("status", status); else qs.delete("status"); });
  }

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    push((qs) => {
      const value = typeof q === "string" ? q.trim() : "";
      if (value) qs.set("customer", value); else qs.delete("customer");
    });
  }

  const pillBase = "text-[12px] font-semibold px-3.5 py-[7px] rounded-full transition-colors cursor-pointer whitespace-nowrap";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => selectStatus("")}
        className={pillBase}
        aria-pressed={!activeStatus}
        style={!activeStatus
          ? { background: "var(--apt-text-primary)", color: "var(--apt-bg)" }
          : { background: "var(--apt-bg)", border: "1px solid var(--apt-border)", color: "var(--apt-text-secondary)" }}
      >
        All · {total.toLocaleString()}
      </button>
      {pills.map((s) => {
        const active = activeStatus === s.status;
        return (
          <button
            key={s.status}
            onClick={() => selectStatus(active ? "" : s.status)}
            className={`${pillBase} capitalize`}
            aria-pressed={active}
            style={active
              ? { background: "var(--apt-text-primary)", color: "var(--apt-bg)" }
              : { background: "var(--apt-bg)", border: "1px solid var(--apt-border)", color: "var(--apt-text-secondary)" }}
          >
            {s.status.replace(/_/g, " ")} · {s.count.toLocaleString()}
          </button>
        );
      })}

      <div className="flex-1" />

      <form onSubmit={submitSearch} className="w-full sm:w-auto">
        <div
          className="flex items-center gap-2 h-[34px] px-3 rounded-lg w-full sm:w-[230px] focus-within:ring-2 focus-within:ring-[var(--apt-border-focus)]"
          style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)" }}
        >
          <Search size={14} className="shrink-0" style={{ color: "var(--apt-text-muted)" }} />
          <input
            name="q"
            defaultValue={params.get("customer") ?? ""}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-[var(--apt-text-muted)]"
            style={{ color: "var(--apt-text-primary)" }}
            aria-label="Search orders"
          />
        </div>
      </form>
    </div>
  );
}
