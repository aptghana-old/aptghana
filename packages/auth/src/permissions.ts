export type AdminRole = "super_admin" | "manager" | "sales" | "account";

export type Permission =
  | "dashboard:view"
  | "analytics:view"
  | "products:view"
  | "products:create"
  | "products:edit"
  | "products:delete"
  | "products:import"
  | "brands:view"
  | "brands:create"
  | "brands:edit"
  | "brands:delete"
  | "categories:view"
  | "categories:create"
  | "categories:edit"
  | "categories:delete"
  | "media:view"
  | "media:upload"
  | "media:delete"
  | "customers:view"
  | "customers:edit"
  | "customers:notes"
  | "rfqs:view"
  | "rfqs:create"
  | "rfqs:edit"
  | "quotes:view"
  | "quotes:create"
  | "quotes:edit"
  | "quotes:approve"
  | "quotes:export"
  | "orders:view"
  | "orders:create"
  | "orders:edit"
  | "invoices:view"
  | "invoices:create"
  | "invoices:edit"
  | "payments:view"
  | "payments:record"
  | "payments:verify"
  | "reports:view"
  | "reports:export"
  | "content:view"
  | "content:edit"
  | "search:view"
  | "search:edit"
  | "users:view"
  | "users:create"
  | "users:edit"
  | "users:delete"
  | "settings:view"
  | "settings:edit"
  | "audit:view"
  | "exports:run"
  | "system:admin";

const ALL_PERMISSIONS: Permission[] = [
  "dashboard:view",
  "analytics:view",
  "products:view",
  "products:create",
  "products:edit",
  "products:delete",
  "products:import",
  "brands:view",
  "brands:create",
  "brands:edit",
  "brands:delete",
  "categories:view",
  "categories:create",
  "categories:edit",
  "categories:delete",
  "media:view",
  "media:upload",
  "media:delete",
  "customers:view",
  "customers:edit",
  "customers:notes",
  "rfqs:view",
  "rfqs:create",
  "rfqs:edit",
  "quotes:view",
  "quotes:create",
  "quotes:edit",
  "quotes:approve",
  "quotes:export",
  "orders:view",
  "orders:create",
  "orders:edit",
  "invoices:view",
  "invoices:create",
  "invoices:edit",
  "payments:view",
  "payments:record",
  "payments:verify",
  "reports:view",
  "reports:export",
  "content:view",
  "content:edit",
  "search:view",
  "search:edit",
  "users:view",
  "users:create",
  "users:edit",
  "users:delete",
  "settings:view",
  "settings:edit",
  "audit:view",
  "exports:run",
  "system:admin",
];

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: ALL_PERMISSIONS,

  manager: [
    "dashboard:view",
    "analytics:view",
    "products:view",
    "products:create",
    "products:edit",
    "products:delete",
    "products:import",
    "brands:view",
    "brands:create",
    "brands:edit",
    "brands:delete",
    "categories:view",
    "categories:create",
    "categories:edit",
    "categories:delete",
    "media:view",
    "media:upload",
    "media:delete",
    "customers:view",
    "customers:edit",
    "customers:notes",
    "rfqs:view",
    "rfqs:create",
    "rfqs:edit",
    "quotes:view",
    "quotes:create",
    "quotes:edit",
    "quotes:approve",
    "quotes:export",
    "orders:view",
    "orders:create",
    "orders:edit",
    "invoices:view",
    "invoices:create",
    "invoices:edit",
    "payments:view",
    "reports:view",
    "reports:export",
    "content:view",
    "content:edit",
    "search:view",
    "search:edit",
    "exports:run",
  ],

  sales: [
    "dashboard:view",
    "products:view",
    "brands:view",
    "categories:view",
    "media:view",
    "customers:view",
    "customers:notes",
    "rfqs:view",
    "rfqs:create",
    "rfqs:edit",
    "quotes:view",
    "quotes:create",
    "quotes:edit",
    "quotes:export",
    "orders:view",
    "orders:create",
    "reports:view",
    "content:view",
  ],

  account: [
    "dashboard:view",
    "customers:view",
    "quotes:view",
    "orders:view",
    "invoices:view",
    "invoices:create",
    "invoices:edit",
    "payments:view",
    "payments:record",
    "payments:verify",
    "reports:view",
    "reports:export",
    "exports:run",
    "content:view",
  ],
};

/**
 * Returns true if role + optional per-user overrides grant the required permission.
 * Overrides prefixed with "!" explicitly deny; plain overrides explicitly grant.
 */
export function hasPermission(
  role: AdminRole,
  overrides: string[],
  required: Permission,
): boolean {
  if (overrides.includes(`!${required}`)) return false;
  if (overrides.includes(required)) return true;
  return ROLE_PERMISSIONS[role]?.includes(required) ?? false;
}

/**
 * Route prefix → minimum permission required to access the route.
 * Entries are evaluated in order; first match wins. More-specific prefixes first.
 */
export const ROUTE_PERMISSION_MAP: Array<{ prefix: string; permission: Permission }> = [
  { prefix: "/dashboard/users",        permission: "users:view" },
  { prefix: "/dashboard/settings",     permission: "settings:view" },
  { prefix: "/dashboard/audit",        permission: "audit:view" },
  { prefix: "/dashboard/integrations", permission: "settings:view" },
  { prefix: "/dashboard/search",       permission: "search:view" },
  { prefix: "/dashboard/analytics",    permission: "analytics:view" },
  { prefix: "/dashboard/homepage",     permission: "content:edit" },
  { prefix: "/dashboard/solutions",    permission: "content:edit" },
  { prefix: "/dashboard/services",     permission: "content:edit" },
  { prefix: "/dashboard/company",      permission: "content:edit" },
  { prefix: "/dashboard/industries",   permission: "content:edit" },
  { prefix: "/dashboard/resources",    permission: "content:edit" },
  { prefix: "/dashboard/cms",          permission: "content:edit" },
  { prefix: "/dashboard/articles",     permission: "content:view" },
  { prefix: "/dashboard/navigation",   permission: "content:edit" },
  { prefix: "/dashboard/products",     permission: "products:view" },
  { prefix: "/dashboard/brands",       permission: "brands:view" },
  { prefix: "/dashboard/categories",   permission: "categories:view" },
  { prefix: "/dashboard/media",        permission: "media:view" },
  { prefix: "/dashboard/customers",    permission: "customers:view" },
  { prefix: "/dashboard/orders",       permission: "orders:view" },
  { prefix: "/dashboard/quotes",       permission: "quotes:view" },
];

/** Maps nav href → required permission (for sidebar filtering). */
export const NAV_PERMISSION_MAP: Partial<Record<string, Permission>> = {
  "/dashboard/analytics":          "analytics:view",
  "/dashboard/products":           "products:view",
  "/dashboard/brands":             "brands:view",
  "/dashboard/categories":         "categories:view",
  "/dashboard/media":              "media:view",
  "/dashboard/customers":          "customers:view",
  "/dashboard/orders":             "orders:view",
  "/dashboard/quotes":             "quotes:view",
  "/dashboard/homepage":           "content:edit",
  "/dashboard/solutions":          "content:edit",
  "/dashboard/services":           "content:edit",
  "/dashboard/company":            "content:edit",
  "/dashboard/industries":         "content:edit",
  "/dashboard/resources":          "content:edit",
  "/dashboard/cms":                "content:edit",
  "/dashboard/articles":           "content:view",
  "/dashboard/navigation":         "content:edit",
  "/dashboard/search":             "search:view",
  "/dashboard/search/synonyms":    "search:edit",
  "/dashboard/search/analytics":   "search:view",
  "/dashboard/search/gaps":        "search:view",
  "/dashboard/search/ranking":     "search:view",
  "/dashboard/search/settings":    "search:edit",
  "/dashboard/users":              "users:view",
  "/dashboard/audit":              "audit:view",
  "/dashboard/integrations":       "settings:view",
  "/dashboard/settings":           "settings:view",
};
