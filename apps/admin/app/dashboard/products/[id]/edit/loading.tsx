import { Button } from "@/components/ui/Button";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { ChevronLeft } from "lucide-react";

export default function EditProductLoading() {
  return (
    <div>
      {/* Back bar */}
      <div
        className="flex items-center gap-4 px-4 sm:px-6 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />} disabled>Back to product</Button>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <Skeleton width={120} height={14} />
        <Skeleton width={60} height={20} rounded="full" className="ml-auto" />
      </div>

      {/* Header band */}
      <div className="px-4 sm:px-6 pt-5 pb-5" style={{ background: "var(--apt-bg)", borderBottom: "1px solid var(--apt-border)" }}>
        <div className="max-w-[1400px] flex items-start gap-6 flex-wrap">
          <div className="flex-1 min-w-[260px] space-y-3">
            <Skeleton width={110} height={12} />
            <Skeleton width="70%" height={28} />
          </div>
          <Skeleton width={240} height={92} rounded="lg" />
        </div>
      </div>

      {/* Form band */}
      <div className="px-4 sm:px-6 py-5 max-w-[1400px]">
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex-[2_1_420px] min-w-0 space-y-4">
            <CardSkeleton lines={5} hasHeader />
            <CardSkeleton lines={4} hasHeader />
            <CardSkeleton lines={4} hasHeader />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CardSkeleton lines={2} hasHeader />
              <CardSkeleton lines={2} hasHeader />
            </div>
          </div>
          <div className="flex-[1_1_280px] min-w-[280px] lg:max-w-[380px] space-y-4">
            {[2, 5, 6, 3].map((lines, i) => <CardSkeleton key={i} lines={lines} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
