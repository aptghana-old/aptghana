"use client";

import { useState, useTransition } from "react";
import { Alert, PageHeader, PrimaryBtn, SectionCard, Toggle } from "@/components/account/ui";

interface Pref { id: string; label: string; desc: string; defaultOn: boolean }

export const NOTIFICATION_SECTIONS: { section: string; items: Pref[] }[] = [
  {
    section: "Orders & Quotes",
    items: [
      { id: "order_confirmed",  label: "Order Confirmed",         desc: "When your order is confirmed and accepted.",                  defaultOn: true },
      { id: "order_shipped",    label: "Order Shipped",           desc: "When your order ships with tracking information.",            defaultOn: true },
      { id: "order_delivered",  label: "Order Delivered",         desc: "When your order is marked as delivered.",                     defaultOn: true },
      { id: "quote_ready",      label: "Quote Ready",             desc: "When a quotation is prepared for your request.",              defaultOn: true },
      { id: "quote_expiring",   label: "Quote Expiring Soon",     desc: "Reminder before a quotation expires.",                        defaultOn: true },
    ],
  },
  {
    section: "Account & Security",
    items: [
      { id: "signin_alert",     label: "Sign-In Alerts",          desc: "Notify me of sign-ins from new devices or locations.",        defaultOn: true },
      { id: "password_changed", label: "Password Changed",        desc: "Alert when your password is changed.",                        defaultOn: true },
      { id: "two_fa_changed",   label: "2FA Status Changes",      desc: "Alert when two-factor authentication is enabled or disabled.", defaultOn: true },
    ],
  },
  {
    section: "Marketing",
    items: [
      { id: "product_updates",  label: "New Products & Arrivals", desc: "Be first to know about new products in your categories.",    defaultOn: false },
      { id: "promotions",       label: "Offers & Promotions",     desc: "Special deals, seasonal discounts, and bundle offers.",      defaultOn: false },
      { id: "newsletters",      label: "APT Ghana Newsletter",    desc: "Monthly updates on industry news and technical articles.",   defaultOn: false },
    ],
  },
];

export default function NotificationsForm({ initial }: { initial: Record<string, boolean> }) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      NOTIFICATION_SECTIONS.flatMap((s) =>
        s.items.map((p) => [p.id, initial[p.id] ?? p.defaultOn])
      )
    )
  );
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setResult(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationPrefs: prefs }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to save preferences");
        setResult({ ok: true, msg: "Notification preferences saved." });
      } catch (err) {
        setResult({ ok: false, msg: err instanceof Error ? err.message : "Something went wrong." });
      }
    });
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <PageHeader
        title="Notifications"
        subtitle="Choose how and when APT Ghana contacts you."
        action={<PrimaryBtn type="button" onClick={handleSave} loading={isPending} variant="navy">Save Preferences</PrimaryBtn>}
      />

      {result && <Alert type={result.ok ? "success" : "error"} message={result.msg} />}

      {NOTIFICATION_SECTIONS.map((section) => (
        <SectionCard key={section.section} title={section.section}>
          <div className="space-y-5">
            {section.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-(--text-1)">{item.label}</p>
                  <p className="text-xs text-(--text-3) mt-0.5">{item.desc}</p>
                </div>
                <Toggle
                  checked={prefs[item.id] ?? false}
                  onChange={(v) => setPrefs((p) => ({ ...p, [item.id]: v }))}
                  label={item.label}
                />
              </div>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}
