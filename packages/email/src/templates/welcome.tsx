import * as React from "react";
import { Hr, Section, Text } from "@react-email/components";
import { BRAND, BaseLayout, CtaButton, styles } from "./base";
import type { WelcomePayload } from "../types";
import { EMAIL_SUPPORT } from "@apt/config";

const FEATURES = [
  { icon: "📦", title: "Product Catalogue", desc: "Browse thousands of industrial automation and electrical products." },
  { icon: "💬", title: "Request for Quotation", desc: "Get competitive pricing for bulk orders and special requirements." },
  { icon: "📋", title: "Order History", desc: "Track all your orders and reorder with a single click." },
  { icon: "🔔", title: "Stock Alerts", desc: "Get notified when products are back in stock or on clearance." },
];

export function WelcomeTemplate({ name, accountType, company, loginUrl }: WelcomePayload) {
  return (
    <BaseLayout preview={`Welcome to APT Ghana, ${name}! Your account is active.`}>
      <Section
        style={{
          backgroundColor: BRAND.green,
          borderRadius: "8px",
          margin: "0 0 24px",
          padding: "24px",
          textAlign: "center" as const,
        }}
      >
        <Text
          style={{
            color: BRAND.white,
            fontSize: "28px",
            fontWeight: "700",
            margin: "0 0 4px",
          }}
        >
          Welcome to APT Ghana
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: "16px", margin: "0" }}>
          Your {accountType === "business" ? "business" : "personal"} account is ready
          {company ? ` — ${company}` : ""}
        </Text>
      </Section>

      <Text style={styles.body1}>
        Hi {name}, your account has been verified and activated. You now have full access to APT Ghana's enterprise platform.
      </Text>

      <CtaButton href={loginUrl} label="Go to Your Dashboard" />

      <Hr style={styles.hr} />

      <Text style={{ ...styles.h2, fontSize: "18px" }}>What you can do now</Text>

      {FEATURES.map((f) => (
        <Section key={f.title} style={{ marginBottom: "16px", display: "flex" as const, gap: "12px" }}>
          <Text style={{ fontSize: "24px", margin: "0 0 4px" }}>{f.icon}</Text>
          <div>
            <Text style={{ ...styles.body1, fontWeight: "600", margin: "0 0 2px" }}>{f.title}</Text>
            <Text style={{ ...styles.body2, margin: "0" }}>{f.desc}</Text>
          </div>
        </Section>
      ))}

      <Hr style={styles.hr} />

      <Text style={styles.body2}>
        Questions? Reply to this email or contact our team at{" "}
        <a href={`mailto:${EMAIL_SUPPORT}`} style={styles.link}>{EMAIL_SUPPORT}</a>.
      </Text>
    </BaseLayout>
  );
}

export default WelcomeTemplate;
