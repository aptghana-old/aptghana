import * as React from "react";
import { Hr, Section, Text } from "@react-email/components";
import { BRAND, BaseLayout, CtaButton, InfoRow, styles } from "./base";
import type { ShippingUpdatePayload } from "../types";
import { EMAIL_SUPPORT } from "@apt/config";

const STATUS_COPY: Record<ShippingUpdatePayload["status"], { icon: string; title: string; desc: string; color: string }> = {
  shipped: {
    icon: "📦",
    title: "Your order has shipped",
    desc: "Your order is on its way.",
    color: BRAND.blue,
  },
  out_for_delivery: {
    icon: "🚚",
    title: "Out for delivery",
    desc: "Your order will arrive today.",
    color: BRAND.amber,
  },
  delivered: {
    icon: "✅",
    title: "Delivered",
    desc: "Your order has been delivered.",
    color: BRAND.green,
  },
};

export function ShippingUpdateTemplate({
  name, orderRef, orderUrl, carrier, trackingNumber, trackingUrl, status, estimatedDelivery, shippingAddress,
}: ShippingUpdatePayload) {
  const info = STATUS_COPY[status];
  const addr = shippingAddress;

  return (
    <BaseLayout preview={`${info.title} — Order ${orderRef}`}>
      {/* Status hero */}
      <Section
        style={{
          backgroundColor: info.color,
          borderRadius: "8px",
          margin: "0 0 24px",
          padding: "20px 24px",
          textAlign: "center" as const,
        }}
      >
        <Text style={{ fontSize: "36px", margin: "0 0 4px" }}>{info.icon}</Text>
        <Text style={{ color: BRAND.white, fontSize: "20px", fontWeight: "700", margin: "0 0 4px" }}>
          {info.title}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px", margin: "0" }}>
          Order #{orderRef}
        </Text>
      </Section>

      <Text style={styles.body1}>
        Hi {name}, {info.desc}
      </Text>

      {/* Tracking info */}
      <Section
        style={{
          backgroundColor: BRAND.gray50,
          border: `1px solid ${BRAND.gray200}`,
          borderRadius: "8px",
          margin: "0 0 24px",
          padding: "20px 24px",
        }}
      >
        {carrier        && <InfoRow label="Carrier"          value={carrier} />}
        {trackingNumber && <InfoRow label="Tracking Number"  value={trackingNumber} />}
        {estimatedDelivery && <InfoRow label="Est. Delivery" value={estimatedDelivery} />}
        <InfoRow
          label="Shipping To"
          value={
            <>
              {addr.line1}
              {addr.line2 ? `, ${addr.line2}` : ""},{" "}
              {addr.city}{addr.region ? `, ${addr.region}` : ""},{" "}
              {addr.country}
            </>
          }
        />
      </Section>

      {trackingUrl ? (
        <CtaButton href={trackingUrl} label="Track Shipment" />
      ) : (
        <CtaButton href={orderUrl} label="View Order" />
      )}

      <Hr style={styles.hr} />
      <Text style={styles.body2}>
        If you have any questions about your delivery, contact us at{" "}
        <a href={`mailto:${EMAIL_SUPPORT}`} style={styles.link}>{EMAIL_SUPPORT}</a>.
      </Text>
    </BaseLayout>
  );
}

export default ShippingUpdateTemplate;
