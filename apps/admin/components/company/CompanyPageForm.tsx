"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle2, Plus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { slugify } from "@apt/types";

interface Section { heading: string; body: string }

export interface CompanyPageFormData {
  title:           string;
  slug:            string;
  tagline:         string;
  icon:            string;
  cardDescription: string;
  intro:           string;
  sections:        Section[];
  ctaLabel:        string;
  ctaHref:         string;
  displayOrder:    number;
  status:          string;
}

interface Props {
  initial?: Partial<CompanyPageFormData>;
  pageId?: string;
}

export default function CompanyPageForm({ initial, pageId }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isPending, setPending]         = useState(false);
  const [isDeleting, setDeleting]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saved, setSaved]               = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const [form, setForm] = useState<CompanyPageFormData>({
    title:           initial?.title           ?? "",
    slug:            initial?.slug            ?? "",
    tagline:         initial?.tagline         ?? "",
    icon:            initial?.icon            ?? "",
    cardDescription: initial?.cardDescription ?? "",
    intro:           initial?.intro           ?? "",
    sections:        initial?.sections        ?? [{ heading: "", body: "" }],
    ctaLabel:        initial?.ctaLabel        ?? "Get in Touch",
    ctaHref:         initial?.ctaHref         ?? "/contact",
    displayOrder:    initial?.displayOrder    ?? 0,
    status:          initial?.status          ?? "active",
  });

  const set = <K extends keyof CompanyPageFormData>(k: K, v: CompanyPageFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Section helpers
  const updateSection = (idx: number, key: keyof Section, val: string) =>
    setForm((f) => {
      const sections = f.sections.map((s, i) => i === idx ? { ...s, [key]: val } : s);
      return { ...f, sections };
    });

  const addSection    = () => setForm((f) => ({ ...f, sections: [...f.sections, { heading: "", body: "" }] }));
  const removeSection = (idx: number) =>
    setForm((f) => ({ ...f, sections: f.sections.filter((_, i) => i !== idx) }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setError(null);
    setPending(true);
    try {
      const payload = {
        ...form,
        sections: form.sections.filter((s) => s.heading.trim()),
      };
      const res = await fetch(pageId ? `/api/company/pages/${pageId}` : "/api/company/pages", {
        method: pageId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setSaved(true);
      startTransition(() => { if (!pageId) router.push("/dashboard/company"); });
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
      const res = await fetch(`/api/company/pages/${pageId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed");
      startTransition(() => router.push("/dashboard/company"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="px-4 py-3 rounded-lg text-[13px]" style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      {/* Identity */}
      <div className="card p-5 space-y-4">
        <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Page Identity</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Title" required value={form.title} wrapperClass="col-span-2"
            onChange={(e) => { set("title", e.target.value); if (!initial?.slug) set("slug", slugify(e.target.value)); }}
            placeholder="e.g. About APT Ghana"
          />
          <Input
            label="Slug" value={form.slug} hint="Used in URL: /company/{slug}"
            onChange={(e) => set("slug", e.target.value)}
          />
          <Input
            label="Icon (emoji)" value={form.icon}
            onChange={(e) => set("icon", e.target.value)}
            placeholder="🏢"
            hint="Shown on the /company index card"
          />
          <Input
            label="Tagline" value={form.tagline} wrapperClass="col-span-2"
            onChange={(e) => set("tagline", e.target.value)}
            placeholder="e.g. 15+ Years of Industrial Excellence"
          />
        </div>
        <Textarea
          label="Card Description"
          value={form.cardDescription}
          onChange={(e) => set("cardDescription", e.target.value)}
          placeholder="Short description shown on the /company index page card…"
          rows={2}
          hint="Shown on the /company index navigation cards"
        />
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
            hint="Lower = earlier in list"
          />
        </div>
      </div>

      {/* Intro paragraph */}
      <div className="card p-5">
        <h2 className="text-[14px] font-semibold mb-4" style={{ color: "var(--apt-text-primary)" }}>
          Introduction Paragraph
        </h2>
        <Textarea
          label="Intro Text"
          value={form.intro}
          onChange={(e) => set("intro", e.target.value)}
          placeholder="Opening paragraph shown at the top of the sub-page…"
          rows={4}
        />
      </div>

      {/* Detail sections */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
              Detail Sections
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
              Each section becomes a card on the sub-page (heading + body text)
            </p>
          </div>
          <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={addSection}>
            Add Section
          </Button>
        </div>

        {form.sections.length === 0 && (
          <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
            No sections yet. Click "Add Section" to get started.
          </p>
        )}

        <div className="space-y-4">
          {form.sections.map((sec, i) => (
            <div
              key={i}
              className="rounded-xl p-4 space-y-3"
              style={{ background: "var(--apt-bg-raised)", border: "1px solid var(--apt-border)" }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--apt-text-muted)" }}
                >
                  Section {i + 1}
                </span>
                <button
                  onClick={() => removeSection(i)}
                  className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
              <Input
                label="Heading"
                value={sec.heading}
                onChange={(e) => updateSection(i, "heading", e.target.value)}
                placeholder="e.g. Our Mission"
              />
              <Textarea
                label="Body Text"
                value={sec.body}
                onChange={(e) => updateSection(i, "body", e.target.value)}
                placeholder="Paragraph content for this section…"
                rows={3}
              />
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="card p-5 space-y-4">
        <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
          Call to Action
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Button Label" value={form.ctaLabel}
            onChange={(e) => set("ctaLabel", e.target.value)}
            placeholder="e.g. Contact Our Team"
          />
          <Input
            label="Button URL" value={form.ctaHref}
            onChange={(e) => set("ctaHref", e.target.value)}
            placeholder="/contact or mailto:…"
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
            {saved ? "Saved" : pageId ? "Save Changes" : "Create Page"}
          </Button>
          <Button variant="secondary" size="md" onClick={() => router.back()}>Cancel</Button>
        </div>

        {pageId && (
          <Button
            variant="ghost" size="md" loading={isDeleting}
            icon={<Trash2 size={14} />}
            onClick={handleDelete}
            style={{ color: confirmDelete ? "#dc2626" : undefined }}
          >
            {confirmDelete ? "Confirm Delete" : "Delete Page"}
          </Button>
        )}
      </div>
    </div>
  );
}
