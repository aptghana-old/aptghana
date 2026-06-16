import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Plus } from "lucide-react";

export default function SolutionsLoading() {
  return (
    <div>
      <PageHeader
        title="Solutions"
        description="Loading solutions…"
        actions={<Button variant="primary" size="sm" icon={<Plus size={13} />} disabled>Add Solution</Button>}
      />
      <div className="p-4 sm:p-6">
        <TableSkeleton rows={8} cols={6} />
      </div>
    </div>
  );
}
