// Central registry of external services connected to the APT Ghana platform.
// Status is derived from real process.env presence (not hardcoded) so this
// page and the header "X/Y INTEGRATIONS" badge never drift out of sync.

export interface IntegrationField {
  /** Env var name, matching apps/admin/.env.example exactly. */
  key: string;
  required: boolean;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  initials: string;
  category: "ERP" | "Search" | "Payments" | "Analytics" | "Email";
  tint: string;
  fg: string;
  version: string;
  description: string;
  fields: IntegrationField[];
  /** The field whose presence best indicates the integration is wired up. */
  primaryField: string;
  actions: string[];
  docsHref?: string;
}

export const INTEGRATIONS: IntegrationConfig[] = [
  {
    id: "odoo",
    name: "Odoo ERP",
    initials: "OD",
    category: "ERP",
    tint: "#F3ECFD",
    fg: "#7C3AED",
    version: "Odoo 17",
    description:
      "Inventory, pricing, customers and order sync. Odoo is the system of record for commerce operations.",
    fields: [
      { key: "ODOO_URL", required: true },
      { key: "ODOO_DB", required: true },
      { key: "ODOO_USERNAME", required: true },
      { key: "ODOO_PASSWORD", required: true },
    ],
    primaryField: "ODOO_URL",
    actions: ["Sync Inventory", "Test Connection"],
  },
  {
    id: "meilisearch",
    name: "Meilisearch",
    initials: "MS",
    category: "Search",
    tint: "#EAF1FE",
    fg: "#2A6FDB",
    version: "v1.x",
    description:
      "Instant, typo-tolerant full-text search with industrial synonyms, filters and facets.",
    fields: [
      { key: "MEILISEARCH_HOST", required: true },
      { key: "MEILISEARCH_ADMIN_KEY", required: true },
    ],
    primaryField: "MEILISEARCH_HOST",
    actions: ["Reindex All", "Configure Indexes"],
  },
  {
    id: "paystack",
    name: "Paystack",
    initials: "PS",
    category: "Payments",
    tint: "#E7F8EF",
    fg: "#0B8A4E",
    version: "v2 API",
    description:
      "Primary payment gateway for Ghana & West Africa — card, mobile money (MTN, Telecel, AirtelTigo) and bank transfer.",
    fields: [
      { key: "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY", required: true },
      { key: "PAYSTACK_SECRET_KEY", required: true },
      { key: "PAYSTACK_WEBHOOK_SECRET", required: false },
    ],
    primaryField: "PAYSTACK_SECRET_KEY",
    actions: ["Configure", "Test Webhook"],
  },
  {
    id: "posthog",
    name: "PostHog",
    initials: "PH",
    category: "Analytics",
    tint: "#FFF3E6",
    fg: "#D97706",
    version: "v3",
    description:
      "Product analytics, session recordings, feature flags and A/B testing.",
    fields: [
      { key: "NEXT_PUBLIC_POSTHOG_KEY", required: true },
      { key: "NEXT_PUBLIC_POSTHOG_HOST", required: true },
    ],
    primaryField: "NEXT_PUBLIC_POSTHOG_KEY",
    actions: ["Configure"],
  },
  {
    id: "resend",
    name: "Email · Resend",
    initials: "RE",
    category: "Email",
    tint: "#EAF4FE",
    fg: "#0369A1",
    version: "Resend API",
    description:
      "Transactional email for order confirmations, quote responses and account notifications.",
    fields: [
      { key: "RESEND_API_KEY", required: true },
      { key: "EMAIL_FROM", required: true },
    ],
    primaryField: "RESEND_API_KEY",
    actions: ["Configure", "Send Test"],
  },
];

export type IntegrationStatus = "configured" | "partial" | "pending";

export interface IntegrationRuntime extends IntegrationConfig {
  status: IntegrationStatus;
  fieldsSet: number;
  fieldsTotal: number;
  missingRequired: string[];
}

function isSet(key: string): boolean {
  const v = process.env[key];
  return typeof v === "string" && v.trim().length > 0;
}

export function getIntegrationsRuntime(): IntegrationRuntime[] {
  return INTEGRATIONS.map((it) => {
    const requiredFields = it.fields.filter((f) => f.required);
    const missingRequired = requiredFields.filter((f) => !isSet(f.key)).map((f) => f.key);
    const fieldsSet = it.fields.filter((f) => isSet(f.key)).length;
    const status: IntegrationStatus =
      missingRequired.length === 0 ? "configured" : fieldsSet === 0 ? "pending" : "partial";
    return { ...it, status, fieldsSet, fieldsTotal: it.fields.length, missingRequired };
  });
}

/** Used by the dashboard header's "X/Y INTEGRATIONS" indicator. */
export function getIntegrationsSummary(): { configured: number; total: number } {
  const runtime = getIntegrationsRuntime();
  return {
    configured: runtime.filter((it) => it.status === "configured").length,
    total: runtime.length,
  };
}
