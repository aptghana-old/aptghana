"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ArticleFilterOptions } from "@/lib/articleFilters";
import DealSavedViews from "@/components/deals/DealSavedViews";

interface Props {
  options: ArticleFilterOptions;
  current: Record<string, string | undefined>;
  onOpenFilters(): void;
}

const PRESET_LABEL: Record<string, string> = { "7d": "Last 7 Days", "30d": "Last 30 Days", "90d": "Last 90 Days", custom: "Custom range" };

export default function ArticleFilterChips({ options, current, onOpenFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const chips: { key: string; label: string }[] = [];
  if (current.status) chips.push({ key: "status", label: `Status: ${current.status}` });
  if (current.author) chips.push({ key: "author", label: `Author: ${options.authors.find((a) => a.value === current.author)?.label ?? current.author}` });
  if (current.category) chips.push({ key: "category", label: `Category: ${current.category}` });
  if (current.tag) chips.push({ key: "tag", label: `Tag: ${current.tag}` });
  if (current.featured) chips.push({ key: "featured", label: current.featured === "1" ? "Featured" : "Not featured" });
  if (current.preset) chips.push({ key: "preset", label: PRESET_LABEL[current.preset] ?? current.preset });

  function removeChip(key: string) {
    const qs = new URLSearchParams(params.toString());
    qs.delete(key);
    if (key === "preset") { qs.delete("from"); qs.delete("to"); qs.delete("dateField"); }
    router.push(`${pathname}?${qs.toString()}`);
  }

  function updateSearch(q: string) {
    const qs = new URLSearchParams(params.toString());
    if (q) qs.set("q", q); else qs.delete("q");
    router.push(`${pathname}?${qs.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
  }

  return (
    <div className="flex items-center gap-2 px-4 sm:px-6 py-3 flex-wrap" style={{ borderBottom: "1px solid var(--apt-border)" }}>
      <div className="relative max-w-xs">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--apt-text-muted)" }} />
        <input
          defaultValue={current.q}
          onKeyDown={(e) => { if (e.key === "Enter") updateSearch((e.target as HTMLInputElement).value); }}
          placeholder="Search title, slug, excerpt, content…"
          className="w-full h-8 pl-8 pr-3 rounded-md text-[13px] border"
          style={{ background: "var(--apt-bg-subtle)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
        />
      </div>

      <Button variant={chips.length ? "secondary" : "ghost"} size="sm" icon={<SlidersHorizontal size={13} />} onClick={onOpenFilters}>
        Filters{chips.length > 0 ? ` (${chips.length})` : ""}
      </Button>

      {chips.map((c) => (
        <span key={c.key} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-[12px]" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-secondary)" }}>
          {c.label}
          <button onClick={() => removeChip(c.key)} aria-label={`Remove ${c.label}`} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[var(--apt-border)]"><X size={10} /></button>
        </span>
      ))}

      {(chips.length > 0 || current.q) && <Button variant="ghost" size="sm" icon={<X size={13} />} onClick={clearAll}>Clear all</Button>}

      <div className="ml-auto">
        <DealSavedViews storageNamespace="articles" />
      </div>
    </div>
  );
}
