import ExcelJS from "exceljs";
import { COMPANY } from "../company";
import type { ExportData } from "../types";

const NAVY = "FF0A1628";
const WHITE = "FFFFFFFF";
const FAINT = "FFF3F4F6";

/** Styled workbook: branded title row, filter summary, frozen styled header, zebra rows. */
export async function buildXlsx(data: ExportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = COMPANY.legalName;
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(data.title.slice(0, 31), {
    views: [{ state: "frozen", ySplit: 3 }],
  });

  sheet.columns = data.columns.map((c) => ({
    key: c.key,
    width: Math.max(c.width ?? 14, c.header.length + 2),
  }));

  // Row 1: branded title
  const titleRow = sheet.addRow([`${COMPANY.name} — ${data.title}`]);
  sheet.mergeCells(1, 1, 1, data.columns.length);
  titleRow.height = 24;
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: NAVY } };

  // Row 2: filters + generation stamp
  const metaRow = sheet.addRow([
    `${data.subtitle ? `${data.subtitle} · ` : ""}Generated ${new Date().toLocaleString("en-GB")} · ${data.rows.length} record(s)`,
  ]);
  sheet.mergeCells(2, 1, 2, data.columns.length);
  metaRow.getCell(1).font = { size: 9, color: { argb: "FF6B7280" } };

  // Row 3: header
  const headerRow = sheet.addRow(data.columns.map((c) => c.header));
  headerRow.height = 18;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: { argb: WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    cell.alignment = { vertical: "middle" };
    cell.border = { bottom: { style: "thin", color: { argb: NAVY } } };
  });

  // Data rows
  for (const [i, row] of data.rows.entries()) {
    const r = sheet.addRow(data.columns.map((c) => row[c.key] ?? ""));
    r.eachCell((cell, colNumber) => {
      const col = data.columns[colNumber - 1];
      cell.font = { size: 9.5 };
      if (i % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FAINT } };
      }
      if (col?.money && typeof cell.value === "number") {
        cell.numFmt = "#,##0.00";
      }
      if (col?.align === "right" || col?.money) {
        cell.alignment = { horizontal: "right" };
      }
    });
  }

  sheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: data.columns.length },
  };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
