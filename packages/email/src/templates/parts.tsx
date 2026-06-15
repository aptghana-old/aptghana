import * as React from "react";
import { Column, Row, Section, Text } from "@react-email/components";
import { BRAND } from "./base";

/* ─── Money formatting ────────────────────────────────────────────────────── */
export function money(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* ─── Shared line-item shape ──────────────────────────────────────────────── */
export interface WorkflowEmailItem {
  name: string;
  sku?: string;
  brand?: string;
  quantity: number;
  unitPrice?: number;
  lineTotal?: number;
  notes?: string;
}

/* ─── Itemized products table ─────────────────────────────────────────────── */
const cellLabel: React.CSSProperties = {
  color: BRAND.gray500,
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.05em",
  margin: "0",
  textTransform: "uppercase",
};

export function EmailItemsTable({
  items,
  currency,
  showPrices = false,
}: {
  items: WorkflowEmailItem[];
  currency: string;
  showPrices?: boolean;
}) {
  return (
    <Section
      style={{
        border: `1px solid ${BRAND.gray200}`,
        borderRadius: "8px",
        margin: "16px 0",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Row style={{ backgroundColor: BRAND.gray50, padding: "10px 16px" }}>
        <Column><Text style={cellLabel}>Product</Text></Column>
        <Column align="right" style={{ width: "56px" }}>
          <Text style={{ ...cellLabel, textAlign: "right" }}>Qty</Text>
        </Column>
        {showPrices && (
          <>
            <Column align="right" style={{ width: "110px" }}>
              <Text style={{ ...cellLabel, textAlign: "right" }}>Unit</Text>
            </Column>
            <Column align="right" style={{ width: "110px" }}>
              <Text style={{ ...cellLabel, textAlign: "right" }}>Total</Text>
            </Column>
          </>
        )}
      </Row>

      {items.map((item, i) => (
        <Row
          key={i}
          style={{
            borderTop: `1px solid ${BRAND.gray200}`,
            padding: "12px 16px",
          }}
        >
          <Column>
            <Text style={{ color: BRAND.gray900, fontSize: "14px", fontWeight: "600", margin: "0" }}>
              {item.name}
            </Text>
            <Text style={{ color: BRAND.gray400, fontSize: "12px", margin: "2px 0 0" }}>
              {[item.brand, item.sku ? `SKU ${item.sku}` : null].filter(Boolean).join(" · ")}
            </Text>
            {item.notes && (
              <Text style={{ color: BRAND.gray500, fontSize: "12px", fontStyle: "italic", margin: "4px 0 0" }}>
                “{item.notes}”
              </Text>
            )}
          </Column>
          <Column align="right" style={{ width: "56px", verticalAlign: "top" }}>
            <Text style={{ color: BRAND.gray700, fontSize: "14px", margin: "0", textAlign: "right" }}>
              {item.quantity}
            </Text>
          </Column>
          {showPrices && (
            <>
              <Column align="right" style={{ width: "110px", verticalAlign: "top" }}>
                <Text style={{ color: BRAND.gray700, fontSize: "13px", margin: "0", textAlign: "right" }}>
                  {item.unitPrice !== undefined ? money(item.unitPrice, currency) : "—"}
                </Text>
              </Column>
              <Column align="right" style={{ width: "110px", verticalAlign: "top" }}>
                <Text style={{ color: BRAND.gray900, fontSize: "13px", fontWeight: "600", margin: "0", textAlign: "right" }}>
                  {item.lineTotal !== undefined
                    ? money(item.lineTotal, currency)
                    : item.unitPrice !== undefined
                      ? money(item.unitPrice * item.quantity, currency)
                      : "—"}
                </Text>
              </Column>
            </>
          )}
        </Row>
      ))}
    </Section>
  );
}

/* ─── Totals block ────────────────────────────────────────────────────────── */
export interface EmailTotalsData {
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  shipping: number;
  grandTotal: number;
  currency: string;
}

function TotalRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  const color = bold ? BRAND.gray900 : BRAND.gray500;
  const size = bold ? "16px" : "13px";
  const weight = bold ? "700" : "400";
  return (
    <Row style={{ padding: "3px 0" }}>
      <Column>
        <Text style={{ color, fontSize: size, fontWeight: weight, margin: "0" }}>{label}</Text>
      </Column>
      <Column align="right">
        <Text style={{ color, fontSize: size, fontWeight: bold ? "700" : "600", margin: "0", textAlign: "right" }}>
          {value}
        </Text>
      </Column>
    </Row>
  );
}

export function EmailTotals({ totals }: { totals: EmailTotalsData }) {
  const c = totals.currency;
  return (
    <Section
      style={{
        backgroundColor: BRAND.gray50,
        border: `1px solid ${BRAND.gray200}`,
        borderRadius: "8px",
        margin: "16px 0",
        padding: "16px 20px",
      }}
    >
      <TotalRow label="Subtotal" value={money(totals.subtotal, c)} />
      {totals.discount > 0 && <TotalRow label="Discount" value={`− ${money(totals.discount, c)}`} />}
      {totals.taxAmount > 0 && (
        <TotalRow label={`Tax (${totals.taxRate}%)`} value={money(totals.taxAmount, c)} />
      )}
      {totals.shipping > 0 && <TotalRow label="Shipping" value={money(totals.shipping, c)} />}
      <Row style={{ borderTop: `1px solid ${BRAND.gray200}`, marginTop: "8px", paddingTop: "10px" }}>
        <Column>
          <Text style={{ color: BRAND.gray900, fontSize: "16px", fontWeight: "700", margin: "0" }}>
            Grand Total
          </Text>
        </Column>
        <Column align="right">
          <Text style={{ color: BRAND.greenDark, fontSize: "18px", fontWeight: "700", margin: "0", textAlign: "right" }}>
            {money(totals.grandTotal, c)}
          </Text>
        </Column>
      </Row>
    </Section>
  );
}

/* ─── Reference hero banner ───────────────────────────────────────────────── */
export function RefHero({ title, refLabel, refValue }: { title: string; refLabel: string; refValue: string }) {
  return (
    <Section
      style={{
        backgroundColor: BRAND.navy,
        borderRadius: "8px",
        margin: "0 0 24px",
        padding: "20px 24px",
      }}
    >
      <Text style={{ color: BRAND.white, fontSize: "20px", fontWeight: "700", margin: "0 0 4px" }}>
        {title}
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", margin: "0" }}>
        {refLabel}: <strong style={{ color: BRAND.white }}>{refValue}</strong>
      </Text>
    </Section>
  );
}

/* ─── Numbered next-steps list ────────────────────────────────────────────── */
export function NextSteps({ steps }: { steps: [string, string][] }) {
  return (
    <Section style={{ margin: "8px 0" }}>
      {steps.map(([title, desc], i) => (
        <Row key={i} style={{ padding: "6px 0" }}>
          <Column style={{ width: "32px", verticalAlign: "top" }}>
            <Text
              style={{
                backgroundColor: BRAND.green,
                borderRadius: "50%",
                color: BRAND.white,
                display: "inline-block",
                fontSize: "12px",
                fontWeight: "700",
                height: "22px",
                lineHeight: "22px",
                margin: "0",
                textAlign: "center",
                width: "22px",
              }}
            >
              {i + 1}
            </Text>
          </Column>
          <Column>
            <Text style={{ color: BRAND.gray900, fontSize: "14px", fontWeight: "600", margin: "0" }}>
              {title}
            </Text>
            <Text style={{ color: BRAND.gray500, fontSize: "13px", margin: "1px 0 0" }}>{desc}</Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}
