"use client";

import { useState, useMemo } from "react";
import { Search, Filter, ChevronUp, ChevronDown, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import type { AdminUser, AdminRole } from "./types";
import { ROLE_META, ALL_ROLES, formatDate, isLocked } from "./types";
import RoleBadge from "./RoleBadge";

interface Props {
  users: AdminUser[];
  currentUserId: string;
  currentUserRole: AdminRole;
  onSelectUser(user: AdminUser): void;
  selectedIds: Set<string>;
  onToggleSelect(id: string): void;
  onSelectAll(ids: string[]): void;
  onBulkAction(action: "activate" | "suspend" | "delete", ids: string[]): void;
  bulkLoading: boolean;
}

type SortKey = "name" | "role" | "status" | "lastLoginAt" | "createdAt";
type SortDir = "asc" | "desc";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  ...ALL_ROLES.map((r) => ({ value: r, label: ROLE_META[r].label })),
];

export default function UsersTable({
  users,
  currentUserId,
  currentUserRole,
  onSelectUser,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onBulkAction,
  bulkLoading,
}: Props) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    let result = [...users];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q),
      );
    }
    if (filterRole !== "all") result = result.filter((u) => u.role === filterRole);
    if (filterStatus !== "all") result = result.filter((u) => u.status === filterStatus);

    result.sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";
      if (sortKey === "name") { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
      else if (sortKey === "role") { va = a.role; vb = b.role; }
      else if (sortKey === "status") { va = a.status; vb = b.status; }
      else if (sortKey === "lastLoginAt") { va = a.lastLoginAt ?? ""; vb = b.lastLoginAt ?? ""; }
      else if (sortKey === "createdAt") { va = a.createdAt; vb = b.createdAt; }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [users, search, filterRole, filterStatus, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />
    ) : null;

  const allPageIds = filtered.map((u) => u._id).filter((id) => id !== currentUserId);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));

  const isSuperAdmin = currentUserRole === "super_admin";

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 flex flex-wrap items-center gap-3" style={{ borderBottom: "1px solid var(--apt-border)" }}>
        <div className="flex-1 min-w-[180px] max-w-xs">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--apt-text-muted)" }} />
            <input
              type="text"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-[13px] rounded-lg"
              style={{
                background: "var(--apt-bg-raised)",
                border: "1px solid var(--apt-border)",
                color: "var(--apt-text-primary)",
                outline: "none",
              }}
            />
          </div>
        </div>

        <Select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          options={ROLE_OPTIONS}
          wrapperClass="min-w-[130px]"
        />
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={STATUS_OPTIONS}
          wrapperClass="min-w-[130px]"
        />

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
            {filtered.length} of {users.length}
          </span>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div
          className="px-4 py-2.5 flex items-center gap-3"
          style={{ background: "var(--apt-brand-bg)", borderBottom: "1px solid var(--apt-border)" }}
        >
          <span className="text-[12px] font-medium" style={{ color: "var(--apt-text-brand)" }}>
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="ghost"
              size="xs"
              loading={bulkLoading}
              onClick={() => onBulkAction("activate", [...selectedIds])}
            >
              Activate
            </Button>
            <Button
              variant="ghost"
              size="xs"
              loading={bulkLoading}
              onClick={() => onBulkAction("suspend", [...selectedIds])}
            >
              Suspend
            </Button>
            {isSuperAdmin && (
              <Button
                variant="destructive"
                size="xs"
                loading={bulkLoading}
                onClick={() => onBulkAction("delete", [...selectedIds])}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center" style={{ color: "var(--apt-text-muted)" }}>
          <p className="text-[13px]">No users match your filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => allSelected ? onSelectAll([]) : onSelectAll(allPageIds)}
                    className="rounded"
                    title="Select all"
                  />
                </th>
                <th>
                  <button className="flex items-center gap-1 hover:opacity-70" onClick={() => toggleSort("name")}>
                    User <SortIcon k="name" />
                  </button>
                </th>
                <th>
                  <button className="flex items-center gap-1 hover:opacity-70" onClick={() => toggleSort("role")}>
                    Role <SortIcon k="role" />
                  </button>
                </th>
                <th>
                  <button className="flex items-center gap-1 hover:opacity-70" onClick={() => toggleSort("status")}>
                    Status <SortIcon k="status" />
                  </button>
                </th>
                <th>
                  <button className="flex items-center gap-1 hover:opacity-70" onClick={() => toggleSort("lastLoginAt")}>
                    Last Login <SortIcon k="lastLoginAt" />
                  </button>
                </th>
                <th>
                  <button className="flex items-center gap-1 hover:opacity-70" onClick={() => toggleSort("createdAt")}>
                    Created <SortIcon k="createdAt" />
                  </button>
                </th>
                <th className="w-px" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const locked = isLocked(user);
                const isSelf = user._id === currentUserId;
                const meta = ROLE_META[user.role];
                return (
                  <tr
                    key={user._id}
                    className="cursor-pointer"
                    onClick={() => onSelectUser(user)}
                    style={selectedIds.has(user._id) ? { background: "var(--apt-brand-bg)" } : {}}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user._id)}
                        onChange={() => onToggleSelect(user._id)}
                        disabled={isSelf}
                        className="rounded"
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                          style={{ background: meta?.textColor ?? "#0057b8" }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
                              {user.name}
                            </span>
                            {isSelf && (
                              <span className="text-[9px] px-1 py-px rounded font-semibold" style={{ background: "var(--apt-brand-bg)", color: "var(--apt-text-brand)" }}>
                                You
                              </span>
                            )}
                            {locked && (
                              <span className="text-[9px] px-1 py-px rounded font-semibold bg-red-50 text-red-600">🔒</span>
                            )}
                          </div>
                          <div className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><RoleBadge role={user.role} /></td>
                    <td>
                      <Badge variant={user.status === "active" ? "active" : "inactive"} dot>
                        {user.status}
                      </Badge>
                    </td>
                    <td>
                      <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString("en-GH", { day: "numeric", month: "short" })
                          : "Never"}
                      </span>
                    </td>
                    <td>
                      <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                        {new Date(user.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "2-digit" })}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectUser(user)}
                        className="w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--apt-bg-raised)]"
                        style={{ color: "var(--apt-text-muted)" }}
                        title="View user"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
