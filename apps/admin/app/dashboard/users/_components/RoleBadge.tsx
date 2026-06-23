"use client";

import { Shield } from "lucide-react";
import type { AdminRole } from "./types";
import { ROLE_META } from "./types";

interface Props {
  role: AdminRole;
  showIcon?: boolean;
  size?: "xs" | "sm";
}

export default function RoleBadge({ role, showIcon = false, size = "sm" }: Props) {
  const meta = ROLE_META[role];
  if (!meta) return <span className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{role}</span>;

  const px = size === "xs" ? "px-1.5 py-px" : "px-2 py-0.5";
  const text = size === "xs" ? "text-[10px]" : "text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full ${px} ${text}`}
      style={{ background: meta.color, color: meta.textColor }}
    >
      {showIcon && <Shield size={9} />}
      {meta.label}
    </span>
  );
}
