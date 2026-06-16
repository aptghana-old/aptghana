"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, MapPin, Circle, Download, Tag as TagIcon, Loader2 } from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import CustomerQuickActions from "./CustomerQuickActions";

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  accountType: string;
  status: string;
  industry?: string;
  country?: string;
  tags: string[];
  assignedSalesRepName?: string;
  createdAt: string;
  lastLoginAt?: string;
  totalOrders: number;
  totalQuotes: number;
  totalRfqs: number;
  ltv: number;
  lastOrderDate?: string;
}

interface Props {
  rows: CustomerRow[];
  canEdit: boolean;
  canExport: boolean;
  salesReps: { value: string; label: string }[];
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "pending", label: "Pending" },
];

function isRecentlyActive(lastLoginAt?: string) {
  if (!lastLoginAt) return false;
  return Date.now() - new Date(lastLoginAt).getTime() < 30 * 24 * 60 * 60 * 1000;
}

function downloadCsv(rows: CustomerRow[]) {
  const cols: (keyof CustomerRow)[] = ["name", "email", "phone", "company", "accountType", "status", "industry", "country", "ltv", "totalOrders", "totalQuotes", "totalRfqs", "assignedSalesRepName", "createdAt"];
  const lines = [
    cols.join(","),
    ...rows.map((r) => cols.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(",")),
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `apt-customers-selection-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CustomerTable({ rows, canEdit, canExport, salesReps }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkRep, setBulkRep] = useState("");
  const [bulkTag, setBulkTag] = useState("");
  const [busy, setBusy] = useState(false);

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const selectedRows = useMemo(() => rows.filter((r) => selected.has(r.id)), [rows, selected]);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function applyBulk(action: string, payload: Record<string, unknown>) {
    setBusy(true);
    try {
      await fetch("/api/customers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action, ...payload }),
      });
      setSelected(new Set());
      setBulkStatus(""); setBulkRep(""); setBulkTag("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      {selected.size > 0 && canEdit && (
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 flex-wrap"
          style={{ background: "var(--apt-bg-raised)", borderBottom: "1px solid var(--apt-border)" }}
        >
          <span className="text-[12.5px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
            {selected.size} selected
          </span>

          <Select
            placeholder="Set status…"
            options={STATUS_OPTIONS}
            value={bulkStatus}
            onChange={(e) => { setBulkStatus(e.target.value); applyBulk("set_status", { status: e.target.value }); }}
            className="!h-8 w-36"
          />
          <Select
            placeholder="Assign rep…"
            options={salesReps}
            value={bulkRep}
            onChange={(e) => { setBulkRep(e.target.value); applyBulk("assign_rep", { salesRepId: e.target.value }); }}
            className="!h-8 w-40"
          />
          <div className="flex items-center gap-1.5">
            <input
              value={bulkTag}
              onChange={(e) => setBulkTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && bulkTag.trim()) applyBulk("add_tag", { tag: bulkTag.trim() }); }}
              placeholder="Add tag + Enter"
              className="h-8 px-2.5 rounded-md text-[12px] border w-32"
              style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
            />
            <TagIcon size={12} style={{ color: "var(--apt-text-muted)" }} />
          </div>

          {canExport && (
            <Button variant="secondary" size="sm" icon={<Download size={12} />} onClick={() => downloadCsv(selectedRows)}>
              Export Selected
            </Button>
          )}
          {busy && <Loader2 size={14} className="animate-spin" style={{ color: "var(--apt-text-muted)" }} />}
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {canEdit && (
                <th className="hidden sm:table-cell">
                  <input type="checkbox" className="rounded" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
                </th>
              )}
              <th>Customer</th>
              <th className="hidden md:table-cell">Company / Industry</th>
              <th className="hidden lg:table-cell">Location</th>
              <th>Status</th>
              <th className="hidden lg:table-cell">Rep</th>
              <th className="text-right hidden sm:table-cell">Orders</th>
              <th className="text-right hidden sm:table-cell">Quotes</th>
              <th className="text-right hidden xl:table-cell">RFQs</th>
              <th className="text-right">LTV</th>
              <th className="hidden md:table-cell">Last Order</th>
              <th className="hidden md:table-cell">Joined</th>
              <th className="w-px" />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                {canEdit && (
                  <td className="hidden sm:table-cell">
                    <input type="checkbox" className="rounded" checked={selected.has(c.id)} onChange={() => toggleOne(c.id)} aria-label={`Select ${c.name}`} />
                  </td>
                )}
                <td>
                  <Link href={`/dashboard/customers/${c.id}`} className="flex items-center gap-3 group">
                    <div className="relative shrink-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                        style={{ background: "#1e4278" }}
                      >
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      {isRecentlyActive(c.lastLoginAt) && (
                        <Circle
                          size={8}
                          className="absolute -bottom-0.5 -right-0.5"
                          fill="#16a34a"
                          style={{ color: "#16a34a", filter: "drop-shadow(0 0 0 2px var(--apt-bg))" }}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium group-hover:underline truncate" style={{ color: "var(--apt-text-primary)" }}>{c.name}</div>
                      <div className="flex items-center gap-1 text-[11px] truncate" style={{ color: "var(--apt-text-muted)" }}>
                        <Mail size={10} />{c.email}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="hidden md:table-cell">
                  <div className="text-[13px]" style={{ color: "var(--apt-text-secondary)" }}>{c.company ?? "—"}</div>
                  {c.industry && <div className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{c.industry}</div>}
                </td>
                <td className="hidden lg:table-cell">
                  {c.country ? (
                    <div className="flex items-center gap-1 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                      <MapPin size={11} />{c.country}
                    </div>
                  ) : <span style={{ color: "var(--apt-text-disabled)" }}>—</span>}
                </td>
                <td>
                  <div className="flex flex-col gap-1">
                    <Badge variant={statusVariant(c.status)} dot>{c.status}</Badge>
                    <Badge variant={c.accountType === "business" ? "blue" : "default"}>
                      {c.accountType === "business" ? "Business" : "Individual"}
                    </Badge>
                  </div>
                </td>
                <td className="hidden lg:table-cell">
                  <span className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{c.assignedSalesRepName ?? "—"}</span>
                </td>
                <td className="text-right hidden sm:table-cell">
                  <span className="text-[13px] tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{c.totalOrders}</span>
                </td>
                <td className="text-right hidden sm:table-cell">
                  <span className="text-[13px] tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{c.totalQuotes}</span>
                </td>
                <td className="text-right hidden xl:table-cell">
                  <span className="text-[13px] tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{c.totalRfqs}</span>
                </td>
                <td className="text-right">
                  <span className="text-[13px] font-semibold tabular-nums" style={{ color: "var(--apt-text-primary)" }}>
                    {c.ltv > 0 ? `GHS ${c.ltv.toLocaleString()}` : "—"}
                  </span>
                </td>
                <td className="hidden md:table-cell">
                  <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                    {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString("en-GH", { day: "numeric", month: "short" }) : "—"}
                  </span>
                </td>
                <td className="hidden md:table-cell">
                  <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                    {new Date(c.createdAt).toLocaleDateString("en-GH", { month: "short", year: "numeric" })}
                  </span>
                </td>
                <td>
                  <CustomerQuickActions customer={c} canEdit={canEdit} canExport={canExport} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
