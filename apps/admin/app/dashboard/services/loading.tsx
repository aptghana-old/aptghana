import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Plus } from "lucide-react";

export default function ServicesLoading() {
  return (
    <div>
      <PageHeader
        title="Services"
        description="Loading services…"
        actions={<Button variant="primary" size="sm" icon={<Plus size={13} />} disabled>Add Service</Button>}
      />
      <div className="p-4 sm:p-6">
        <TableSkeleton rows={8} cols={5} />
      </div>
    </div>
  );
}
