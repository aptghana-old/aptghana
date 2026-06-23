import type { Metadata } from "next";
import {
  LogIn, LogOut, Plus, Edit3, Trash2, ShieldCheck, RefreshCw, ScrollText,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { connectDB, AuditLogModel } from "@apt/db";

export const metadata: Metadata = { title: "Audit Log" };
export const dynamic = "force-dynamic";

const ACTION_META: Record<string, { label: string; icon: React.ReactNode; color: string; textColor: string }> = {
  login:                   { label: "Login",       icon: <LogIn size={12} />,     color: "#f0fdf4", textColor: "#16a34a" },
  logout:                  { label: "Logout",      icon: <LogOut size={12} />,    color: "#f8fafc", textColor: "#64748b" },
  admin_user_created:      { label: "User Created",icon: <Plus size={12} />,      color: "#eff6ff", textColor: "#0057b8" },
  admin_user_updated:      { label: "User Updated",icon: <Edit3 size={12} />,     color: "#fffbeb", textColor: "#d97706" },
  admin_role_changed:      { label: "Role Changed",icon: <ShieldCheck size={12}/>,color: "#fdf4ff", textColor: "#9333ea" },
  admin_permissions_changed:{ label: "Perms Changed",icon:<ShieldCheck size={12}/>,color:"#fdf4ff",textColor:"#9333ea" },
  admin_password_reset:    { label: "Pwd Reset",   icon: <RefreshCw size={12} />, color: "#fef3c7", textColor: "#d97706" },
  admin_account_unlocked:  { label: "Unlocked",    icon: <ShieldCheck size={12}/>,color: "#f0fdf4", textColor: "#16a34a" },
  admin_user_activated:    { label: "Activated",   icon: <Plus size={12} />,      color: "#f0fdf4", textColor: "#16a34a" },
  admin_user_suspended:    { label: "Suspended",   icon: <Trash2 size={12} />,    color: "#fef2f2", textColor: "#dc2626" },
  admin_user_deleted:      { label: "Deleted",     icon: <Trash2 size={12} />,    color: "#fef2f2", textColor: "#dc2626" },
  create:                  { label: "Created",     icon: <Plus size={12} />,      color: "#eff6ff", textColor: "#0057b8" },
  update:                  { label: "Updated",     icon: <Edit3 size={12} />,     color: "#fffbeb", textColor: "#d97706" },
  delete:                  { label: "Deleted",     icon: <Trash2 size={12} />,    color: "#fef2f2", textColor: "#dc2626" },
  publish:                 { label: "Published",   icon: <ShieldCheck size={12}/>,color: "#f0fdf4", textColor: "#16a34a" },
  sync:                    { label: "Synced",      icon: <RefreshCw size={12} />, color: "#fdf4ff", textColor: "#9333ea" },
};

const DEFAULT_ACTION_META = { label: "Action", icon: <Edit3 size={12} />, color: "#f8fafc", textColor: "#64748b" };

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatEntityType(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function getAuditLogs() {
  try {
    await connectDB();
    const logs = await AuditLogModel.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return { logs: logs as typeof logs, error: null };
  } catch (err) {
    console.error("[audit] Failed to load audit logs:", err);
    return { logs: [], error: "Failed to load audit logs" };
  }
}

export default async function AuditPage() {
  const { logs, error } = await getAuditLogs();

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="Complete record of all administrative actions."
      />

      <div className="p-6">
        <div className="card overflow-hidden">
          <div className="card-header">
            <div>
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                Activity Log
              </h2>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
                Every action is recorded. Showing most recent 50.
              </p>
            </div>
          </div>

          {error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                <ScrollText size={20} />
              </div>
              <p className="text-[14px] font-semibold mb-1" style={{ color: "var(--apt-text-primary)" }}>Unable to load audit log</p>
              <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>Database connection failed. Try refreshing the page.</p>
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={<ScrollText size={20} />}
              title="No audit events yet"
              description="Administrative actions will appear here once they are recorded."
            />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                  <th>Actor</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const meta = ACTION_META[log.action] ?? DEFAULT_ACTION_META;
                  const createdAt = log.createdAt ? new Date(log.createdAt as unknown as string) : new Date();
                  return (
                    <tr key={String(log._id)}>
                      <td>
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{ background: meta.color, color: meta.textColor }}
                        >
                          {meta.icon}
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        <span className="text-[13px]" style={{ color: "var(--apt-text-secondary)" }}>
                          {formatEntityType(log.entityType)}
                        </span>
                      </td>
                      <td>
                        <span className="text-[13px] font-medium truncate max-w-[200px] block" style={{ color: "var(--apt-text-primary)" }}>
                          {log.message ?? String(log.entityId)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                            style={{ background: "#0057b8" }}
                          >
                            {(log.actor?.name ?? "S").charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>
                            {log.actor?.name ?? "System"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="text-[12px]"
                          title={createdAt.toLocaleString()}
                          style={{ color: "var(--apt-text-muted)" }}
                        >
                          {timeAgo(createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
