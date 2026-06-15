import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Plus } from "lucide-react";

export default function CategoriesLoading() {
  return (
    <div>
      <PageHeader
        title="Categories"
        description="Loading taxonomy…"
        actions={<Button variant="primary" size="sm" icon={<Plus size={13} />} disabled>Add Category</Button>}
      />
      <div className="p-4 sm:p-6">
        <TableSkeleton rows={12} cols={5} />
      </div>
    </div>
  );
}
