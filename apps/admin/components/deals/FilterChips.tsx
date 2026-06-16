"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { DealFilterOptions, DealKind } from "@/lib/dealFilters";
import { emptyFormState, buildChips } from "./types";
import DealSavedViews from "./DealSavedViews";

interface Props {
  kind: DealKind;
  options: DealFilterOptions;
  current: Record<string, string | undefined>;
  storageNamespace: string;
  onOpenFilters(): void;
}

export default function FilterChips({ kind, options, current, storageNamespace, onOpenFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const state = emptyFormState(current);
  const chips = buildChips(state, options, kind);

  function removeChip(key: string) {
    const qs = new URLSearchParams(params.toString());
    qs.delete(key);
    if (key === "minValue") qs.delete("maxValue");
    if (key === "preset") { qs.delete("from"); qs.delete("to"); }
    if (key === "categoryId") qs.delete("categoryLabel");
    router.push(`${pathname}?${qs.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
  }

  return (
    <div className="flex items-center gap-2 px-4 sm:px-6 py-3 flex-wrap" style={{ borderBottom: "1px solid var(--apt-border)" }}>
      <Button variant={chips.length ? "secondary" : "ghost"} size="sm" icon={<SlidersHorizontal size={13} />} onClick={onOpenFilters}>
        Filters{chips.length > 0 ? ` (${chips.length})` : ""}
      </Button>

      {chips.map((c) => (
        <span key={c.key} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-[12px]" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-secondary)" }}>
          {c.label}
          <button onClick={() => removeChip(c.key)} aria-label={`Remove ${c.label}`} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[var(--apt-border)]"><X size={10} /></button>
        </span>
      ))}

      {chips.length > 0 && <Button variant="ghost" size="sm" icon={<X size={13} />} onClick={clearAll}>Clear all</Button>}

      <div className="ml-auto">
        <DealSavedViews storageNamespace={storageNamespace} />
      </div>
    </div>
  );
}
