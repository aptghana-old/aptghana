import type { Metadata } from "next";
import { Plug, CheckCircle2, AlertTriangle, RefreshCw, ExternalLink, Zap, Shield, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Integrations" };

const INTEGRATIONS = [
  {
    id: "odoo",
    name: "Odoo ERP",
    description: "Inventory, pricing, customers, and order sync. Odoo is the system of record for commerce operations.",
    category: "ERP",
    status: "connected",
    icon: "🏭",
    accentColor: "#7c3aed",
    accentBg: "#fdf4ff",
    version: "Odoo 17",
    lastSync: "Configured via ODOO_URL env var",
    actions: ["Sync Inventory", "Test Connection"],
    fields: ["ODOO_URL", "ODOO_DB", "ODOO_USER", "ODOO_PASSWORD"],
  },
  {
    id: "meilisearch",
    name: "Meilisearch",
    description: "Instant, typo-tolerant full-text search with industrial synonyms, filters, and facets.",
    category: "Search",
    status: "configured",
    icon: "🔍",
    accentColor: "#0057b8",
    accentBg: "#eff6ff",
    version: "v1.x",
    lastSync: "Configured via MEILISEARCH_HOST env var",
    actions: ["Reindex All", "Configure Indexes"],
    fields: ["MEILISEARCH_HOST", "MEILISEARCH_API_KEY"],
  },
  {
    id: "paystack",
    name: "Paystack",
    description: "Primary payment gateway for Ghana and West Africa. Supports card, mobile money (MTN, Vodafone, AirtelTigo), and bank transfers.",
    category: "Payments",
    status: "pending",
    icon: "💳",
    accentColor: "#059669",
    accentBg: "#f0fdf4",
    version: "v2 API",
    lastSync: "Awaiting configuration",
    actions: ["Configure", "Test Webhook"],
    fields: ["PAYSTACK_PUBLIC_KEY", "PAYSTACK_SECRET_KEY", "PAYSTACK_WEBHOOK_SECRET"],
  },
  {
    id: "posthog",
    name: "PostHog",
    description: "Product analytics, session recordings, feature flags, and A/B testing.",
    category: "Analytics",
    status: "pending",
    icon: "📊",
    accentColor: "#d97706",
    accentBg: "#fffbeb",
    version: "v3",
    lastSync: "Awaiting configuration",
    actions: ["Configure"],
    fields: ["NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_HOST"],
  },
  {
    id: "smtp",
    name: "Email (SMTP / Resend)",
    description: "Transactional emails for order confirmations, quote responses, and account notifications.",
    category: "Email",
    status: "pending",
    icon: "📧",
    accentColor: "#0284c7",
    accentBg: "#f0f9ff",
    version: "Resend API",
    lastSync: "Awaiting configuration",
    actions: ["Configure", "Send Test"],
    fields: ["RESEND_API_KEY", "EMAIL_FROM"],
  },
];

type BadgeVariant = "default" | "active" | "inactive" | "pending" | "draft" | "success" | "warning" | "error" | "info" | "blue";
const STATUS_META: Record<string, { label: string; variant: BadgeVariant; icon: React.ReactNode }> = {
  connected:  { label: "Connected",  variant: "active",   icon: <CheckCircle2 size={12} /> },
  configured: { label: "Configured", variant: "blue",     icon: <CheckCircle2 size={12} /> },
  pending:    { label: "Not configured", variant: "pending", icon: <AlertTriangle size={12} /> },
};

export default function IntegrationsPage() {
  return (
    <div>
      <PageHeader
        title="Integrations"
        description="External services and APIs connected to the APT Ghana platform."
      />
      <div className="p-6 space-y-4">
        {INTEGRATIONS.map((integration) => {
          const statusMeta = STATUS_META[integration.status];
          return (
            <div key={integration.id} className="card p-6">
              <div className="flex items-start gap-5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: integration.accentBg }}
                >
                  {integration.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                        {integration.name}
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: integration.accentBg, color: integration.accentColor }}>
                        {integration.category}
                      </span>
                    </div>
                    <Badge variant={statusMeta.variant} dot>{statusMeta.label}</Badge>
                  </div>
                  <p className="text-[13px] mb-3" style={{ color: "var(--apt-text-secondary)" }}>
                    {integration.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {integration.fields.map((f) => (
                      <span key={f} className="font-mono text-[10px] px-2 py-0.5 rounded" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}>
                        {f}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {integration.actions.map((action) => (
                      <Button
                        key={action}
                        variant={action === integration.actions[0] ? "secondary" : "ghost"}
                        size="sm"
                        icon={action.includes("Sync") ? <RefreshCw size={12} /> : action.includes("Configure") ? <Zap size={12} /> : undefined}
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
