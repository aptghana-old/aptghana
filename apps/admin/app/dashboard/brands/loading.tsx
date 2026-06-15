import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Plus } from "lucide-react";

export default function BrandsLoading() {
  return (
    <div>
      <PageHeader
        title="Brands"
        description="Loading brands…"
        actions={<Button variant="primary" size="sm" icon={<Plus size={13} />} disabled>Add Brand</Button>}
      />
      <div className="p-4 sm:p-6">
        <TableSkeleton rows={8} cols={6} hasThumbnail />
      </div>
    </div>
  );
}
