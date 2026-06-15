import * as React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { COMPANY, formatMoney } from "../company";
import type { BusinessDocumentData, DocumentKind } from "../types";
import { PDF, styles } from "./theme";

const KIND_TITLES: Record<DocumentKind, string> = {
  quote: "Quotation",
  proforma: "Proforma Invoice",
  order: "Order Confirmation",
  invoice: "Invoice",
  receipt: "Sales Receipt",
};

function chipColors(label: string): { bg: string; fg: string } {
  const l = label.toLowerCase();
  if (l.includes("paid") && !l.includes("awaiting")) return { bg: PDF.greenBg, fg: PDF.green };
  if (l.includes("await") || l.includes("pending")) return { bg: PDF.amberBg, fg: PDF.amber };
  return { bg: PDF.raised, fg: PDF.muted };
}

/* Column layout: flexes tuned for A4 */
const COL = { name: 6, qty: 1, unit: 2, total: 2 };

function Header({ data }: { data: BusinessDocumentData }) {
  const chip = data.statusLabel ? chipColors(data.statusLabel) : null;
  return (
    <>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.brandName}>
            APT <Text style={styles.brandAccent}>GHANA</Text>
          </Text>
          <Text style={styles.brandLegal}>{COMPANY.legalName}</Text>
          <Text style={styles.brandContact}>
            {COMPANY.address}{"\n"}
            {COMPANY.phone} · {COMPANY.email} · {COMPANY.website}
          </Text>
        </View>
        <View>
          <Text style={styles.docTitle}>{KIND_TITLES[data.kind]}</Text>
          <Text style={styles.docNumber}>{data.number}</Text>
          <Text style={styles.docMeta}>
            Date: {data.date}
            {data.validUntil ? `\nValid until: ${data.validUntil}` : ""}
            {data.reference ? `\nReference: ${data.reference}` : ""}
          </Text>
          {chip && data.statusLabel && (
            <Text style={[styles.chip, { backgroundColor: chip.bg, color: chip.fg }]}>
              {data.statusLabel}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.hr} />
    </>
  );
}

function Parties({ data }: { data: BusinessDocumentData }) {
  const c = data.customer;
  return (
    <View style={styles.partiesRow}>
      <View style={styles.partyCol}>
        <Text style={styles.partyLabel}>From</Text>
        <Text style={styles.partyName}>{COMPANY.legalName}</Text>
        <Text style={styles.partyLine}>{COMPANY.address}</Text>
        <Text style={styles.partyLine}>{COMPANY.email} · {COMPANY.phone}</Text>
      </View>
      <View style={styles.partyCol}>
        <Text style={styles.partyLabel}>
          {data.kind === "receipt" ? "Received From" : data.kind === "quote" ? "Prepared For" : "Bill To"}
        </Text>
        <Text style={styles.partyName}>{c.company || c.name}</Text>
        {c.company ? <Text style={styles.partyLine}>Attn: {c.name}</Text> : null}
        {c.address ? <Text style={styles.partyLine}>{c.address}{c.country ? `, ${c.country}` : ""}</Text> : c.country ? <Text style={styles.partyLine}>{c.country}</Text> : null}
        <Text style={styles.partyLine}>
          {[c.email, c.phone].filter(Boolean).join(" · ")}
        </Text>
      </View>
    </View>
  );
}

function ItemsTable({ data }: { data: BusinessDocumentData }) {
  const currency = data.totals?.currency ?? "GHS";
  return (
    <View>
      <View style={styles.th} fixed>
        <Text style={{ flex: COL.name }}>Product</Text>
        <Text style={{ flex: COL.qty, textAlign: "right" }}>Qty</Text>
        {data.showPrices && (
          <>
            <Text style={{ flex: COL.unit, textAlign: "right" }}>Unit Price</Text>
            <Text style={{ flex: COL.total, textAlign: "right" }}>Amount</Text>
          </>
        )}
      </View>
      {data.lines.map((line, i) => (
        <View key={i} style={i % 2 === 1 ? [styles.tr, styles.trAlt] : styles.tr} wrap={false}>
          <View style={{ flex: COL.name, paddingRight: 8 }}>
            <Text style={styles.cellName}>{line.name}</Text>
            {(line.sku || line.brand) && (
              <Text style={styles.cellSub}>
                {[line.brand, line.sku ? `SKU ${line.sku}` : null].filter(Boolean).join(" · ")}
              </Text>
            )}
            {line.notes ? <Text style={styles.cellNote}>{line.notes}</Text> : null}
          </View>
          <Text style={[styles.cellNum, { flex: COL.qty }]}>{line.quantity}</Text>
          {data.showPrices && (
            <>
              <Text style={[styles.cellNum, { flex: COL.unit }]}>
                {line.unitPrice !== undefined ? formatMoney(line.unitPrice, currency) : "—"}
              </Text>
              <Text style={[styles.cellNum, { flex: COL.total, fontFamily: "Helvetica-Bold" }]}>
                {line.lineTotal !== undefined
                  ? formatMoney(line.lineTotal, currency)
                  : line.unitPrice !== undefined
                    ? formatMoney(line.unitPrice * line.quantity, currency)
                    : "—"}
              </Text>
            </>
          )}
        </View>
      ))}
    </View>
  );
}

function Totals({ data }: { data: BusinessDocumentData }) {
  const t = data.totals;
  if (!t || !data.showPrices) return null;
  const c = t.currency;
  return (
    <View style={styles.totalsBlock} wrap={false}>
      <View style={styles.totalsRow}>
        <Text style={styles.totalsLabel}>Subtotal</Text>
        <Text style={styles.totalsValue}>{formatMoney(t.subtotal, c)}</Text>
      </View>
      {t.discount > 0 && (
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Discount</Text>
          <Text style={styles.totalsValue}>− {formatMoney(t.discount, c)}</Text>
        </View>
      )}
      {t.taxAmount > 0 && (
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>{t.taxRate > 0 ? `Tax (${t.taxRate}%)` : "Tax"}</Text>
          <Text style={styles.totalsValue}>{formatMoney(t.taxAmount, c)}</Text>
        </View>
      )}
      {t.shipping > 0 && (
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Shipping</Text>
          <Text style={styles.totalsValue}>{formatMoney(t.shipping, c)}</Text>
        </View>
      )}
      <View style={styles.grandRow}>
        <Text style={styles.grandLabel}>
          {data.kind === "receipt" ? "Amount Paid" : "Total Due"}
        </Text>
        <Text style={styles.grandValue}>{formatMoney(t.grandTotal, c)}</Text>
      </View>
    </View>
  );
}

function PaymentBox({ data }: { data: BusinessDocumentData }) {
  if (!data.payment) return null;
  const p = data.payment;
  return (
    <View style={styles.box} wrap={false}>
      <Text style={styles.boxTitle}>Payment Details</Text>
      <Text style={styles.boxText}>
        Reference: {p.reference}
        {p.channel ? ` · Method: ${p.channel.replace(/_/g, " ")}` : ""}
        {p.paidAt ? ` · Paid: ${p.paidAt}` : ""}
        {p.amount !== undefined && data.totals
          ? ` · Amount: ${formatMoney(p.amount, data.totals.currency)}`
          : ""}
      </Text>
    </View>
  );
}

function Footer({ data }: { data: BusinessDocumentData }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerTerms}>{data.terms ?? COMPANY.terms}</Text>
      <View style={styles.footerRow}>
        <Text style={styles.footerBrand}>
          {COMPANY.legalName} · {COMPANY.website}
        </Text>
        <Text
          style={styles.footerPage}
          render={({ pageNumber, totalPages }) => `${data.number} · Page ${pageNumber} of ${totalPages}`}
        />
      </View>
    </View>
  );
}

/** One template, five document variants — quotes, proformas, orders, invoices, receipts. */
export function BusinessDocument({ data }: { data: BusinessDocumentData }) {
  return (
    <Document
      title={`${KIND_TITLES[data.kind]} ${data.number}`}
      author={COMPANY.legalName}
      creator="APT Ghana Platform"
    >
      <Page size="A4" style={styles.page}>
        <Header data={data} />
        <Parties data={data} />
        <ItemsTable data={data} />
        <Totals data={data} />
        <PaymentBox data={data} />
        {data.note && (
          <View style={styles.box} wrap={false}>
            <Text style={styles.boxTitle}>Notes</Text>
            <Text style={styles.boxText}>{data.note}</Text>
          </View>
        )}
        {!data.showPrices && (
          <View style={styles.box} wrap={false}>
            <Text style={styles.boxTitle}>Pricing</Text>
            <Text style={styles.boxText}>
              This request is being priced by our engineering team. You will receive an itemized
              quotation with unit prices, taxes, and delivery costs.
            </Text>
          </View>
        )}
        <Footer data={data} />
      </Page>
    </Document>
  );
}
