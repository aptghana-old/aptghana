import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function ArticleDetailLoading() {
  return (
    <div>
      <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}>
        <Skeleton width={90} height={24} rounded="md" />
        <Skeleton width={220} height={20} />
      </div>
      <div className="p-4 sm:p-6 max-w-4xl space-y-5">
        <Skeleton width={360} height={36} rounded="lg" />
        <CardSkeleton lines={4} />
        <CardSkeleton lines={10} hasHeader />
      </div>
    </div>
  );
}
