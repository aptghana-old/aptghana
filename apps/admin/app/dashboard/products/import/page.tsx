import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Upload, FileSpreadsheet, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Import Products" };

const TEMPLATE_COLUMNS = [
  "name", "sku", "mpn", "brand_slug", "category_slugs (comma-separated)",
  "short_description", "description", "list_price", "currency",
  "stock_qty", "status", "meta_title", "meta_description",
];

export default function ProductImportPage() {
  return (
    <div>
      <div
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href="/dashboard/products">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Products</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Bulk Import</h1>
      </div>

      <div className="p-6 max-w-3xl space-y-5">
        {/* Template download */}
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#f0fdf4" }}>
                <FileSpreadsheet size={20} style={{ color: "#059669" }} />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>CSV Template</h3>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
                  Download the template and fill in product data. One row per product.
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" icon={<Download size={13} />}>
              Download Template
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {TEMPLATE_COLUMNS.map((col) => (
              <span key={col} className="font-mono text-[10px] px-2 py-0.5 rounded" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}>
                {col}
              </span>
            ))}
          </div>
        </div>

        {/* Import area — ComingSoon */}
        <div className="card">
          <ComingSoon
            icon={<Upload size={24} />}
            title="CSV / Excel Import"
            description="Upload a spreadsheet to bulk-create or update products. Supports incremental imports — rows with matching SKUs update; new SKUs create."
            accentColor="#0057b8"
            accentBg="#eff6ff"
            milestones={[
              { label: "CSV parser with validation", done: false },
              { label: "Duplicate SKU detection & merge strategy", done: false },
              { label: "Brand & category slug resolution", done: false },
              { label: "Spec group import from columns", done: false },
              { label: "Import progress & error report", done: false },
              { label: "Rollback on partial failure", done: false },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
