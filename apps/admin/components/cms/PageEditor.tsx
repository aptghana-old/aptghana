"use client";

import { useState, useCallback } from "react";
import {
  Save, CheckCircle2, ChevronDown, ChevronUp, Plus, Trash2,
  Settings, AlignLeft, Hash, Phone, Clock, ExternalLink,
  ArrowUp, ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { EMAIL_PRIVACY, EMAIL_SALES, SITE_URL } from "@apt/config";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LegalSection { _id?: string; heading: string; body: string }
interface OfficeHour { day: string; hours: string }

export interface SitePageData {
  slug: string;
  pageType: "legal" | "contact";
  title: string;
  tagline: string;
  description: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
  contactBlockName: string;
  contactBlockEmail: string;
  contactBlockAddress: string;
  contactBlockFootnote: string;
  address: string;
  phone: string;
  email: string;
  mapsUrl: string;
  responseTime: string;
  officeHours: OfficeHour[];
  metaTitle: string;
  metaDescription: string;
  status: string;
}

// ─── Block card shell ─────────────────────────────────────────────────────────

interface BlockCardProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  preview: string;
  accent: string;
  expanded: boolean;
  onToggle: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
}

function BlockCard({
  label, icon, preview, accent, expanded, onToggle,
  onMoveUp, onMoveDown, onDelete, children,
}: BlockCardProps) {
  return (
    <div
      className="rounded-xl overflow-hidden transition-shadow"
      style={{
        border: "1px solid var(--apt-border)",
        background: "var(--apt-bg)",
        boxShadow: expanded ? "0 0 0 2px " + accent + "33" : undefined,
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{ borderBottom: expanded ? "1px solid var(--apt-border)" : undefined }}
      >
        {/* Accent stripe */}
        <span
          className="shrink-0 w-1 h-7 rounded-full"
          style={{ background: accent }}
        />
        {/* Icon */}
        <span style={{ color: accent }}>{icon}</span>
        {/* Label + preview */}
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
            {label}
          </div>
          {!expanded && (
            <div className="text-[13px] mt-0.5 truncate" style={{ color: "var(--apt-text-primary)" }}>
              {preview || <span style={{ color: "var(--apt-text-muted)", fontStyle: "italic" }}>Empty</span>}
            </div>
          )}
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {onMoveUp && (
            <button onClick={onMoveUp} className="p-1 rounded hover:bg-[var(--apt-bg-raised)] transition-colors" style={{ color: "var(--apt-text-muted)" }}>
              <ArrowUp size={12} />
            </button>
          )}
          {onMoveDown && (
            <button onClick={onMoveDown} className="p-1 rounded hover:bg-[var(--apt-bg-raised)] transition-colors" style={{ color: "var(--apt-text-muted)" }}>
              <ArrowDown size={12} />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
              <Trash2 size={12} />
            </button>
          )}
        </div>
        {/* Chevron */}
        <span style={{ color: "var(--apt-text-muted)" }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {/* Body */}
      {expanded && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

// ─── Main editor ─────────────────────────────────────────────────────────────

interface Props { initial: SitePageData }

export default function PageEditor({ initial }: Props) {
  const [ page, setPage ] = useState<SitePageData>(initial);
  const [ expanded, setExpanded ] = useState<Record<string, boolean>>({ settings: true });
  const [ saving, setSaving ] = useState(false);
  const [ saved, setSaved ] = useState(false);
  const [ error, setError ] = useState<string | null>(null);

  const set = useCallback(<K extends keyof SitePageData>(k: K, v: SitePageData[ K ]) =>
    setPage((p) => ({ ...p, [ k ]: v })), []);

  const toggle = (id: string) =>
    setExpanded((e) => ({ ...e, [ id ]: !e[ id ] }));

  // Sections CRUD
  const updateSection = (i: number, k: keyof LegalSection, v: string) =>
    setPage((p) => ({ ...p, sections: p.sections.map((s, idx) => idx === i ? { ...s, [ k ]: v } : s) }));

  const addSection = () => {
    setPage((p) => ({ ...p, sections: [ ...p.sections, { heading: "", body: "" } ] }));
    setExpanded((e) => ({ ...e, [ `sec-${page.sections.length}` ]: true }));
  };

  const removeSection = (i: number) =>
    setPage((p) => ({ ...p, sections: p.sections.filter((_, idx) => idx !== i) }));

  const moveSection = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= page.sections.length) return;
    setPage((p) => {
      const s = [ ...p.sections ];
      [ s[ i ], s[ j ] ] = [ s[ j ], s[ i ] ];
      return { ...p, sections: s };
    });
  };

  // Office hours CRUD
  const updateHour = (i: number, k: keyof OfficeHour, v: string) =>
    setPage((p) => ({ ...p, officeHours: p.officeHours.map((h, idx) => idx === i ? { ...h, [ k ]: v } : h) }));

  const addHour = () =>
    setPage((p) => ({ ...p, officeHours: [ ...p.officeHours, { day: "", hours: "" } ] }));

  const removeHour = (i: number) =>
    setPage((p) => ({ ...p, officeHours: p.officeHours.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/site-pages/${page.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(page),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const isLegal = page.pageType === "legal";
  const isContact = page.pageType === "contact";

  return (
    <div className="space-y-3">
      {/* Sticky save bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 rounded-xl"
        style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
            {page.title || "Untitled Page"}
          </span>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}>
            /{page.slug}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="text-[12px] text-red-500">{error}</span>}
          <a href={`${SITE_URL}/${page.slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" icon={<ExternalLink size={12} />}>Preview</Button>
          </a>
          <Button
            variant="primary" size="sm" loading={saving}
            icon={saved ? <CheckCircle2 size={13} /> : <Save size={13} />}
            onClick={handleSave}
          >
            {saved ? "Saved" : "Save Page"}
          </Button>
        </div>
      </div>

      {/* ── Block: Page Settings ─────────────────────────────────── */}
      <BlockCard
        id="settings" label="Page Settings" accent="#0057b8"
        icon={<Settings size={14} />}
        preview={page.metaTitle || page.title}
        expanded={!!expanded.settings}
        onToggle={() => toggle("settings")}
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Page Title (h1)" required value={page.title} wrapperClass="col-span-2"
            onChange={(e) => set("title", e.target.value)}
          />
          <Input
            label="Eyebrow / Tagline" value={page.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            hint="Small green text above the title"
          />
          {isLegal && (
            <Input
              label="Last Updated" value={page.lastUpdated}
              onChange={(e) => set("lastUpdated", e.target.value)}
              placeholder="e.g. 1 June 2025"
            />
          )}
          {isContact && (
            <Input
              label="Hero Description" value={page.description} wrapperClass="col-span-2"
              onChange={(e) => set("description", e.target.value)}
              placeholder="Subheading under the hero title"
            />
          )}
          <Select
            label="Status" value={page.status}
            onChange={(e) => set("status", e.target.value)}
            options={[
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
            ]}
          />
        </div>
        <div className="border-t pt-4" style={{ borderColor: "var(--apt-border)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--apt-text-muted)" }}>
            SEO Meta
          </p>
          <div className="space-y-3">
            <Input
              label="Meta Title" value={page.metaTitle}
              onChange={(e) => set("metaTitle", e.target.value)}
              hint={`${page.metaTitle.length}/60 chars`}
            />
            <Textarea
              label="Meta Description" value={page.metaDescription} rows={2}
              onChange={(e) => set("metaDescription", e.target.value)}
              hint={`${page.metaDescription.length}/160 chars`}
            />
          </div>
        </div>
      </BlockCard>

      {/* ── Block: Intro (legal only) ────────────────────────────── */}
      {isLegal && (
        <BlockCard
          id="intro" label="Introduction" accent="#84CC16"
          icon={<AlignLeft size={14} />}
          preview={page.intro.slice(0, 80)}
          expanded={!!expanded.intro}
          onToggle={() => toggle("intro")}
        >
          <Textarea
            label="Intro Paragraphs"
            value={page.intro} rows={6}
            onChange={(e) => set("intro", e.target.value)}
            hint="Shown at the top of the page. Use blank lines to separate paragraphs."
          />
        </BlockCard>
      )}

      {/* ── Contact info (contact only) ──────────────────────────── */}
      {isContact && (
        <BlockCard
          id="contact-info" label="Contact Information" accent="#84CC16"
          icon={<Phone size={14} />}
          preview={page.address.split(",")[ 0 ] || "No address set"}
          expanded={!!expanded[ "contact-info" ]}
          onToggle={() => toggle("contact-info")}
        >
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Address" value={page.address} rows={2} wrapperClass="col-span-2"
              onChange={(e) => set("address", e.target.value)}
              placeholder="North Industrial Area, Plot 7 Block 5, Dadeban Street, Accra, Ghana"
            />
            <Input
              label="Phone" value={page.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+233 30 396 4346"
            />
            <Input
              label="Email" value={page.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder={EMAIL_SALES}
            />
            <Input
              label="Google Maps URL" value={page.mapsUrl} wrapperClass="col-span-2"
              onChange={(e) => set("mapsUrl", e.target.value)}
              hint="Paste the Google Maps link for the 'Open in Maps' button"
            />
            <Input
              label="Response Time Note" value={page.responseTime} wrapperClass="col-span-2"
              onChange={(e) => set("responseTime", e.target.value)}
              placeholder="We respond within 1 business day."
            />
          </div>
        </BlockCard>
      )}

      {/* ── Office hours (contact only) ──────────────────────────── */}
      {isContact && (
        <BlockCard
          id="office-hours" label="Office Hours" accent="#f59e0b"
          icon={<Clock size={14} />}
          preview={page.officeHours.map((h) => `${h.day}: ${h.hours}`).join(" · ").slice(0, 60)}
          expanded={!!expanded[ "office-hours" ]}
          onToggle={() => toggle("office-hours")}
        >
          <div className="space-y-2">
            {page.officeHours.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className="h-8 px-2 rounded-md text-[13px] flex-1"
                  style={{ background: "var(--apt-bg-raised)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
                  value={h.day}
                  onChange={(e) => updateHour(i, "day", e.target.value)}
                  placeholder="Monday – Friday"
                />
                <input
                  className="h-8 px-2 rounded-md text-[13px] w-36"
                  style={{ background: "var(--apt-bg-raised)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
                  value={h.hours}
                  onChange={(e) => updateHour(i, "hours", e.target.value)}
                  placeholder="08:00 – 17:00"
                />
                <button
                  onClick={() => removeHour(i)}
                  className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addHour}
            className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
            style={{ color: "var(--apt-text-muted)", border: "1px dashed var(--apt-border)" }}
          >
            <Plus size={12} /> Add Row
          </button>
        </BlockCard>
      )}

      {/* ── Numbered sections (legal only) ──────────────────────── */}
      {isLegal && (
        <>
          {page.sections.map((sec, i) => (
            <BlockCard
              key={i}
              id={`sec-${i}`}
              label={`Section ${i + 1}`}
              accent="#64748b"
              icon={<Hash size={14} />}
              preview={sec.heading || "Untitled section"}
              expanded={!!expanded[ `sec-${i}` ]}
              onToggle={() => toggle(`sec-${i}`)}
              onMoveUp={i > 0 ? () => moveSection(i, -1) : undefined}
              onMoveDown={i < page.sections.length - 1 ? () => moveSection(i, 1) : undefined}
              onDelete={() => removeSection(i)}
            >
              <Input
                label="Heading"
                value={sec.heading}
                onChange={(e) => updateSection(i, "heading", e.target.value)}
                placeholder="e.g. 1. Data We Collect"
              />
              <Textarea
                label="Body Text"
                value={sec.body}
                onChange={(e) => updateSection(i, "body", e.target.value)}
                rows={8}
                hint="Use bullet points with '• ' prefix. Separate paragraphs with blank lines."
              />
            </BlockCard>
          ))}

          <button
            onClick={addSection}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-medium transition-colors"
            style={{
              border: "2px dashed var(--apt-border)",
              color: "var(--apt-text-muted)",
            }}
          >
            <Plus size={14} /> Add Section
          </button>
        </>
      )}

      {/* ── Contact / DPO block (legal only) ─────────────────────── */}
      {isLegal && (
        <BlockCard
          id="contact-block" label="DPO / Contact Block" accent="#7c3aed"
          icon={<Phone size={14} />}
          preview={page.contactBlockName || "No contact set"}
          expanded={!!expanded[ "contact-block" ]}
          onToggle={() => toggle("contact-block")}
        >
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name / Role" value={page.contactBlockName} wrapperClass="col-span-2"
              onChange={(e) => set("contactBlockName", e.target.value)}
              placeholder="Data Protection Officer, APT Ghana Limited"
            />
            <Input
              label="Email" value={page.contactBlockEmail}
              onChange={(e) => set("contactBlockEmail", e.target.value)}
              placeholder={EMAIL_PRIVACY}
            />
            <Input
              label="Address" value={page.contactBlockAddress}
              onChange={(e) => set("contactBlockAddress", e.target.value)}
              placeholder="North Industrial Area…"
            />
            <Textarea
              label="Footnote" value={page.contactBlockFootnote} rows={2} wrapperClass="col-span-2"
              onChange={(e) => set("contactBlockFootnote", e.target.value)}
              hint="Shown at the bottom of the dark block — last updated notice, etc."
            />
          </div>
        </BlockCard>
      )}
    </div>
  );
}
