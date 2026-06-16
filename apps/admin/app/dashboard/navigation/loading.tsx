import { PageHeader } from "@/components/ui/PageHeader";
import { CardSkeleton } from "@/components/ui/Skeleton";

export default function NavigationLoading() {
  return (
    <div>
      <PageHeader title="Navigation Builder" description="Loading navigation trees…" />
      <div className="p-4 sm:p-6 space-y-4">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={4} />
        <CardSkeleton lines={4} />
      </div>
    </div>
  );
}
