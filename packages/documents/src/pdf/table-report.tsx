import * as React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { COMPANY, formatMoney } from "../company";
import type { ExportData } from "../types";
import { PDF, styles } from "./theme";

/** Landscape tabular report for bulk exports (orders, quotes, customers…). */
export function TableReport({ data }: { data: ExportData }) {
  const totalFlex = data.columns.reduce((n, c) => n + (c.width ?? 14), 0);

  return (
    <Document title={data.title} author={COMPANY.legalName} creator="APT Ghana Platform">
      <Page size="A4" orientation="landscape" style={[styles.page, { paddingBottom: 48 }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brandName}>
              APT <Text style={styles.brandAccent}>GHANA</Text>
            </Text>
            <Text style={styles.brandLegal}>{COMPANY.legalName}</Text>
          </View>
          <View>
            <Text style={[styles.docTitle, { fontSize: 13 }]}>{data.title}</Text>
            {data.subtitle ? <Text style={styles.docMeta}>{data.subtitle}</Text> : null}
            <Text style={styles.docMeta}>
              Generated {new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              {" · "}{data.rows.length.toLocaleString()} record{data.rows.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
        <View style={[styles.hr, { marginTop: 10, marginBottom: 10 }]} />

        {/* Table */}
        <View style={styles.th} fixed>
          {data.columns.map((col) => (
            <Text key={col.key} style={{ flex: col.width ?? 14, textAlign: col.align ?? "left", paddingRight: 4 }}>
              {col.header}
            </Text>
          ))}
        </View>
        {data.rows.map((row, i) => (
          <View key={i} style={i % 2 === 1 ? [styles.tr, styles.trAlt, { paddingVertical: 5 }] : [styles.tr, { paddingVertical: 5 }]} wrap={false}>
            {data.columns.map((col) => {
              const value = row[col.key];
              return (
                <Text
                  key={col.key}
                  style={{
                    flex: col.width ?? 14,
                    fontSize: 7.5,
                    textAlign: col.align ?? "left",
                    paddingRight: 4,
                    color: PDF.text,
                  }}
                >
                  {value === null || value === undefined || value === "" ? "—" : String(value)}
                </Text>
              );
            })}
          </View>
        ))}

        {data.rows.length === 0 && (
          <Text style={{ fontSize: 9, color: PDF.muted, marginTop: 16, textAlign: "center" }}>
            No records match the selected filters.
          </Text>
        )}

        {/* Footer */}
        <View style={[styles.footer, { bottom: 18 }]} fixed>
          <View style={styles.footerRow}>
            <Text style={styles.footerBrand}>
              {COMPANY.legalName} · Confidential — for internal and accounting use
            </Text>
            <Text
              style={styles.footerPage}
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            />
          </View>
        </View>
      </Page>
    </Document>
  );
}

export { formatMoney };
