import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Plus } from "lucide-react";

export default function ResourcesLoading() {
  return (
    <div>
      <PageHeader
        title="Resources"
        description="Loading…"
        actions={<Button variant="primary" size="sm" icon={<Plus size={13} />} disabled>Add Resource</Button>}
      />
      <div className="p-4 sm:p-6">
        <TableSkeleton rows={6} cols={5} />
      </div>
    </div>
  );
}
