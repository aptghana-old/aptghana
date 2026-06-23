"use client";

import { useState } from "react";
import {
  X, Shield, Mail, User, Calendar, Clock, Lock, Unlock, KeyRound,
  AlertTriangle, CheckCircle, Ban, Trash2, Copy, Check,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/Tabs";
import type { AdminUser, AdminRole } from "./types";
import { ROLE_META, ALL_ROLES, formatDate, isLocked, PERMISSION_MODULES, formatPermissionLabel } from "./types";
import { ROLE_PERMISSIONS, hasPermission } from "@apt/auth";
import AuditTimeline from "./AuditTimeline";
import RoleBadge from "./RoleBadge";

interface Props {
  user: AdminUser | null;
  open: boolean;
  onClose(): void;
  currentUserId: string;
  currentUserRole: AdminRole;
  onUpdated(user: AdminUser): void;
  onDeleted(id: string): void;
}

export default function UserDrawer({
  user,
  open,
  onClose,
  currentUserId,
  currentUserRole,
  onUpdated,
  onDeleted,
}: Props) {
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<AdminRole>("sales");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const isSelf = user?._id === currentUserId;
  const isSuperAdmin = currentUserRole === "super_admin";
  const canEdit = isSuperAdmin || (
    currentUserRole === "manager" &&
    user?.role !== "super_admin" &&
    user?.role !== "manager"
  );
  const canDelete = isSuperAdmin && !isSelf;
  const locked = user ? isLocked(user) : false;

  if (!open || !user) return null;

  function startEdit() {
    setEditName(user!.name);
    setEditRole(user!.role);
    setEditing(true);
    setError(null);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
  }

  async function saveEdit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${user!._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, role: editRole }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
      onUpdated(data.admin);
      setEditing(false);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function performAction(action: "unlock" | "activate" | "suspend") {
    setActionLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/users/${user!._id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Action failed"); return; }
      onUpdated({
        ...user!,
        status: action === "suspend" ? "suspended" : action === "activate" ? "active" : user!.status,
        lockedUntil: action === "unlock" ? undefined : user!.lockedUntil,
        failedLoginAttempts: action === "unlock" ? 0 : user!.failedLoginAttempts,
      });
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  async function resetPassword() {
    setActionLoading("reset-password");
    setError(null);
    try {
      const res = await fetch(`/api/users/${user!._id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceChange: true }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to reset password"); return; }
      setResetToken(data.resetToken);
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteUser() {
    setActionLoading("delete");
    setError(null);
    try {
      const res = await fetch(`/api/users/${user!._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to delete user"); return; }
      onDeleted(user!._id);
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(null);
      setConfirmDelete(false);
    }
  }

  async function copyResetToken() {
    if (!resetToken) return;
    await navigator.clipboard.writeText(resetToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  }

  const roleMeta = ROLE_META[user.role];
  const permissions: string[] = user.permissions ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "var(--apt-bg-overlay)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg h-full flex flex-col overflow-hidden"
        style={{ background: "var(--apt-bg)", borderLeft: "1px solid var(--apt-border-strong)" }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: "1px solid var(--apt-border)" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold text-white shrink-0"
              style={{ background: roleMeta?.textColor ?? "#0057b8" }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              {editing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              ) : (
                <h2 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                  {user.name}
                  {isSelf && (
                    <span className="ml-1.5 text-[10px] font-normal px-1.5 py-px rounded" style={{ background: "var(--apt-brand-bg)", color: "var(--apt-text-brand)" }}>You</span>
                  )}
                </h2>
              )}
              <p className="text-[12px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>{user.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <RoleBadge role={user.role} />
                <Badge variant={user.status === "active" ? "active" : "inactive"} dot>
                  {user.status}
                </Badge>
                {locked && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-px rounded-full bg-red-50 text-red-600">
                    <Lock size={8} /> Locked
                  </span>
                )}
                {user.mustChangePassword && (
                  <span className="text-[10px] font-semibold px-1.5 py-px rounded-full bg-amber-50 text-amber-600">
                    Password required
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {canEdit && !editing && (
              <Button variant="ghost" size="xs" onClick={startEdit}>Edit</Button>
            )}
            {editing && (
              <>
                <Button variant="ghost" size="xs" onClick={cancelEdit} disabled={saving}>Cancel</Button>
                <Button variant="primary" size="xs" loading={saving} onClick={saveEdit}>Save</Button>
              </>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--apt-bg-raised)]"
              style={{ color: "var(--apt-text-muted)" }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-3 px-3 py-2 rounded-lg text-[12px] flex items-center gap-2" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
            <AlertTriangle size={12} />
            {error}
          </div>
        )}

        {resetToken && (
          <div className="mx-5 mt-3 px-3 py-3 rounded-lg" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <p className="text-[11px] font-semibold text-green-700 mb-1.5">Password reset token (shown once)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[10px] truncate text-green-800" style={{ fontFamily: "monospace" }}>{resetToken}</code>
              <button onClick={copyResetToken} className="shrink-0 p-1.5 rounded hover:bg-green-100" style={{ color: copiedToken ? "#16a34a" : "#6b7280" }}>
                {copiedToken ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
            <button onClick={() => setResetToken(null)} className="text-[10px] text-green-600 mt-1 underline">Dismiss</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="overview">
            <TabList className="px-5 pt-3 shrink-0">
              <Tab value="overview">Overview</Tab>
              <Tab value="permissions">Permissions</Tab>
              <Tab value="activity">Activity</Tab>
              {canDelete && <Tab value="danger">Danger Zone</Tab>}
            </TabList>

            <div className="flex-1 overflow-y-auto">
              <TabPanel value="overview">
                <div className="px-5 py-4 space-y-5">
                  {editing && isSuperAdmin && (
                    <div>
                      <label className="text-[12px] font-medium block mb-2" style={{ color: "var(--apt-text-primary)" }}>Role</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ALL_ROLES.map((role) => {
                          const meta = ROLE_META[role];
                          const sel = editRole === role;
                          return (
                            <button
                              key={role}
                              type="button"
                              onClick={() => setEditRole(role)}
                              className="p-2.5 rounded-lg text-left"
                              style={{ border: `2px solid ${sel ? meta.textColor : "var(--apt-border)"}`, background: sel ? meta.color : "var(--apt-bg)" }}
                            >
                              <span className="text-[12px] font-semibold block" style={{ color: sel ? meta.textColor : "var(--apt-text-primary)" }}>{meta.label}</span>
                              <span className="text-[10px]" style={{ color: sel ? meta.textColor : "var(--apt-text-muted)", opacity: 0.85 }}>{meta.description}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: <User size={12} />, label: "Username", value: `@${user.username}` },
                      { icon: <Mail size={12} />, label: "Email", value: user.email },
                      { icon: <Clock size={12} />, label: "Last Login", value: formatDate(user.lastLoginAt) },
                      { icon: <Calendar size={12} />, label: "Member Since", value: formatDate(user.createdAt) },
                    ].map(({ icon, label, value }) => (
                      <div key={label} className="rounded-lg p-3" style={{ background: "var(--apt-bg-raised)", border: "1px solid var(--apt-border)" }}>
                        <div className="flex items-center gap-1.5 mb-1" style={{ color: "var(--apt-text-muted)" }}>
                          {icon}
                          <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
                        </div>
                        <p className="text-[12px] font-medium truncate" style={{ color: "var(--apt-text-primary)" }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {((user.failedLoginAttempts ?? 0) > 0 || locked) && (
                    <div className="rounded-lg p-3" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                      <p className="text-[12px] font-semibold text-red-700 flex items-center gap-1.5 mb-0.5">
                        <AlertTriangle size={12} />
                        {locked ? "Account Locked" : "Failed Login Attempts"}
                      </p>
                      <p className="text-[11px] text-red-600">
                        {locked
                          ? `Locked until ${formatDate(user.lockedUntil)}`
                          : `${user.failedLoginAttempts} failed attempt${user.failedLoginAttempts !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                  )}

                  {user.lastLoginIp && (
                    <div className="text-[11px] flex items-center gap-1.5" style={{ color: "var(--apt-text-muted)" }}>
                      <Shield size={11} />
                      Last IP: <code style={{ fontFamily: "monospace" }}>{user.lastLoginIp}</code>
                    </div>
                  )}

                  {canEdit && (
                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--apt-text-muted)" }}>Account Actions</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<KeyRound size={13} />}
                          loading={actionLoading === "reset-password"}
                          onClick={resetPassword}
                        >
                          Reset Password
                        </Button>
                        {locked && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Unlock size={13} />}
                            loading={actionLoading === "unlock"}
                            onClick={() => performAction("unlock")}
                          >
                            Unlock Account
                          </Button>
                        )}
                        {!isSelf && (
                          user.status === "active" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Ban size={13} />}
                              loading={actionLoading === "suspend"}
                              onClick={() => performAction("suspend")}
                            >
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<CheckCircle size={13} />}
                              loading={actionLoading === "activate"}
                              onClick={() => performAction("activate")}
                            >
                              Activate
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabPanel>

              <TabPanel value="permissions">
                <div className="px-5 py-4">
                  <p className="text-[12px] mb-3" style={{ color: "var(--apt-text-muted)" }}>
                    Permissions granted by the{" "}
                    <strong style={{ color: "var(--apt-text-primary)" }}>{ROLE_META[user.role]?.label}</strong> role
                    {permissions.length > 0 && (
                      <>, plus <strong style={{ color: "var(--apt-text-primary)" }}>{permissions.length}</strong> custom override{permissions.length !== 1 ? "s" : ""}</>
                    )}.
                  </p>
                  <div className="space-y-3">
                    {PERMISSION_MODULES.map((mod) => {
                      const visible = mod.permissions.filter(
                        (p) => hasPermission(user.role, permissions, p) || permissions.includes(`!${p}`),
                      );
                      if (visible.length === 0) return null;
                      return (
                        <div key={mod.module}>
                          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--apt-text-muted)" }}>
                            {mod.module}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {visible.map((p) => {
                              const isOverride = permissions.includes(p) && !ROLE_PERMISSIONS[user.role]?.includes(p as never);
                              const isDenied = permissions.includes(`!${p}`);
                              return (
                                <span
                                  key={p}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                  style={{
                                    background: isDenied ? "#fef2f2" : isOverride ? "#fdf4ff" : "var(--apt-bg-raised)",
                                    color: isDenied ? "#dc2626" : isOverride ? "#9333ea" : "var(--apt-text-secondary)",
                                    border: `1px solid ${isDenied ? "#fecaca" : isOverride ? "#e9d5ff" : "var(--apt-border)"}`,
                                  }}
                                  title={p}
                                >
                                  {isDenied ? "✕ " : isOverride ? "★ " : ""}{formatPermissionLabel(p)}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabPanel>

              <TabPanel value="activity">
                <div className="px-5 py-4">
                  <AuditTimeline userId={user._id} />
                </div>
              </TabPanel>

              {canDelete && (
                <TabPanel value="danger">
                  <div className="px-5 py-4 space-y-4">
                    <div
                      className="rounded-xl p-4"
                      style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
                    >
                      <h3 className="text-[13px] font-semibold text-red-700 flex items-center gap-2 mb-1">
                        <Trash2 size={13} />
                        Delete Account
                      </h3>
                      <p className="text-[12px] text-red-600 mb-3">
                        This will soft-delete {user.name}&apos;s account. They will be immediately unable to log in. This action can be reversed by an engineer if needed.
                      </p>
                      {!confirmDelete ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          icon={<Trash2 size={12} />}
                          onClick={() => setConfirmDelete(true)}
                        >
                          Delete {user.name}
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[12px] font-semibold text-red-700">Are you sure? This will immediately revoke all access.</p>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              loading={actionLoading === "delete"}
                              onClick={deleteUser}
                            >
                              Yes, delete account
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabPanel>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
