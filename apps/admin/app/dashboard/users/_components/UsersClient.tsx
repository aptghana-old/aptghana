"use client";

import { useState, useCallback } from "react";
import { Plus, Key, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserCog } from "lucide-react";
import type { AdminUser, AdminRole } from "./types";
import { ROLE_META, ALL_ROLES } from "./types";
import UsersTable from "./UsersTable";
import UserDrawer from "./UserDrawer";
import CreateUserModal from "./CreateUserModal";
import PermissionMatrixModal from "./PermissionMatrixModal";

interface Props {
  initialUsers: AdminUser[];
  currentUserId: string;
  currentUserRole: AdminRole;
  canCreate: boolean;
}

export default function UsersClient({ initialUsers, currentUserId, currentUserRole, canCreate }: Props) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  function openUser(user: AdminUser) {
    setSelectedUser(user);
    setDrawerOpen(true);
  }

  function handleUpdated(updated: AdminUser) {
    setUsers((prev) => prev.map((u) => (u._id === updated._id ? { ...u, ...updated } : u)));
    setSelectedUser((prev) => (prev?._id === updated._id ? { ...prev, ...updated } : prev));
  }

  function handleDeleted(id: string) {
    setUsers((prev) => prev.filter((u) => u._id !== id));
    setSelectedUser(null);
  }

  function handleCreated(user: AdminUser) {
    setUsers((prev) => [user, ...prev]);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll(ids: string[]) {
    setSelectedIds(new Set(ids));
  }

  async function handleBulkAction(action: "activate" | "suspend" | "delete", ids: string[]) {
    setBulkLoading(true);
    try {
      const endpoint = action === "delete" ? "DELETE" : "POST";
      await Promise.all(
        ids.map((id) => {
          if (action === "delete") {
            return fetch(`/api/users/${id}`, { method: "DELETE" });
          }
          return fetch(`/api/users/${id}/unlock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          });
        }),
      );

      if (action === "delete") {
        setUsers((prev) => prev.filter((u) => !ids.includes(u._id)));
      } else {
        const status = action === "activate" ? "active" : "suspended";
        setUsers((prev) =>
          prev.map((u) => (ids.includes(u._id) ? { ...u, status: status as "active" | "suspended" } : u)),
        );
      }
      setSelectedIds(new Set());
    } catch {
      // Individual errors handled silently for bulk ops
    } finally {
      setBulkLoading(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.admins ?? []);
      }
    } finally {
      setRefreshing(false);
    }
  }

  const roleStats = ALL_ROLES.map((role) => ({
    role,
    count: users.filter((u) => u.role === role).length,
    active: users.filter((u) => u.role === role && u.status === "active").length,
  }));

  return (
    <>
      <PageHeader
        title="Users & Roles"
        description="Manage admin team access and role-based permissions."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />}
              onClick={refresh}
              disabled={refreshing}
            >
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Key size={13} />}
              onClick={() => setMatrixOpen(true)}
            >
              Permission Matrix
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={() => setCreateOpen(true)}
              >
                Invite User
              </Button>
            )}
          </div>
        }
      />

      <div className="p-4 sm:p-6 space-y-5">
        {/* Role overview cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {roleStats.map(({ role, count, active }) => {
            const meta = ROLE_META[role];
            return (
              <div
                key={role}
                className="rounded-xl p-4"
                style={{ background: meta.color, border: `1px solid ${meta.textColor}20` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-semibold" style={{ color: meta.textColor }}>{meta.label}</p>
                    <p className="text-[22px] font-bold mt-0.5" style={{ color: meta.textColor }}>{count}</p>
                  </div>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5"
                    style={{ background: `${meta.textColor}15`, color: meta.textColor }}
                  >
                    {active} active
                  </span>
                </div>
                <p className="text-[10px] mt-1" style={{ color: meta.textColor, opacity: 0.75 }}>
                  {meta.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Users table */}
        {users.length === 0 ? (
          <EmptyState
            icon={<UserCog size={22} />}
            title="No admin users yet"
            description="Invite your first team member to get started."
            action={
              canCreate ? (
                <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setCreateOpen(true)}>
                  Invite User
                </Button>
              ) : undefined
            }
          />
        ) : (
          <UsersTable
            users={users}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onSelectUser={openUser}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onSelectAll={selectAll}
            onBulkAction={handleBulkAction}
            bulkLoading={bulkLoading}
          />
        )}
      </div>

      <UserDrawer
        user={selectedUser}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        currentUserRole={currentUserRole}
        onCreated={handleCreated}
      />

      <PermissionMatrixModal
        open={matrixOpen}
        onClose={() => setMatrixOpen(false)}
        currentUserRole={currentUserRole}
      />
    </>
  );
}
