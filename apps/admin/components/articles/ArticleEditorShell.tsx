"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save, CheckCircle2, Eye, Trash2, Loader2, ChevronLeft, X, Plus, Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/Tabs";
import { MediaPicker } from "@/components/media/MediaPicker";
import type { Asset } from "@/components/media/types";
import { SITE_URL } from "@apt/config";
import RichTextEditor from "./RichTextEditor";
import TagInput from "./TagInput";
import type { ArticleAnalytics } from "@/lib/articleAnalytics";

export interface MediaRef { url: string; alt?: string }
export interface VideoRef { [ key: string ]: string | undefined; url: string; title?: string }
export interface AttachmentRef { [ key: string ]: string | undefined; name: string; url: string }

export interface ArticleFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: string;
  publishDate: string; // yyyy-mm-dd
  category: string;
  tags: string[];
  featured: boolean;
  authorName: string;
  readingTimeMinutes: number;
  canonicalUrl: string;
  featuredImage: MediaRef | null;
  gallery: MediaRef[];
  videos: VideoRef[];
  attachments: AttachmentRef[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  ogImage: string;
}

interface Props {
  articleId: string;
  initial: ArticleFormData;
  canEdit: boolean;
  analytics: ArticleAnalytics;
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "Review" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default function ArticleEditorShell({ articleId, initial, canEdit, analytics }: Props) {
  const router = useRouter();
  const [ form, setForm ] = useState<ArticleFormData>(initial);
  const [ saving, setSaving ] = useState(false);
  const [ saved, setSaved ] = useState(false);
  const [ error, setError ] = useState<string | null>(null);
  const [ deleting, setDeleting ] = useState(false);
  const [ pickerFor, setPickerFor ] = useState<"featured" | "gallery" | "og" | null>(null);

  const set = <K extends keyof ArticleFormData>(k: K, v: ArticleFormData[ K ]) => { setForm((f) => ({ ...f, [ k ]: v })); setSaved(false); };

  async function save(overrides: Partial<ArticleFormData> = {}) {
    setSaving(true);
    setError(null);
    const payload = { ...form, ...overrides };
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Save failed"); return; }
      setForm((f) => ({ ...f, ...overrides }));
      setSaved(true);
      router.refresh();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${form.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/articles/${articleId}`, { method: "DELETE" });
      if (res.ok) router.push("/dashboard/articles");
      else setError("Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  function handlePicked(assets: Asset[]) {
    if (pickerFor === "featured" && assets[ 0 ]) {
      set("featuredImage", { url: assets[ 0 ].url, alt: assets[ 0 ].altText ?? assets[ 0 ].filename ?? "" });
    } else if (pickerFor === "gallery") {
      set("gallery", [ ...form.gallery, ...assets.map((a) => ({ url: a.url, alt: a.altText ?? a.filename ?? "" })) ]);
    } else if (pickerFor === "og" && assets[ 0 ]) {
      set("ogImage", assets[ 0 ].url);
    }
    setPickerFor(null);
  }

  const canPreview = form.status === "published" || form.status === "scheduled";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 flex-wrap" style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}>
        <Link href="/dashboard/articles"><Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Articles</Button></Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold truncate max-w-md" style={{ color: "var(--apt-text-primary)" }}>{form.title || "Untitled article"}</h1>
        <Badge variant={statusVariant(form.status)} dot>{form.status}</Badge>

        <div className="ml-auto flex items-center gap-2">
          {error && <span className="text-[12px] text-[#dc2626]">{error}</span>}
          {saved && !saving && <span className="flex items-center gap-1 text-[12px]" style={{ color: "#15803d" }}><CheckCircle2 size={13} /> Saved</span>}
          {canEdit && (
            <>
              <a
                href={canPreview ? `${SITE_URL}/articles/${form.slug}` : undefined}
                target="_blank" rel="noopener noreferrer"
                aria-disabled={!canPreview}
                onClick={(e) => { if (!canPreview) e.preventDefault(); }}
                style={{ opacity: canPreview ? 1 : 0.5, pointerEvents: canPreview ? "auto" : "none" }}
              >
                <Button variant="secondary" size="sm" icon={<Eye size={13} />}>Preview</Button>
              </a>
              <Button variant="secondary" size="sm" icon={saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} onClick={() => save({ status: form.status === "published" ? "published" : "draft" })} disabled={saving}>
                Save Draft
              </Button>
              <Button variant="primary" size="sm" onClick={() => save({ status: "published", publishDate: form.publishDate || new Date().toISOString().slice(0, 10) })} disabled={saving}>
                Publish
              </Button>
              <Button variant="destructive" size="sm" icon={deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} onClick={handleDelete} disabled={deleting}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-4xl">
        <Tabs defaultValue="content">
          <TabList className="mb-5">
            <Tab value="content">Content</Tab>
            <Tab value="metadata">Metadata</Tab>
            <Tab value="seo">SEO</Tab>
            <Tab value="publishing">Publishing</Tab>
            <Tab value="analytics">Analytics</Tab>
          </TabList>

          {/* Content */}
          <TabPanel value="content">
            <div className="space-y-5">
              <div className="card p-5 space-y-4">
                <Input label="Title" required value={form.title} disabled={!canEdit} onChange={(e) => set("title", e.target.value)} placeholder="Article title" />
                <Input label="Slug" value={form.slug} disabled={!canEdit} onChange={(e) => set("slug", e.target.value)} hint="Used in the public URL" />
                <Textarea label="Excerpt" value={form.excerpt} disabled={!canEdit} onChange={(e) => set("excerpt", e.target.value)} placeholder="Short summary shown in listings and search results…" rows={2} />
              </div>

              <div className="card p-5">
                <h2 className="text-[14px] font-semibold mb-3" style={{ color: "var(--apt-text-primary)" }}>Content</h2>
                {canEdit ? (
                  <RichTextEditor value={form.content} onChange={(html) => set("content", html)} placeholder="Start writing the article…" />
                ) : (
                  <div className="article-editor-prose" dangerouslySetInnerHTML={{ __html: form.content }} />
                )}
              </div>

              <div className="card p-5">
                <h2 className="text-[14px] font-semibold mb-3" style={{ color: "var(--apt-text-primary)" }}>Featured Image</h2>
                {form.featuredImage?.url ? (
                  <div className="relative w-48 h-28 rounded-lg overflow-hidden border" style={{ borderColor: "var(--apt-border)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.featuredImage.url} alt={form.featuredImage.alt ?? ""} className="w-full h-full object-cover" />
                    {canEdit && (
                      <button onClick={() => set("featuredImage", null)} className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", color: "white" }}><X size={12} /></button>
                    )}
                  </div>
                ) : canEdit ? (
                  <Button variant="secondary" size="sm" icon={<ImageIcon size={13} />} onClick={() => setPickerFor("featured")}>Choose image</Button>
                ) : <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>No featured image.</p>}
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Gallery</h2>
                  {canEdit && <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => setPickerFor("gallery")}>Add images</Button>}
                </div>
                {form.gallery.length === 0 ? (
                  <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>No gallery images.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2.5">
                    {form.gallery.map((g, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border" style={{ borderColor: "var(--apt-border)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={g.url} alt={g.alt ?? ""} className="w-full h-full object-cover" />
                        {canEdit && (
                          <button onClick={() => set("gallery", form.gallery.filter((_, gi) => gi !== i))} className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", color: "white" }}><X size={10} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <ListEditor
                title="Videos"
                items={form.videos}
                canEdit={canEdit}
                onChange={(v) => set("videos", v)}
                fields={[ { key: "url", placeholder: "Video URL" }, { key: "title", placeholder: "Title (optional)" } ]}
                addLabel="Add video"
              />

              <ListEditor
                title="Attachments"
                items={form.attachments}
                canEdit={canEdit}
                onChange={(v) => set("attachments", v)}
                fields={[ { key: "name", placeholder: "File name" }, { key: "url", placeholder: "File URL" } ]}
                addLabel="Add attachment"
              />
            </div>
          </TabPanel>

          {/* Metadata */}
          <TabPanel value="metadata">
            <div className="card p-5 space-y-4">
              <Input label="Author" value={form.authorName} disabled hint="Set automatically from the creating admin" />
              <Input label="Category" value={form.category} disabled={!canEdit} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Technical Guide, News" />
              <TagInput label="Tags" values={form.tags} onChange={(v) => set("tags", v)} placeholder="Add a tag and press Enter…" />
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.featured} disabled={!canEdit} onChange={(e) => set("featured", e.target.checked)} className="w-4 h-4 rounded" />
                <div>
                  <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>Featured</div>
                  <div className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>Highlight this article on listing pages</div>
                </div>
              </label>
              <Input label="Reading Time" value={`${form.readingTimeMinutes} min`} disabled hint="Calculated automatically from the content" />
              <Input label="Canonical URL" value={form.canonicalUrl} disabled={!canEdit} onChange={(e) => set("canonicalUrl", e.target.value)} placeholder="https://… (only if republished elsewhere)" />
            </div>
          </TabPanel>

          {/* SEO */}
          <TabPanel value="seo">
            <div className="card p-5 space-y-4">
              <Input label="SEO Title" value={form.seoTitle} disabled={!canEdit} onChange={(e) => set("seoTitle", e.target.value)} placeholder={form.title} hint={`${form.seoTitle.length}/60 characters`} />
              <Textarea label="SEO Description" value={form.seoDescription} disabled={!canEdit} onChange={(e) => set("seoDescription", e.target.value)} hint={`${form.seoDescription.length}/160 characters`} rows={3} />
              <TagInput label="Keywords" values={form.seoKeywords} onChange={(v) => set("seoKeywords", v)} placeholder="Add a keyword and press Enter…" />

              <div>
                <label className="text-[12px] font-medium block mb-1.5" style={{ color: "var(--apt-text-primary)" }}>Open Graph Image</label>
                {form.ogImage ? (
                  <div className="relative w-40 h-24 rounded-lg overflow-hidden border" style={{ borderColor: "var(--apt-border)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.ogImage} alt="" className="w-full h-full object-cover" />
                    {canEdit && <button onClick={() => set("ogImage", "")} className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", color: "white" }}><X size={12} /></button>}
                  </div>
                ) : canEdit ? (
                  <Button variant="secondary" size="sm" icon={<ImageIcon size={13} />} onClick={() => setPickerFor("og")}>Choose image</Button>
                ) : <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>No OG image set.</p>}
              </div>

              {(form.seoTitle || form.title) && (
                <div className="rounded-lg p-4" style={{ background: "var(--apt-bg-subtle)", border: "1px solid var(--apt-border)" }}>
                  <p className="text-[11px] font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>Google Preview</p>
                  <div className="text-[#1a0dab] text-[16px] leading-snug">{form.seoTitle || form.title}</div>
                  <div className="text-[#006621] text-[12px] mt-0.5">{SITE_URL.replace(/^https?:\/\//, "")}/articles/{form.slug || "article-slug"}</div>
                  {form.seoDescription && <div className="text-[13px] mt-1 text-[#545454] leading-snug">{form.seoDescription.slice(0, 160)}</div>}
                </div>
              )}
            </div>
          </TabPanel>

          {/* Publishing */}
          <TabPanel value="publishing">
            <div className="card p-5 space-y-4">
              <Select label="Status" options={STATUS_OPTIONS} value={form.status} disabled={!canEdit} onChange={(e) => set("status", e.target.value)} />
              <Input label="Publish Date" type="date" value={form.publishDate} disabled={!canEdit} onChange={(e) => set("publishDate", e.target.value)} />
              {canEdit && (
                <div className="flex items-center gap-2 pt-2" style={{ borderTop: "1px solid var(--apt-border)" }}>
                  <Button
                    variant="secondary" size="sm"
                    onClick={() => save({ status: "scheduled" })}
                    disabled={saving || !form.publishDate}
                  >
                    Schedule Publish
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => save({ status: "draft" })} disabled={saving || form.status === "draft"}>
                    Unpublish
                  </Button>
                </div>
              )}
            </div>
          </TabPanel>

          {/* Analytics */}
          <TabPanel value="analytics">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="card p-5"><p className="text-[24px] font-bold" style={{ color: "var(--apt-text-primary)" }}>{analytics.views.toLocaleString()}</p><p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>Views</p></div>
              <div className="card p-5"><p className="text-[24px] font-bold" style={{ color: "var(--apt-text-primary)" }}>{analytics.uniqueVisitors.toLocaleString()}</p><p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>Unique Visitors</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--apt-text-muted)" }}>Top Traffic Sources</p>
                {analytics.topSources.length === 0 ? <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>No traffic recorded yet.</p> : (
                  <ul className="space-y-1.5">{analytics.topSources.map((s) => (
                    <li key={s.source} className="flex items-center justify-between text-[13px]"><span style={{ color: "var(--apt-text-secondary)" }}>{s.source}</span><span className="font-semibold tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{s.count}</span></li>
                  ))}</ul>
                )}
              </div>
              <div className="card p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--apt-text-muted)" }}>Search Keywords</p>
                {analytics.searchKeywords.length === 0 ? <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>No search-engine referrals recorded yet.</p> : (
                  <ul className="space-y-1.5">{analytics.searchKeywords.map((k) => (
                    <li key={k.keyword} className="flex items-center justify-between text-[13px]"><span style={{ color: "var(--apt-text-secondary)" }}>{k.keyword}</span><span className="font-semibold tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{k.count}</span></li>
                  ))}</ul>
                )}
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </div>

      {pickerFor && (
        <MediaPicker
          open
          onClose={() => setPickerFor(null)}
          onSelect={handlePicked}
          multiple={pickerFor === "gallery"}
          accept="image"
          title={pickerFor === "gallery" ? "Add gallery images" : "Choose image"}
        />
      )}
    </div>
  );
}

function ListEditor<T extends Record<string, string | undefined>>({
  title, items, canEdit, onChange, fields, addLabel,
}: {
  title: string;
  items: T[];
  canEdit: boolean;
  onChange(items: T[]): void;
  fields: { key: keyof T; placeholder: string }[];
  addLabel: string;
}) {
  function update(idx: number, key: keyof T, value: string) {
    onChange(items.map((it, i) => (i === idx ? { ...it, [ key ]: value } : it)));
  }
  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }
  function add() {
    const blank = Object.fromEntries(fields.map((f) => [ f.key, "" ])) as T;
    onChange([ ...items, blank ]);
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{title}</h2>
        {canEdit && <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={add}>{addLabel}</Button>}
      </div>
      {items.length === 0 ? (
        <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>None yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {fields.map((f) => (
                <Input key={String(f.key)} value={item[ f.key ] ?? ""} disabled={!canEdit} onChange={(e) => update(i, f.key, e.target.value)} placeholder={f.placeholder} wrapperClass="flex-1" />
              ))}
              {canEdit && <button onClick={() => remove(i)} className="p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors shrink-0"><X size={14} /></button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
