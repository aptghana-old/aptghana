import type { Metadata } from "next";
import { STORE_URL } from "@apt/config";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/analytics/primitives";
import IntegrationsBoard from "@/components/integrations/IntegrationsBoard";
import { getIntegrationsRuntime } from "@/lib/integrations";

export const metadata: Metadata = { title: "Integrations" };

export default function IntegrationsPage() {
  const integrations = getIntegrationsRuntime();

  const configured = integrations.filter((it) => it.status === "configured").length;
  const needsAttention = integrations.filter((it) => it.status !== "configured").length;
  const fieldsSet = integrations.reduce((sum, it) => sum + it.fieldsSet, 0);
  const fieldsTotal = integrations.reduce((sum, it) => sum + it.fieldsTotal, 0);

  const webhookUrl = `${STORE_URL}/api/payments/webhook`;
  const webhookSecretConfigured = !!process.env.PAYSTACK_WEBHOOK_SECRET?.trim();

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="External services & APIs connected to the APT Ghana platform"
      />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatCard label="Configured" value={String(configured)} accent="#12B76A" />
          <StatCard label="Needs Attention" value={String(needsAttention)} accent="#D97706" />
          <StatCard label="Total Integrations" value={String(integrations.length)} accent="#2A6FDB" />
          <StatCard label="Required Fields Set" value={`${fieldsSet}/${fieldsTotal}`} accent="#7C3AED" />
        </div>

        <IntegrationsBoard
          integrations={integrations}
          webhookUrl={webhookUrl}
          webhookSecretConfigured={webhookSecretConfigured}
        />
      </div>
    </div>
  );
}
