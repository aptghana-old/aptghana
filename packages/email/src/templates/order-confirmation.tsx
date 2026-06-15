import * as React from "react";
import { Hr, Section, Text } from "@react-email/components";
import { BRAND, BaseLayout, CtaButton, InfoRow, styles } from "./base";
import type { OrderConfirmationPayload, OrderItem } from "../types";

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency }).format(amount);
}

function OrderLineItem({ item }: { item: OrderItem }) {
  return (
    <Section
      style={{
        borderBottom: `1px solid ${BRAND.gray200}`,
        display: "flex" as const,
        gap: "16px",
        padding: "16px 0",
      }}
    >
      <div style={{ flex: 1 }}>
        <Text style={{ color: BRAND.gray900, fontSize: "15px", fontWeight: "600", margin: "0 0 2px" }}>
          {item.name}
        </Text>
        <Text style={{ color: BRAND.gray500, fontSize: "13px", margin: "0" }}>
          SKU: {item.sku} · Qty: {item.quantity}
        </Text>
      </div>
      <div style={{ textAlign: "right" as const }}>
        <Text style={{ color: BRAND.gray900, fontSize: "15px", fontWeight: "600", margin: "0 0 2px" }}>
          {fmt(item.totalPrice, item.currency)}
        </Text>
        <Text style={{ color: BRAND.gray500, fontSize: "13px", margin: "0" }}>
          {fmt(item.unitPrice, item.currency)} each
        </Text>
      </div>
    </Section>
  );
}

export function OrderConfirmationTemplate({
  name, orderRef, orderUrl, items, subtotal, shipping, tax, total, currency, shippingAddress, estimatedDelivery,
}: OrderConfirmationPayload) {
  const addr = shippingAddress;

  return (
    <BaseLayout preview={`Order confirmed — ${orderRef}. Thank you for your order.`}>
      {/* Hero */}
      <Section
        style={{
          backgroundColor: BRAND.green,
          borderRadius: "8px",
          margin: "0 0 24px",
          padding: "20px 24px",
          textAlign: "center" as const,
        }}
      >
        <Text style={{ color: BRAND.white, fontSize: "22px", fontWeight: "700", margin: "0 0 4px" }}>
          Order Confirmed ✓
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", margin: "0" }}>
          Order reference: <strong>{orderRef}</strong>
        </Text>
      </Section>

      <Text style={styles.body1}>
        Hi {name}, thank you for your order. We've received your payment and are preparing your shipment.
      </Text>

      {estimatedDelivery && (
        <Section
          style={{
            backgroundColor: BRAND.gray50,
            border: `1px solid ${BRAND.gray200}`,
            borderRadius: "8px",
            margin: "0 0 24px",
            padding: "14px 20px",
          }}
        >
          <Text style={{ color: BRAND.gray700, fontSize: "14px", margin: "0" }}>
            <strong>Estimated delivery:</strong> {estimatedDelivery}
          </Text>
        </Section>
      )}

      {/* Items */}
      <Text style={{ ...styles.h2, fontSize: "17px" }}>Order Summary</Text>
      {items.map((item, i) => (
        <OrderLineItem key={i} item={item} />
      ))}

      {/* Totals */}
      <Section style={{ margin: "16px 0 0" }}>
        <Section style={{ display: "flex" as const, justifyContent: "space-between" as const, marginBottom: "8px" }}>
          <Text style={{ ...styles.body2, margin: "0" }}>Subtotal</Text>
          <Text style={{ ...styles.body2, margin: "0" }}>{fmt(subtotal, currency)}</Text>
        </Section>
        <Section style={{ display: "flex" as const, justifyContent: "space-between" as const, marginBottom: "8px" }}>
          <Text style={{ ...styles.body2, margin: "0" }}>Shipping</Text>
          <Text style={{ ...styles.body2, margin: "0" }}>{shipping === 0 ? "Free" : fmt(shipping, currency)}</Text>
        </Section>
        <Section style={{ display: "flex" as const, justifyContent: "space-between" as const, marginBottom: "16px" }}>
          <Text style={{ ...styles.body2, margin: "0" }}>Tax</Text>
          <Text style={{ ...styles.body2, margin: "0" }}>{fmt(tax, currency)}</Text>
        </Section>
        <Hr style={{ ...styles.hr, margin: "0 0 12px" }} />
        <Section style={{ display: "flex" as const, justifyContent: "space-between" as const }}>
          <Text style={{ color: BRAND.gray900, fontSize: "17px", fontWeight: "700", margin: "0" }}>Total</Text>
          <Text style={{ color: BRAND.green, fontSize: "17px", fontWeight: "700", margin: "0" }}>{fmt(total, currency)}</Text>
        </Section>
      </Section>

      <Hr style={styles.hr} />

      {/* Shipping address */}
      <Text style={{ ...styles.h2, fontSize: "17px" }}>Shipping Address</Text>
      <InfoRow label="" value={
        <>
          {addr.line1}<br />
          {addr.line2 && <>{addr.line2}<br /></>}
          {addr.city}{addr.region ? `, ${addr.region}` : ""}<br />
          {addr.country}
        </>
      } />

      <CtaButton href={orderUrl} label="Track Your Order" />
    </BaseLayout>
  );
}

export default OrderConfirmationTemplate;
