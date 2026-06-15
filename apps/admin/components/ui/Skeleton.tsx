import type { ReactNode } from "react";

/* Base shimmer ────────────────────────────────────────────────────────────── */
interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "full";
}

export function Skeleton({ className = "", style, width, height, rounded = "md" }: SkeletonProps) {
  const radii = { sm: "4px", md: "6px", lg: "10px", full: "9999px" };
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radii[rounded], ...style }}
    />
  );
}

/* ─── Metric / widget card skeleton ───────────────────────────────────────── */
export function MetricCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton width={36} height={36} rounded="lg" />
        <Skeleton width={48} height={20} rounded="full" />
      </div>
      <Skeleton width={80} height={28} />
      <Skeleton width={120} height={14} />
    </div>
  );
}

/* ─── Table skeleton ───────────────────────────────────────────────────────── */
interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  hasCheckbox?: boolean;
  hasThumbnail?: boolean;
}

export function TableSkeleton({ rows = 8, cols = 5, hasCheckbox = false, hasThumbnail = false }: TableSkeletonProps) {
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-4 px-5 py-3"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg-subtle)" }}
      >
        {hasCheckbox && <Skeleton width={16} height={16} rounded="sm" />}
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width={i === 0 ? 120 : 80} height={12} />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y" style={{ borderColor: "var(--apt-border)" }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5">
            {hasCheckbox && <Skeleton width={16} height={16} rounded="sm" />}
            {hasThumbnail && <Skeleton width={36} height={36} rounded="md" />}
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton
                key={j}
                width={j === 0 ? "30%" : `${60 + Math.sin(i * 3 + j) * 30}%`}
                height={14}
                style={{ maxWidth: j === 0 ? 200 : 120 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Form skeleton ────────────────────────────────────────────────────────── */
interface FormSkeletonProps { fields?: number; cols?: 1 | 2 }

export function FormSkeleton({ fields = 6, cols = 2 }: FormSkeletonProps) {
  return (
    <div className="card p-6 space-y-5">
      <Skeleton width={140} height={18} />
      <div className={`grid gap-4 ${cols === 2 ? "sm:grid-cols-2" : ""}`}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton width={80} height={12} />
            <Skeleton height={36} rounded="md" style={{ width: "100%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Card skeleton (generic) ─────────────────────────────────────────────── */
interface CardSkeletonProps { lines?: number; hasHeader?: boolean; hasAction?: boolean }

export function CardSkeleton({ lines = 3, hasHeader = true, hasAction = false }: CardSkeletonProps) {
  return (
    <div className="card overflow-hidden">
      {hasHeader && (
        <div className="card-header">
          <Skeleton width={140} height={16} />
          {hasAction && <Skeleton width={80} height={28} rounded="md" />}
        </div>
      )}
      <div className="p-5 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} height={14} style={{ width: `${100 - i * 12}%` }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Product thumbnail skeleton ──────────────────────────────────────────── */
export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton height={200} rounded="sm" />
      <div className="p-4 space-y-2">
        <Skeleton height={14} style={{ width: "85%" }} />
        <Skeleton height={12} style={{ width: "55%" }} />
        <div className="flex items-center justify-between pt-1">
          <Skeleton width={70} height={16} />
          <Skeleton width={50} height={20} rounded="full" />
        </div>
      </div>
    </div>
  );
}

/* ─── Product grid skeleton ────────────────────────────────────────────────── */
export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ─── Detail page hero skeleton ───────────────────────────────────────────── */
export function ProductDetailSkeleton() {
  return (
    <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-5">
        <div className="card p-5">
          <Skeleton height={240} rounded="lg" />
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} width={72} height={72} rounded="md" />)}
          </div>
        </div>
        <CardSkeleton lines={4} />
        <CardSkeleton lines={6} hasHeader />
      </div>
      <div className="space-y-4">
        <CardSkeleton lines={5} hasAction />
        <CardSkeleton lines={4} />
        <CardSkeleton lines={3} />
      </div>
    </div>
  );
}

/* ─── Dashboard section skeletons ─────────────────────────────────────────── */
export function DashboardMetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => <MetricCardSkeleton key={i} />)}
    </div>
  );
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={120} height={16} />
        <Skeleton width={80} height={24} rounded="full" />
      </div>
      <Skeleton height={height} rounded="lg" />
    </div>
  );
}

/* ─── List item skeleton ───────────────────────────────────────────────────── */
export function ListItemSkeleton({ count = 5, hasAvatar = false }: { count?: number; hasAvatar?: boolean }) {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          {hasAvatar && <Skeleton width={32} height={32} rounded="full" />}
          <div className="flex-1 space-y-1.5">
            <Skeleton height={13} style={{ width: `${70 - i * 5}%` }} />
            <Skeleton height={11} style={{ width: `${45 - i * 3}%` }} />
          </div>
          <Skeleton width={50} height={18} rounded="full" />
        </div>
      ))}
    </div>
  );
}

/* ─── Media grid skeleton ─────────────────────────────────────────────────── */
export function MediaSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton height={100} rounded="md" />
          <Skeleton height={11} style={{ width: "70%" }} />
        </div>
      ))}
    </div>
  );
}

/* ─── Page header skeleton ────────────────────────────────────────────────── */
export function PageHeaderSkeleton({ hasAction = true }: { hasAction?: boolean }) {
  return (
    <div
      className="flex items-start justify-between gap-4 px-4 sm:px-6 py-5"
      style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
    >
      <div className="space-y-2">
        <Skeleton width={160} height={22} />
        <Skeleton width={200} height={14} />
      </div>
      {hasAction && <Skeleton width={110} height={34} rounded="md" />}
    </div>
  );
}
