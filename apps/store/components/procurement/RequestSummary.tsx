"use client";

import Link from "next/link";
import { Icon, PrimaryBtn } from "@/components/account/ui";
import { D } from "./icons";

interface SummaryProps {
  title: string;
  lineCount: number;
  totalUnits: number;
  sourceLabel: string;
  submitLabel: string;
  submitting: boolean;
  disabled: boolean;
  /** Extra dl rows or notices rendered between the stats and the submit button. */
  children?: React.ReactNode;
}

/** Sticky desktop summary panel — shared by the RFA and RFQ workspaces. */
export function SummaryAside({
  title, lineCount, totalUnits, sourceLabel, submitLabel, submitting, disabled, children,
}: SummaryProps) {
  return (
    <aside
      className="rounded-2xl border p-5 lg:sticky lg:top-24"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <h2 className="text-base font-bold text-(--text-1) mb-4">{title}</h2>

      <dl className="space-y-2.5 mb-4">
        <div className="flex justify-between text-sm">
          <dt className="text-(--text-3)">Line items</dt>
          <dd className="font-semibold text-(--text-1)">{lineCount}</dd>
        </div>
        <div className="flex justify-between text-sm">
          <dt className="text-(--text-3)">Total units</dt>
          <dd className="font-semibold text-(--text-1)">{totalUnits.toLocaleString()}</dd>
        </div>
        <div className="flex justify-between text-sm">
          <dt className="text-(--text-3)">Source</dt>
          <dd className="font-medium text-(--text-2) text-xs">{sourceLabel}</dd>
        </div>
        <div className="flex justify-between text-sm">
          <dt className="text-(--text-3)">Pricing</dt>
          <dd className="font-medium text-(--text-4) text-xs italic">Itemized in quotation</dd>
        </div>
      </dl>

      {children}

      <div
        className="flex items-start gap-2.5 p-3 rounded-xl mb-4 text-[12px] leading-relaxed"
        style={{ background: "var(--bg-raised)", color: "var(--text-3)" }}
      >
        <Icon d={D.clock} size={14} strokeWidth={2} className="shrink-0 mt-0.5 text-se-green" />
        Same-day response for requests submitted before 3:00 PM Ghana time.
      </div>

      <PrimaryBtn variant="green" loading={submitting} disabled={disabled} className="w-full h-12">
        {submitLabel}
        {!submitting && <Icon d={D.arrow} size={14} strokeWidth={2.5} />}
      </PrimaryBtn>

      <Link
        href="/search"
        className="w-full flex items-center justify-center gap-1.5 h-9 mt-3 rounded-xl text-sm font-semibold text-(--text-3) hover:text-(--text-1) transition-colors"
      >
        Continue browsing — request is saved
      </Link>

      <p className="flex items-start gap-2 text-[11px] text-(--text-4) mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
        <Icon d={D.shield} size={13} strokeWidth={2} className="shrink-0 mt-px" />
        Your details are only used to prepare and deliver your quotation.
      </p>
    </aside>
  );
}

/** Fixed bottom action bar for small screens. */
export function MobileActionBar({
  lineCount, totalUnits, submitLabel, submitting, disabled,
}: Pick<SummaryProps, "lineCount" | "totalUnits" | "submitLabel" | "submitting" | "disabled">) {
  return (
    <div
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-4 py-3 border-t flex items-center gap-4"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-3)",
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-(--text-1) leading-tight">
          {lineCount} item{lineCount !== 1 ? "s" : ""}
        </p>
        <p className="text-[11px] text-(--text-4)">{totalUnits.toLocaleString()} units</p>
      </div>
      <PrimaryBtn variant="green" loading={submitting} disabled={disabled} className="flex-1 h-11">
        {submitLabel}
      </PrimaryBtn>
    </div>
  );
}
