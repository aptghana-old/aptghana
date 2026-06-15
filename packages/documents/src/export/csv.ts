import type { ExportData } from "../types";

/** RFC-4180 CSV with BOM so Excel opens it with correct encoding. */
export function buildCsv(data: ExportData): Buffer {
  const escape = (v: string | number | null) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [
    data.columns.map((c) => escape(c.header)).join(","),
    ...data.rows.map((row) => data.columns.map((c) => escape(row[c.key] ?? "")).join(",")),
  ];

  return Buffer.from("﻿" + lines.join("\r\n"), "utf8");
}
