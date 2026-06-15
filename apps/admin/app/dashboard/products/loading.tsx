import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Plus, Upload, Download } from "lucide-react";

export default function ProductsLoading() {
  return (
    <div>
      <PageHeader
        title="Products"
        description="Loading catalogue…"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Upload size={13} />} disabled>Import</Button>
            <Button variant="secondary" size="sm" icon={<Download size={13} />} disabled>Export</Button>
            <Button variant="primary" size="sm" icon={<Plus size={13} />} disabled>Add Product</Button>
          </div>
        }
      />
      {/* Filters bar skeleton */}
      <div
        className="flex items-center gap-3 px-4 sm:px-6 py-3 overflow-x-auto"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        {[220, 120, 120, 120].map((w, i) => (
          <div key={i} className="skeleton h-8 rounded-md shrink-0" style={{ width: w }} />
        ))}
      </div>
      <div className="p-4 sm:p-6">
        <TableSkeleton rows={12} cols={6} hasCheckbox hasThumbnail />
      </div>
    </div>
  );
}
