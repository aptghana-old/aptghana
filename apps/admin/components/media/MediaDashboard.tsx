"use client";

import { Image, Film, FileText, FileSpreadsheet, Archive, HardDrive, Files, Star } from "lucide-react";
import type { MediaStats } from "./types";
import { formatBytes } from "./utils";

interface Props {
  stats: MediaStats;
}

const TYPE_CONFIG = [
  { key: "image",       label: "Images",       icon: Image,         color: "#0284c7", bg: "#e0f2fe" },
  { key: "video",       label: "Videos",        icon: Film,          color: "#7c3aed", bg: "#ede9fe" },
  { key: "pdf",         label: "PDFs",          icon: FileText,      color: "#dc2626", bg: "#fee2e2" },
  { key: "document",    label: "Documents",     icon: FileText,      color: "#1d4ed8", bg: "#dbeafe" },
  { key: "spreadsheet", label: "Spreadsheets",  icon: FileSpreadsheet,color: "#15803d", bg: "#dcfce7" },
  { key: "archive",     label: "Archives",      icon: Archive,       color: "#b45309", bg: "#fef3c7" },
];

export function MediaDashboard({ stats }: Props) {
  const images   = stats.byType.image?.count  ?? 0;
  const videos   = stats.byType.video?.count  ?? 0;
  const pdfs     = stats.byType.pdf?.count    ?? 0;
  const docs     = stats.byType.document?.count ?? 0;

  return (
    <div className="border-b px-6 py-4 space-y-4" style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg)" }}>
      {/* Primary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard
          label="Total Assets"
          value={stats.total.toLocaleString()}
          icon={<Files size={15} />}
          iconColor="#0057b8"
          iconBg="#dbeafe"
          wide
        />
        <StatCard
          label="Storage Used"
          value={formatBytes(stats.totalBytes)}
          icon={<HardDrive size={15} />}
          iconColor="#7c3aed"
          iconBg="#ede9fe"
          wide
        />
        {TYPE_CONFIG.map(({ key, label, icon: Icon, color, bg }) => (
          <StatCard
            key={key}
            label={label}
            value={(stats.byType[key]?.count ?? 0).toLocaleString()}
            subtext={stats.byType[key] ? formatBytes(stats.byType[key].bytes) : undefined}
            icon={<Icon size={15} />}
            iconColor={color}
            iconBg={bg}
          />
        ))}
      </div>

      {/* Upload activity chart (last 14 days) */}
      {stats.byDay.length > 0 && (
        <div className="flex items-end gap-1 h-12" title="Upload activity (last 14 days)">
          {stats.byDay.map((day, i) => {
            const max = Math.max(...stats.byDay.map((d) => d.count), 1);
            const h   = Math.max(4, Math.round((day.count / max) * 40));
            return (
              <div
                key={i}
                className="flex-1 rounded-sm transition-opacity hover:opacity-70 cursor-default"
                style={{ height: `${h}px`, background: "#0057b8", opacity: 0.6 + (i / stats.byDay.length) * 0.4 }}
                title={`${day.date}: ${day.count} uploads`}
              />
            );
          })}
          <span className="text-[10px] ml-1 self-end" style={{ color: "var(--apt-text-muted)" }}>14d</span>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  wide?: boolean;
}

function StatCard({ label, value, subtext, icon, iconColor, iconBg }: StatCardProps) {
  return (
    <div
      className="rounded-lg p-3 flex items-start gap-2.5 transition-colors"
      style={{ background: "var(--apt-bg-subtle)", border: "1px solid var(--apt-border)" }}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium leading-none mb-1 truncate" style={{ color: "var(--apt-text-muted)" }}>
          {label}
        </p>
        <p className="text-[14px] font-bold leading-none" style={{ color: "var(--apt-text-primary)" }}>
          {value}
        </p>
        {subtext && (
          <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--apt-text-muted)" }}>{subtext}</p>
        )}
      </div>
    </div>
  );
}
