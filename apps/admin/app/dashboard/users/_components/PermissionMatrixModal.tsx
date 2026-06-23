"use client";

import { X, Check, Minus } from "lucide-react";
import { ROLE_PERMISSIONS, hasPermission } from "@apt/auth";
import { PERMISSION_MODULES, ROLE_META, ALL_ROLES, formatPermissionLabel } from "./types";
import type { AdminRole, AdminUser } from "./types";

interface Props {
  open: boolean;
  onClose(): void;
  user?: AdminUser | null;
  currentUserRole: AdminRole;
  onSaveOverrides?: (userId: string, permissions: string[]) => Promise<void>;
}

export default function PermissionMatrixModal({ open, onClose, user, currentUserRole, onSaveOverrides }: Props) {
  if (!open) return null;

  const canEditOverrides = currentUserRole === "super_admin" && !!user && !!onSaveOverrides;
  const title = user ? `Permissions — ${user.name}` : "Permission Matrix";

  function getCellState(role: AdminRole, perm: string): "full" | "override-grant" | "override-deny" | "none" {
    const baseHas = ROLE_PERMISSIONS[role]?.includes(perm as never);
    if (!user || user.role !== role) {
      return baseHas ? "full" : "none";
    }
    const denied = user.permissions.includes(`!${perm}`);
    const granted = user.permissions.includes(perm);
    if (denied) return "override-deny";
    if (granted && !baseHas) return "override-grant";
    if (baseHas) return "full";
    return "none";
  }

  const displayRoles = user ? [user.role] : ALL_ROLES;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--apt-bg-overlay)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-h-[90vh] flex flex-col rounded-xl overflow-hidden"
        style={{
          maxWidth: user ? 640 : 900,
          background: "var(--apt-bg)",
          border: "1px solid var(--apt-border-strong)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--apt-border)" }}
        >
          <div>
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
              {title}
            </h2>
            {user && (
              <p className="text-[12px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
                Role: {ROLE_META[user.role]?.label} · {user.permissions.length} custom override{user.permissions.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center hover:bg-[var(--apt-bg-raised)]"
            style={{ color: "var(--apt-text-muted)" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Legend */}
        <div
          className="flex items-center gap-4 px-6 py-2.5 shrink-0 text-[11px]"
          style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg-subtle)" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded flex items-center justify-center bg-green-100 dark:bg-green-900/30">
              <Check size={9} className="text-green-600" />
            </span>
            <span style={{ color: "var(--apt-text-secondary)" }}>Granted by role</span>
          </div>
          {user && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
                  <Check size={9} className="text-purple-600" />
                </span>
                <span style={{ color: "var(--apt-text-secondary)" }}>Custom grant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                  <Minus size={9} className="text-red-600" />
                </span>
                <span style={{ color: "var(--apt-text-secondary)" }}>Explicitly denied</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded" style={{ background: "var(--apt-bg-raised)" }} />
            <span style={{ color: "var(--apt-text-secondary)" }}>Not granted</span>
          </div>
        </div>

        {/* Matrix table */}
        <div className="overflow-auto flex-1">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--apt-bg-subtle)" }}>
                <th
                  className="text-left sticky left-0 z-10 text-[11px] font-semibold py-2.5 px-4"
                  style={{
                    background: "var(--apt-bg-subtle)",
                    color: "var(--apt-text-muted)",
                    minWidth: 160,
                    borderBottom: "1px solid var(--apt-border)",
                  }}
                >
                  Module / Permission
                </th>
                {displayRoles.map((role) => (
                  <th
                    key={role}
                    className="text-center py-2.5 px-3 text-[11px] font-semibold"
                    style={{
                      color: ROLE_META[role]?.textColor ?? "var(--apt-text-primary)",
                      borderBottom: "1px solid var(--apt-border)",
                      minWidth: 90,
                    }}
                  >
                    {ROLE_META[role]?.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MODULES.map((mod) => (
                <>
                  <tr key={`mod-${mod.module}`}>
                    <td
                      colSpan={displayRoles.length + 1}
                      className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide"
                      style={{
                        color: "var(--apt-text-muted)",
                        background: "var(--apt-bg-subtle)",
                        borderBottom: "1px solid var(--apt-border)",
                      }}
                    >
                      {mod.module}
                    </td>
                  </tr>
                  {mod.permissions.map((perm) => (
                    <tr
                      key={perm}
                      className="hover:bg-[var(--apt-bg-subtle)]"
                      style={{ borderBottom: "1px solid var(--apt-border)" }}
                    >
                      <td
                        className="text-left sticky left-0 z-10 py-2 px-4 text-[12px]"
                        style={{
                          background: "var(--apt-bg)",
                          color: "var(--apt-text-secondary)",
                          fontFamily: "monospace",
                          fontSize: 11,
                        }}
                      >
                        <span className="text-[10px]" style={{ color: "var(--apt-text-muted)" }}>{perm.split(":")[0]}:</span>
                        <span style={{ color: "var(--apt-text-primary)" }}>{formatPermissionLabel(perm)}</span>
                      </td>
                      {displayRoles.map((role) => {
                        const state = getCellState(role, perm);
                        return (
                          <td key={role} className="text-center py-2 px-3">
                            {state === "full" && (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-green-100 dark:bg-green-900/30">
                                <Check size={10} className="text-green-600" />
                              </span>
                            )}
                            {state === "override-grant" && (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-purple-100 dark:bg-purple-900/30">
                                <Check size={10} className="text-purple-600" />
                              </span>
                            )}
                            {state === "override-deny" && (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-red-100 dark:bg-red-900/30">
                                <Minus size={10} className="text-red-600" />
                              </span>
                            )}
                            {state === "none" && (
                              <span
                                className="inline-block w-5 h-5 rounded"
                                style={{ background: "var(--apt-bg-raised)" }}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 shrink-0 flex items-center justify-between"
          style={{ borderTop: "1px solid var(--apt-border)", background: "var(--apt-bg-subtle)" }}
        >
          <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
            {user
              ? "Custom overrides are applied on top of the role's default permissions."
              : "Showing default permissions for all roles. Individual users may have overrides."}
          </p>
          <button
            onClick={onClose}
            className="text-[12px] font-medium px-4 py-1.5 rounded"
            style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-primary)" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
