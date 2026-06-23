import type { AdminRole, Permission } from "@apt/auth";

export type { AdminRole, Permission };

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  username: string;
  role: AdminRole;
  status: "active" | "suspended";
  permissions: string[];
  mfaEnabled: boolean;
  avatar?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  passwordChangedAt?: string;
  mustChangePassword?: boolean;
  failedLoginAttempts?: number;
  lockedUntil?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  deletedAt?: string;
}

export interface AuditEntry {
  _id: string;
  action: string;
  actor: { type: string; id?: string; name?: string };
  message?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export const ROLE_META: Record<AdminRole, {
  label: string;
  description: string;
  color: string;
  textColor: string;
  badgeClass: string;
}> = {
  super_admin: {
    label: "Super Admin",
    description: "Full platform access",
    color: "#fdf4ff",
    textColor: "#9333ea",
    badgeClass: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300",
  },
  manager: {
    label: "Manager",
    description: "All features except user & system management",
    color: "#eff6ff",
    textColor: "#0057b8",
    badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  },
  sales: {
    label: "Sales",
    description: "Quotes, orders, customers",
    color: "#f0fdf4",
    textColor: "#16a34a",
    badgeClass: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
  },
  account: {
    label: "Account",
    description: "Invoices, payments, reports",
    color: "#fff7ed",
    textColor: "#ea580c",
    badgeClass: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300",
  },
};

export const AUDIT_ACTION_LABELS: Record<string, { label: string; color: string }> = {
  admin_user_created:      { label: "Account created",        color: "#16a34a" },
  admin_user_updated:      { label: "Profile updated",        color: "#0057b8" },
  admin_role_changed:      { label: "Role changed",           color: "#9333ea" },
  admin_permissions_changed: { label: "Permissions changed",  color: "#9333ea" },
  admin_password_reset:    { label: "Password reset",         color: "#ea580c" },
  admin_account_unlocked:  { label: "Account unlocked",       color: "#16a34a" },
  admin_user_activated:    { label: "Account activated",      color: "#16a34a" },
  admin_user_suspended:    { label: "Account suspended",      color: "#dc2626" },
  admin_user_deleted:      { label: "Account deleted",        color: "#dc2626" },
};

export const ALL_ROLES: AdminRole[] = ["super_admin", "manager", "sales", "account"];

export interface PermissionModule {
  module: string;
  permissions: Permission[];
}

export const PERMISSION_MODULES: PermissionModule[] = [
  { module: "Dashboard",    permissions: ["dashboard:view", "analytics:view"] },
  { module: "Products",     permissions: ["products:view", "products:create", "products:edit", "products:delete", "products:import"] },
  { module: "Brands",       permissions: ["brands:view", "brands:create", "brands:edit", "brands:delete"] },
  { module: "Categories",   permissions: ["categories:view", "categories:create", "categories:edit", "categories:delete"] },
  { module: "Media",        permissions: ["media:view", "media:upload", "media:delete"] },
  { module: "Customers",    permissions: ["customers:view", "customers:edit", "customers:notes"] },
  { module: "Quotes & RFQs", permissions: ["rfqs:view", "rfqs:create", "rfqs:edit", "quotes:view", "quotes:create", "quotes:edit", "quotes:approve", "quotes:export"] },
  { module: "Orders",       permissions: ["orders:view", "orders:create", "orders:edit"] },
  { module: "Invoices",     permissions: ["invoices:view", "invoices:create", "invoices:edit"] },
  { module: "Payments",     permissions: ["payments:view", "payments:record", "payments:verify"] },
  { module: "Reports",      permissions: ["reports:view", "reports:export", "exports:run"] },
  { module: "Content & CMS", permissions: ["content:view", "content:edit"] },
  { module: "Search",       permissions: ["search:view", "search:edit"] },
  { module: "Users",        permissions: ["users:view", "users:create", "users:edit", "users:delete", "audit:view"] },
  { module: "Settings",     permissions: ["settings:view", "settings:edit", "system:admin"] },
];

export function formatPermissionLabel(p: string): string {
  const [, action] = p.split(":");
  const labels: Record<string, string> = {
    view: "View",
    create: "Create",
    edit: "Edit",
    delete: "Delete",
    import: "Import",
    upload: "Upload",
    notes: "Notes",
    approve: "Approve",
    export: "Export",
    record: "Record",
    verify: "Verify",
    run: "Run",
    admin: "Admin",
  };
  return labels[action] ?? action;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isLocked(user: AdminUser): boolean {
  return !!(user.lockedUntil && new Date(user.lockedUntil) > new Date());
}
