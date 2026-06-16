import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Plus } from "lucide-react";

export default function CompanyLoading() {
  return (
    <div>
      <PageHeader
        title="Company"
        description="Loading company pages…"
        actions={<Button variant="primary" size="sm" icon={<Plus size={13} />} disabled>Add Page</Button>}
      />
      <div className="p-4 sm:p-6">
        <TableSkeleton rows={6} cols={5} />
      </div>
    </div>
  );
}
