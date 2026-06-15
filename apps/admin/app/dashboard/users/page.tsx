import type { Metadata } from "next";
import { connectDB, AdminModel } from "@apt/db";
import { UserCog, Plus, Shield, Key } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Users & Roles" };

const ROLE_META: Record<string, { label: string; description: string; color: string; textColor: string }> = {
  super_admin:    { label: "Super Admin",      description: "Full system access",          color: "#fdf4ff", textColor: "#9333ea" },
  administrator:  { label: "Administrator",    description: "All admin features",          color: "#eff6ff", textColor: "#0057b8" },
  sales:          { label: "Sales",            description: "Orders, quotes, customers",   color: "#f0fdf4", textColor: "#16a34a" },
  marketing:      { label: "Marketing",        description: "CMS, articles, analytics",    color: "#fff7ed", textColor: "#ea580c" },
  content_editor: { label: "Content Editor",  description: "Products, brands, pages",     color: "#f0f9ff", textColor: "#0284c7" },
  warehouse:      { label: "Warehouse",        description: "Inventory management",        color: "#fefce8", textColor: "#ca8a04" },
  finance:        { label: "Finance",          description: "Orders, invoices, reports",   color: "#fdf4ff", textColor: "#9333ea" },
  support:        { label: "Support",          description: "Quotes, customers, tickets",  color: "#fef2f2", textColor: "#dc2626" },
};

async function getAdmins() {
  try {
    await connectDB();
    return AdminModel.find({}).sort({ role: 1, name: 1 }).lean();
  } catch {
    return [];
  }
}

export default async function UsersPage() {
  const admins = await getAdmins();

  return (
    <div>
      <PageHeader
        title="Users & Roles"
        description="Manage admin team access with role-based permissions."
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={13} />}>
            Invite User
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Role definitions */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                Available Roles
              </h2>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
                Permission levels for the admin platform
              </p>
            </div>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(ROLE_META).map(([key, meta]) => (
              <div
                key={key}
                className="p-3 rounded-lg"
                style={{ background: meta.color }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Shield size={12} style={{ color: meta.textColor }} />
                  <span className="text-[12px] font-semibold" style={{ color: meta.textColor }}>
                    {meta.label}
                  </span>
                </div>
                <p className="text-[11px]" style={{ color: meta.textColor, opacity: 0.8 }}>
                  {meta.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Users table */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
              Team Members
            </h2>
            <Button variant="ghost" size="xs" icon={<Key size={11} />}>
              Permissions Matrix
            </Button>
          </div>

          {admins.length === 0 ? (
            <EmptyState
              icon={<UserCog size={22} />}
              title="No admin users yet"
              description="Invite your first team member to get started."
              action={
                <Button variant="primary" size="sm" icon={<Plus size={13} />}>
                  Invite User
                </Button>
              }
            />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Active</th>
                  <th className="w-px" />
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const a = admin as unknown as {
                    _id: { toString(): string };
                    name: string;
                    email: string;
                    role: string;
                    status: string;
                    lastLogin?: Date;
                  };
                  const roleMeta = ROLE_META[a.role];
                  return (
                    <tr key={a._id.toString()}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                            style={{ background: roleMeta?.color ? roleMeta.textColor : "#0057b8" }}
                          >
                            {a.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
                              {a.name}
                            </div>
                            <div className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                              {a.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {roleMeta ? (
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: roleMeta.color, color: roleMeta.textColor }}
                          >
                            {roleMeta.label}
                          </span>
                        ) : (
                          <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{a.role}</span>
                        )}
                      </td>
                      <td>
                        <Badge variant={a.status === "active" ? "active" : "inactive"} dot>
                          {a.status}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                          {a.lastLogin
                            ? new Date(a.lastLogin).toLocaleDateString("en-GH", { day: "numeric", month: "short" })
                            : "Never"}
                        </span>
                      </td>
                      <td>
                        <Button variant="ghost" size="xs">Edit</Button>
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
