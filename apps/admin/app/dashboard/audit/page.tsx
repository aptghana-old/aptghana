import type { Metadata } from "next";
import { ScrollText, ShieldCheck, Edit3, Trash2, Plus, LogIn, LogOut, Package, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EMAIL_ADMIN } from "@apt/config";

export const metadata: Metadata = { title: "Audit Log" };

type Action = "login" | "logout" | "create" | "update" | "delete" | "publish" | "sync";

const ACTION_META: Record<Action, { label: string; icon: React.ReactNode; color: string; textColor: string }> = {
  login:   { label: "Login",   icon: <LogIn size={12} />,    color: "#f0fdf4", textColor: "#16a34a" },
  logout:  { label: "Logout",  icon: <LogOut size={12} />,   color: "#f8fafc", textColor: "#64748b" },
  create:  { label: "Created", icon: <Plus size={12} />,     color: "#eff6ff", textColor: "#0057b8" },
  update:  { label: "Updated", icon: <Edit3 size={12} />,    color: "#fffbeb", textColor: "#d97706" },
  delete:  { label: "Deleted", icon: <Trash2 size={12} />,   color: "#fef2f2", textColor: "#dc2626" },
  publish: { label: "Published",icon: <ShieldCheck size={12}/>,color:"#f0fdf4",textColor:"#16a34a" },
  sync:    { label: "Synced",  icon: <RefreshCw size={12} />,color: "#fdf4ff", textColor: "#9333ea" },
};

const SAMPLE_LOGS = [
  { id: "1", user: "Admin", action: "create" as Action, resource: "Product",  target: "SE-LC1D09 Contactor",    time: new Date(Date.now() - 3_600_000) },
  { id: "2", user: "Admin", action: "update" as Action, resource: "Brand",    target: "Schneider Electric",     time: new Date(Date.now() - 7_200_000) },
  { id: "3", user: "Admin", action: "login"  as Action, resource: "Auth",     target: EMAIL_ADMIN,     time: new Date(Date.now() - 9_000_000) },
  { id: "4", user: "Admin", action: "publish"as Action, resource: "Page",     target: "Homepage",               time: new Date(Date.now() - 86_400_000) },
  { id: "5", user: "Admin", action: "sync"   as Action, resource: "Odoo",     target: "Inventory sync (6,666)", time: new Date(Date.now() - 172_800_000) },
  { id: "6", user: "Admin", action: "delete" as Action, resource: "Category", target: "Obsolete > Legacy",      time: new Date(Date.now() - 259_200_000) },
];

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AuditPage() {
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

          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Resource</th>
                <th>Target</th>
                <th>User</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_LOGS.map((log) => {
                const meta = ACTION_META[log.action];
                return (
                  <tr key={log.id}>
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
                        {log.resource}
                      </span>
                    </td>
                    <td>
                      <span className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
                        {log.target}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          style={{ background: "#0057b8" }}
                        >
                          {log.user.charAt(0)}
                        </div>
                        <span className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>
                          {log.user}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="text-[12px]" title={log.time.toLocaleString()} style={{ color: "var(--apt-text-muted)" }}>
                        {timeAgo(log.time)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div
            className="px-5 py-3 text-[12px]"
            style={{ borderTop: "1px solid var(--apt-border)", color: "var(--apt-text-muted)" }}
          >
            Audit log persistence requires the AuditModel collection to be seeded. Schema is ready in <code className="font-mono">packages/db/src/models/</code>.
          </div>
        </div>
      </div>
    </div>
  );
}
