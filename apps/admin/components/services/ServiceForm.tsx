"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { slugify } from "@apt/types";

export interface ServiceFormData {
  title:        string;
  slug:         string;
  description:  string;
  section:      string;
  iconName:     string;
  displayOrder: number;
  status:       string;
}

interface Props {
  initial?: Partial<ServiceFormData>;
  serviceId?: string;
}

export const SECTION_OPTIONS = [
  { value: "pillars",      label: "Three Pillars (Service Excellence cards)" },
  { value: "technical",    label: "Technical Assistance & Training cards" },
  { value: "what-we-offer",label: "What We Offer (Full Service Promise)" },
  { value: "pre-sales",    label: "Pre-Sales Consulting (bullet points)" },
  { value: "assembly",     label: "Customised Assembly (feature items)" },
];

export const SECTION_LABELS: Record<string, string> = {
  "pillars":       "Three Pillars",
  "technical":     "Technical Assistance",
  "what-we-offer": "What We Offer",
  "pre-sales":     "Pre-Sales",
  "assembly":      "Assembly",
};

// Lucide icons available for service cards
export const ICON_OPTIONS = [
  { value: "",              label: "— None —" },
  { value: "Shield",        label: "Shield" },
  { value: "RefreshCw",     label: "Refresh / Upgrade" },
  { value: "Globe2",        label: "Globe / Partnerships" },
  { value: "Wrench",        label: "Wrench / Commissioning" },
  { value: "Settings2",     label: "Settings / Repair" },
  { value: "BarChart3",     label: "Bar Chart / Lifecycle" },
  { value: "GraduationCap", label: "Graduation Cap / Training" },
  { value: "Clock",         label: "Clock / Maintenance" },
  { value: "Bell",          label: "Bell / Emergency" },
  { value: "Zap",           label: "Zap / Automation" },
  { value: "Package",       label: "Package / Parts" },
  { value: "CheckCircle2",  label: "Check Circle / Quality" },
  { value: "Cpu",           label: "CPU / Controls" },
  { value: "Activity",      label: "Activity / Monitoring" },
  { value: "AlertCircle",   label: "Alert / Critical" },
  { value: "Users",         label: "Users / Team" },
  { value: "FileText",      label: "File / Documentation" },
];

const SECTION_HINTS: Record<string, string> = {
  "pillars":       "Title + description displayed as a card with icon. Icon recommended.",
  "technical":     "Title + description displayed as a card with icon. Icon recommended.",
  "what-we-offer": "Title + description on dark background. No icon needed.",
  "pre-sales":     "Title only — displayed as a bullet point in the Pre-Sales section.",
  "assembly":      "Title (label) + description (detail) — displayed as a feature row with checkmark.",
};

export default function ServiceForm({ initial, serviceId }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isPending, setPending]   = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const [form, setForm] = useState<ServiceFormData>({
    title:        initial?.title        ?? "",
    slug:         initial?.slug         ?? "",
    description:  initial?.description  ?? "",
    section:      initial?.section      ?? "technical",
    iconName:     initial?.iconName     ?? "",
    displayOrder: initial?.displayOrder ?? 0,
    status:       initial?.status       ?? "active",
  });

  const set = <K extends keyof ServiceFormData>(k: K, v: ServiceFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const showIcon = form.section === "pillars" || form.section === "technical";
  const showDescription = form.section !== "pre-sales";

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.section)      { setError("Section is required."); return; }
    setError(null);
    setPending(true);
    try {
      const res = await fetch(serviceId ? `/api/services/${serviceId}` : "/api/services", {
        method: serviceId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setSaved(true);
      startTransition(() => { if (!serviceId) router.push("/dashboard/services"); });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setPending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/services/${serviceId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed");
      startTransition(() => router.push("/dashboard/services"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const sectionHint = SECTION_HINTS[form.section] ?? "";

  return (
    <div className="space-y-5">
      {error && (
        <div className="px-4 py-3 rounded-lg text-[13px]" style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      {/* Core details */}
      <div className="card p-5 space-y-4">
        <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Service Details</h2>

        <Select
          label="Section" required value={form.section}
          onChange={(e) => set("section", e.target.value)}
          options={SECTION_OPTIONS}
          hint={sectionHint}
        />

        <Input
          label={form.section === "pre-sales" ? "Bullet Text" : "Title"} required
          value={form.title}
          onChange={(e) => { set("title", e.target.value); if (!initial?.slug) set("slug", slugify(e.target.value)); }}
          placeholder={form.section === "pre-sales" ? "e.g. Site surveys and load calculations" : "e.g. Commissioning & Start-Up"}
        />

        <Input
          label="Slug" value={form.slug} hint="auto-generated from title"
          onChange={(e) => set("slug", e.target.value)}
        />

        {showDescription && (
          <Textarea
            label={form.section === "assembly" ? "Detail (sub-text)" : "Description"}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder={
              form.section === "assembly"
                ? "e.g. IEC-compliant assembly and testing at our Accra facility before delivery."
                : "Describe this service in 1-3 sentences…"
            }
            rows={3}
          />
        )}

        {showIcon && (
          <Select
            label="Icon" value={form.iconName}
            onChange={(e) => set("iconName", e.target.value)}
            options={ICON_OPTIONS}
            hint="Icon shown on the service card"
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Status" value={form.status}
            onChange={(e) => set("status", e.target.value)}
            options={[
              { value: "active",   label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
          <Input
            label="Display Order" type="number"
            value={String(form.displayOrder)}
            onChange={(e) => set("displayOrder", parseInt(e.target.value, 10) || 0)}
            hint="Lower = earlier"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Button
            variant="primary" size="md" loading={isPending}
            icon={saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
            onClick={handleSubmit}
          >
            {saved ? "Saved" : serviceId ? "Save Changes" : "Create Service"}
          </Button>
          <Button variant="secondary" size="md" onClick={() => router.back()}>Cancel</Button>
        </div>

        {serviceId && (
          <Button
            variant="ghost" size="md" loading={isDeleting}
            icon={<Trash2 size={14} />}
            onClick={handleDelete}
            style={{ color: confirmDelete ? "#dc2626" : undefined }}
          >
            {confirmDelete ? "Confirm Delete" : "Delete"}
          </Button>
        )}
      </div>
    </div>
  );
}
