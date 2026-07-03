import { Button } from "@/components/ui/Button";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { ChevronLeft } from "lucide-react";

export default function ProductDetailLoading() {
  return (
    <div>
      {/* Back bar */}
      <div
        className="flex items-center gap-4 px-4 sm:px-6 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />} disabled>Products</Button>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <Skeleton width={120} height={14} />
        <Skeleton width={60} height={20} rounded="full" className="ml-auto" />
      </div>

      {/* Header band */}
      <div className="px-4 sm:px-6 pt-5 pb-5" style={{ background: "var(--apt-bg)", borderBottom: "1px solid var(--apt-border)" }}>
        <div className="max-w-[1400px]">
          <Skeleton width={280} height={12} className="mb-4" />
          <div className="flex items-start gap-6 flex-wrap">
            <div className="flex-1 min-w-[260px] space-y-3">
              <div className="flex gap-2">
                <Skeleton width={48} height={20} rounded="full" />
                <Skeleton width={72} height={20} rounded="full" />
              </div>
              <Skeleton width="70%" height={28} />
              <Skeleton width="50%" height={14} />
            </div>
            <Skeleton width={260} height={110} rounded="lg" />
          </div>
        </div>
      </div>

      {/* Three-column band */}
      <div className="px-4 sm:px-6 py-5 max-w-[1400px]">
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex-[1_1_300px] min-w-[280px] lg:max-w-[420px] space-y-4">
            <div className="card p-5">
              <Skeleton height={280} rounded="lg" />
              <div className="grid grid-cols-5 gap-2 mt-3">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height={52} rounded="md" />)}
              </div>
            </div>
            <CardSkeleton lines={4} hasHeader />
          </div>
          <div className="flex-[2_1_360px] min-w-0 space-y-4">
            <CardSkeleton lines={5} hasHeader />
            <CardSkeleton lines={4} hasHeader />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CardSkeleton lines={2} hasHeader />
              <CardSkeleton lines={2} hasHeader />
            </div>
          </div>
          <div className="flex-[1_1_280px] min-w-[280px] lg:max-w-[380px] space-y-4">
            {[5, 4, 3, 2].map((lines, i) => <CardSkeleton key={i} lines={lines} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
