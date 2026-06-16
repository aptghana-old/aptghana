import { PageHeaderSkeleton, Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function SearchGapsLoading() {
  return (
    <div>
      <PageHeaderSkeleton hasAction={false} />
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton width={420} height={36} rounded="lg" />
        <CardSkeleton lines={8} hasHeader />
      </div>
    </div>
  );
}
