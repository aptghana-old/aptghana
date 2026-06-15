"use client";

import { useState } from "react";
import { Settings, Shield, Bell, Globe, Palette, Save, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { EMAIL_HELLO, EMAIL_SUPPORT } from "@apt/config";

const TABS = [
  { id: "general",       label: "General",       icon: <Settings size={14} /> },
  { id: "regional",      label: "Regional",      icon: <Globe size={14} /> },
  { id: "security",      label: "Security",      icon: <Shield size={14} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={14} /> },
  { id: "appearance",    label: "Appearance",    icon: <Palette size={14} /> },
];

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-6 py-5" style={{ borderBottom: "1px solid var(--apt-border)" }}>
      <div className="w-64 shrink-0">
        <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>{label}</div>
        {description && <div className="text-[11px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>{description}</div>}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
      style={{ background: checked ? "#0057b8" : "var(--apt-bg-raised)" }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);

  const [general, setGeneral] = useState({
    storeName: "APT Ghana",
    storeEmail: EMAIL_HELLO,
    supportEmail: EMAIL_SUPPORT,
    phone: "+233 30 295 0000",
  });

  const [regional, setRegional] = useState({
    currency: "GHS",
    timezone: "Africa/Accra",
    dateFormat: "DD/MM/YYYY",
    weightUnit: "kg",
  });

  const [security, setSecurity] = useState({
    requireMfa: false,
    sessionTimeout: "8h",
    auditAll: true,
  });

  const [notifications, setNotifications] = useState({
    newOrder: true,
    newQuote: true,
    lowStock: true,
    newUser: false,
    failedPayment: true,
  });

  const [appearance, setAppearance] = useState({
    defaultTheme: "light",
    accentColor: "#0057b8",
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Platform configuration for APT Ghana admin."
        actions={
          <Button
            variant="primary" size="sm"
            icon={saved ? <CheckCircle2 size={13} /> : <Save size={13} />}
            onClick={handleSave}
          >
            {saved ? "Saved" : "Save Changes"}
          </Button>
        }
      />

      <div className="flex">
        {/* Tab sidebar */}
        <div className="w-52 shrink-0 p-4 space-y-0.5" style={{ borderRight: "1px solid var(--apt-border)", minHeight: "calc(100vh - 113px)" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors text-left"
              style={{
                background: activeTab === tab.id ? "var(--apt-bg-raised)" : "transparent",
                color: activeTab === tab.id ? "var(--apt-text-primary)" : "var(--apt-text-muted)",
                fontWeight: activeTab === tab.id ? 500 : 400,
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings content */}
        <div className="flex-1 p-6 max-w-3xl">

          {activeTab === "general" && (
            <div className="card p-0 overflow-hidden">
              <div className="card-header">
                <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>General Settings</h2>
              </div>
              <div className="px-6">
                <SettingRow label="Store Name" description="Displayed in emails and the admin header.">
                  <Input value={general.storeName} onChange={(e) => setGeneral({ ...general, storeName: e.target.value })} />
                </SettingRow>
                <SettingRow label="Store Email" description="Primary email for customer-facing communication.">
                  <Input type="email" value={general.storeEmail} onChange={(e) => setGeneral({ ...general, storeEmail: e.target.value })} />
                </SettingRow>
                <SettingRow label="Support Email" description="Displayed on order confirmations and error pages.">
                  <Input type="email" value={general.supportEmail} onChange={(e) => setGeneral({ ...general, supportEmail: e.target.value })} />
                </SettingRow>
                <SettingRow label="Phone Number" description="Contact number shown on invoices.">
                  <Input value={general.phone} onChange={(e) => setGeneral({ ...general, phone: e.target.value })} />
                </SettingRow>
              </div>
            </div>
          )}

          {activeTab === "regional" && (
            <div className="card p-0 overflow-hidden">
              <div className="card-header">
                <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Regional & Localisation</h2>
              </div>
              <div className="px-6">
                <SettingRow label="Currency" description="Default currency for pricing and invoices.">
                  <Select
                    value={regional.currency}
                    onChange={(e) => setRegional({ ...regional, currency: e.target.value })}
                    options={[
                      { value: "GHS", label: "GHS — Ghana Cedi" },
                      { value: "USD", label: "USD — US Dollar" },
                      { value: "EUR", label: "EUR — Euro" },
                    ]}
                  />
                </SettingRow>
                <SettingRow label="Timezone" description="Used for order timestamps and reports.">
                  <Select
                    value={regional.timezone}
                    onChange={(e) => setRegional({ ...regional, timezone: e.target.value })}
                    options={[
                      { value: "Africa/Accra", label: "Africa/Accra (GMT+0)" },
                      { value: "Africa/Lagos", label: "Africa/Lagos (GMT+1)" },
                      { value: "Europe/London", label: "Europe/London" },
                    ]}
                  />
                </SettingRow>
                <SettingRow label="Date Format">
                  <Select
                    value={regional.dateFormat}
                    onChange={(e) => setRegional({ ...regional, dateFormat: e.target.value })}
                    options={[
                      { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                      { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                      { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
                    ]}
                  />
                </SettingRow>
                <SettingRow label="Weight Unit">
                  <Select
                    value={regional.weightUnit}
                    onChange={(e) => setRegional({ ...regional, weightUnit: e.target.value })}
                    options={[
                      { value: "kg", label: "Kilograms (kg)" },
                      { value: "lb", label: "Pounds (lb)" },
                    ]}
                  />
                </SettingRow>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="card p-0 overflow-hidden">
              <div className="card-header">
                <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Security</h2>
              </div>
              <div className="px-6">
                <SettingRow label="Require MFA" description="Enforce two-factor authentication for all admin users.">
                  <Toggle checked={security.requireMfa} onChange={(v) => setSecurity({ ...security, requireMfa: v })} />
                </SettingRow>
                <SettingRow label="Session Timeout" description="Auto-logout after inactivity.">
                  <Select
                    value={security.sessionTimeout}
                    onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                    options={[
                      { value: "1h", label: "1 hour" },
                      { value: "8h", label: "8 hours" },
                      { value: "24h", label: "24 hours" },
                      { value: "never", label: "Never" },
                    ]}
                  />
                </SettingRow>
                <SettingRow label="Audit All Actions" description="Write every admin action to the audit log.">
                  <Toggle checked={security.auditAll} onChange={(v) => setSecurity({ ...security, auditAll: v })} />
                </SettingRow>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="card p-0 overflow-hidden">
              <div className="card-header">
                <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Email Notifications</h2>
              </div>
              <div className="px-6">
                {[
                  { key: "newOrder", label: "New Order Placed", description: "Notify when a new order is received." },
                  { key: "newQuote", label: "New Quote / RFQ", description: "Notify when a customer submits an RFQ." },
                  { key: "lowStock", label: "Low Stock Alert", description: "Notify when a product drops below reorder threshold." },
                  { key: "newUser", label: "New User Registration", description: "Notify when a new customer account is created." },
                  { key: "failedPayment", label: "Failed Payment", description: "Notify when a payment attempt fails." },
                ].map(({ key, label, description }) => (
                  <SettingRow key={key} label={label} description={description}>
                    <Toggle
                      checked={notifications[key as keyof typeof notifications]}
                      onChange={(v) => setNotifications({ ...notifications, [key]: v })}
                    />
                  </SettingRow>
                ))}
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="card p-0 overflow-hidden">
              <div className="card-header">
                <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Appearance</h2>
              </div>
              <div className="px-6">
                <SettingRow label="Default Theme" description="Default theme for new admin sessions.">
                  <Select
                    value={appearance.defaultTheme}
                    onChange={(e) => setAppearance({ ...appearance, defaultTheme: e.target.value })}
                    options={[
                      { value: "light", label: "Light" },
                      { value: "dark", label: "Dark" },
                      { value: "system", label: "Follow system preference" },
                    ]}
                  />
                </SettingRow>
                <SettingRow label="Accent Color" description="Primary action color across the admin UI.">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={appearance.accentColor}
                      onChange={(e) => setAppearance({ ...appearance, accentColor: e.target.value })}
                      className="w-10 h-8 rounded border cursor-pointer p-0.5"
                      style={{ borderColor: "var(--apt-border)" }}
                    />
                    <span className="font-mono text-[13px]" style={{ color: "var(--apt-text-muted)" }}>{appearance.accentColor}</span>
                  </div>
                </SettingRow>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
