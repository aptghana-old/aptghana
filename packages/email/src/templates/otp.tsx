import * as React from "react";
import { Section, Text } from "@react-email/components";
import { BRAND, FONTS, AlertBanner, BaseLayout, styles } from "./base";
import type { OTPPayload } from "../types";

export function OTPTemplate({ name, otp, purpose, expiresInMinutes }: OTPPayload) {
  const digits = otp.split("");

  return (
    <BaseLayout preview={`Your APT Ghana verification code is ${otp}`}>
      <Text style={styles.h1}>Your verification code</Text>
      <Text style={styles.body1}>
        Hi {name}, use the code below to {purpose}.
      </Text>

      {/* OTP display block */}
      <Section
        style={{
          backgroundColor: BRAND.gray50,
          border: `2px solid ${BRAND.gray200}`,
          borderRadius: "12px",
          margin: "24px 0",
          padding: "28px 24px",
          textAlign: "center" as const,
        }}
      >
        <div style={{ display: "inline-flex", gap: "8px", justifyContent: "center" }}>
          {digits.map((d, i) => (
            <span
              key={i}
              style={{
                backgroundColor: BRAND.white,
                border: `2px solid ${BRAND.green}`,
                borderRadius: "8px",
                color: BRAND.navy,
                display: "inline-block",
                fontFamily: FONTS.mono,
                fontSize: "32px",
                fontWeight: "700",
                height: "56px",
                letterSpacing: "0",
                lineHeight: "52px",
                textAlign: "center" as const,
                width: "48px",
              }}
            >
              {d}
            </span>
          ))}
        </div>
        <Text style={{ color: BRAND.gray500, fontSize: "13px", margin: "12px 0 0" }}>
          Expires in {expiresInMinutes} minute{expiresInMinutes !== 1 ? "s" : ""}
        </Text>
      </Section>

      <AlertBanner
        type="warning"
        message={`Never share this code. APT Ghana will never ask for your OTP. If you didn't request this, contact support immediately.`}
      />

      <Text style={styles.body2}>
        This code is valid for a single use only. If it has expired, please request a new one.
      </Text>
    </BaseLayout>
  );
}

export default OTPTemplate;
