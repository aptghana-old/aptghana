"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Zap, Activity, Copy, Check, Webhook } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { IntegrationRuntime } from "@/lib/integrations";

const STATUS_META: Record<IntegrationRuntime["status"], { label: string; variant: "active" | "pending" | "inactive" }> = {
  configured: { label: "Configured", variant: "active" },
  partial: { label: "Partial setup", variant: "pending" },
  pending: { label: "Not configured", variant: "inactive" },
};

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: "#0C1017" }}>
      <span className="flex-1 min-w-0 truncate font-mono text-[11px]" style={{ color: "#12B76A" }}>
        {value}
      </span>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        aria-label="Copy webhook URL"
        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors"
        style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </div>
  );
}

function IntegrationCard({ it }: { it: IntegrationRuntime }) {
  const meta = STATUS_META[it.status];
  const configured = it.status === "configured";
  return (
    <div className="card p-5" style={{ opacity: it.status === "pending" ? 0.85 : 1 }}>
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-[15px] font-extrabold shrink-0"
          style={{ background: it.tint, color: it.fg, letterSpacing: "-0.5px" }}
        >
          {it.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-[15px] font-bold tracking-tight" style={{ color: "var(--apt-text-primary)" }}>
              {it.name}
            </h3>
            <span
              className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: it.tint, color: it.fg }}
            >
              {it.category}
            </span>
            <Badge variant={meta.variant} dot>{meta.label}</Badge>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed max-w-[560px]" style={{ color: "var(--apt-text-secondary)" }}>
            {it.description}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {it.fields.map((f) => {
              const missing = it.missingRequired.includes(f.key);
              return (
                <span
                  key={f.key}
                  className="font-mono text-[10px] px-2 py-0.5 rounded"
                  style={
                    missing
                      ? { background: "var(--color-warning-50)", color: "var(--color-warning-700)" }
                      : { background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }
                  }
                  title={missing ? "Required — not set" : "Set"}
                >
                  {f.key}
                </span>
              );
            })}
          </div>
        </div>
        <div
          title={configured ? "All required fields configured" : "Reflects configuration status — not a live control"}
          className="w-[38px] h-[22px] rounded-full relative shrink-0"
          style={{ background: configured ? "var(--color-success-500)" : "var(--apt-border-strong)" }}
        >
          <span
            className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all"
            style={{ left: configured ? "18px" : "2px" }}
          />
        </div>
      </div>

      <div className="flex items-center gap-6 mt-4 pt-3.5 flex-wrap" style={{ borderTop: "1px solid var(--apt-border)" }}>
        <div className="leading-tight">
          <div className="text-[10.5px] font-mono tracking-wide" style={{ color: "var(--apt-text-muted)" }}>VERSION</div>
          <div className="text-[12.5px] font-semibold mt-0.5" style={{ color: "var(--apt-text-primary)" }}>{it.version}</div>
        </div>
        <div className="leading-tight">
          <div className="text-[10.5px] font-mono tracking-wide" style={{ color: "var(--apt-text-muted)" }}>REQUIRED FIELDS</div>
          <div className="text-[12.5px] font-semibold mt-0.5 font-mono" style={{ color: "var(--apt-text-primary)" }}>
            {it.fieldsSet}/{it.fieldsTotal} set
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {it.actions[1] && (
            <Button variant="secondary" size="sm">{it.actions[1]}</Button>
          )}
          <Button variant="primary" size="sm" icon={it.actions[0].includes("Sync") || it.actions[0].includes("Reindex") ? <RefreshCw size={12} /> : <Zap size={12} />}>
            {it.actions[0]}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsBoard({
  integrations,
  webhookUrl,
  webhookSecretConfigured,
}: {
  integrations: IntegrationRuntime[];
  webhookUrl: string;
  webhookSecretConfigured: boolean;
}) {
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of integrations) counts.set(it.category, (counts.get(it.category) ?? 0) + 1);
    return Array.from(counts.entries());
  }, [integrations]);

  const [category, setCategory] = useState<string | null>(null);
  const visible = category ? integrations.filter((it) => it.category === category) : integrations;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.72fr_1fr] gap-4">
      <div className="flex flex-col gap-3.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCategory(null)}
            className="text-[12px] font-semibold px-3 py-1.5 rounded-full transition-colors"
            style={
              category === null
                ? { background: "var(--apt-text-primary)", color: "var(--apt-text-inverse)" }
                : { background: "var(--apt-bg)", border: "1px solid var(--apt-border)", color: "var(--apt-text-secondary)" }
            }
          >
            All · {integrations.length}
          </button>
          {categories.map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-full transition-colors"
              style={
                category === cat
                  ? { background: "var(--apt-text-primary)", color: "var(--apt-text-inverse)" }
                  : { background: "var(--apt-bg)", border: "1px solid var(--apt-border)", color: "var(--apt-text-secondary)" }
              }
            >
              {cat} · {count}
            </button>
          ))}
        </div>

        {visible.map((it) => <IntegrationCard key={it.id} it={it} />)}
      </div>

      <div className="flex flex-col gap-4">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--apt-border)" }}>
            <h3 className="text-[13.5px] font-bold" style={{ color: "var(--apt-text-primary)" }}>Sync &amp; Webhook Activity</h3>
            <Badge variant="default">Not tracked</Badge>
          </div>
          <div className="flex flex-col items-center text-center gap-2 px-6 py-9">
            <Activity size={20} style={{ color: "var(--apt-text-muted)" }} />
            <p className="text-[12.5px]" style={{ color: "var(--apt-text-secondary)" }}>
              Sync and webhook event logging isn&apos;t wired up yet.
            </p>
            <p className="text-[11.5px]" style={{ color: "var(--apt-text-muted)" }}>
              Events will appear here once activity logging ships.
            </p>
          </div>
        </div>

        <div className="card p-4.5">
          <div className="flex items-center gap-2 mb-1">
            <Webhook size={14} style={{ color: "var(--apt-text-primary)" }} />
            <h3 className="text-[13px] font-bold" style={{ color: "var(--apt-text-primary)" }}>Webhook Endpoint</h3>
          </div>
          <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--apt-text-muted)" }}>
            Paystack posts payment events here to confirm orders server-side.
          </p>
          <CopyField value={webhookUrl} />
          <div className="flex items-center justify-between mt-3.5 pt-3" style={{ borderTop: "1px solid var(--apt-border)" }}>
            <span className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>Signing secret</span>
            <Badge variant={webhookSecretConfigured ? "active" : "pending"}>
              {webhookSecretConfigured ? "Configured" : "Not configured"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
