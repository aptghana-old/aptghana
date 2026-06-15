import * as React from "react";
import {
  Body,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { STORE_URL } from "@apt/config";

/* ─── Brand tokens ──────────────────────────────────────────────────────────── */
export const BRAND = {
  green:        "#1a7a4a",
  greenLight:   "#22a05a",
  greenDark:    "#145e38",
  navy:         "#0f1f2e",
  navyLight:    "#1a2d40",
  white:        "#ffffff",
  offWhite:     "#f8f9fa",
  gray50:       "#f9fafb",
  gray100:      "#f3f4f6",
  gray200:      "#e5e7eb",
  gray400:      "#9ca3af",
  gray500:      "#6b7280",
  gray700:      "#374151",
  gray900:      "#111827",
  red:          "#dc2626",
  amber:        "#d97706",
  blue:         "#2563eb",
  footerBg:     "#1a2d40",
  footerText:   "#94a3b8",
};

export const FONTS = {
  body:    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono:    "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
};

/* ─── Shared styles ─────────────────────────────────────────────────────────── */
export const styles = {
  html:       { fontFamily: FONTS.body },
  body:       { backgroundColor: BRAND.gray100, margin: "0", padding: "0" },
  wrapper:    { backgroundColor: BRAND.gray100, padding: "40px 16px" },
  container:  { backgroundColor: BRAND.white, borderRadius: "12px", overflow: "hidden", maxWidth: "600px", margin: "0 auto", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  header:     { backgroundColor: BRAND.navy, padding: "24px 32px", display: "flex" as const, alignItems: "center" as const },
  logo:       { height: "36px", width: "auto" },
  content:    { padding: "40px 32px" },
  footer:     { backgroundColor: BRAND.footerBg, padding: "24px 32px" },
  h1:         { color: BRAND.gray900, fontSize: "24px", fontWeight: "700", lineHeight: "1.3", margin: "0 0 12px" },
  h2:         { color: BRAND.gray900, fontSize: "20px", fontWeight: "600", lineHeight: "1.4", margin: "0 0 12px" },
  body1:      { color: BRAND.gray700, fontSize: "16px", lineHeight: "1.6", margin: "0 0 16px" },
  body2:      { color: BRAND.gray500, fontSize: "14px", lineHeight: "1.6", margin: "0 0 12px" },
  small:      { color: BRAND.gray400, fontSize: "12px", lineHeight: "1.5", margin: "0" },
  link:       { color: BRAND.green, textDecoration: "underline" },
  hr:         { borderColor: BRAND.gray200, margin: "24px 0" },
  footerText: { color: BRAND.footerText, fontSize: "12px", lineHeight: "1.6", margin: "0 0 4px" },
  footerLink: { color: BRAND.footerText, textDecoration: "underline" },
};

/* ─── CTA button ────────────────────────────────────────────────────────────── */
interface CtaButtonProps {
  href:    string;
  label:   string;
  variant?: "primary" | "danger" | "secondary";
}

export function CtaButton({ href, label, variant = "primary" }: CtaButtonProps) {
  const bg =
    variant === "danger"    ? BRAND.red    :
    variant === "secondary" ? BRAND.gray500 :
    BRAND.green;

  return (
    <Section style={{ textAlign: "center" as const, margin: "28px 0" }}>
      <Link
        href={href}
        style={{
          backgroundColor: bg,
          borderRadius: "8px",
          color: BRAND.white,
          display: "inline-block",
          fontFamily: FONTS.body,
          fontSize: "16px",
          fontWeight: "600",
          lineHeight: "1",
          padding: "14px 32px",
          textDecoration: "none",
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </Link>
    </Section>
  );
}

/* ─── Alert banner ──────────────────────────────────────────────────────────── */
interface AlertBannerProps {
  type:    "info" | "warning" | "success" | "alert";
  message: string;
}

const ALERT_STYLES: Record<AlertBannerProps["type"], { bg: string; border: string; color: string }> = {
  info:    { bg: "#eff6ff", border: "#3b82f6", color: "#1e40af" },
  warning: { bg: "#fffbeb", border: "#f59e0b", color: "#92400e" },
  success: { bg: "#f0fdf4", border: BRAND.green, color: BRAND.greenDark },
  alert:   { bg: "#fef2f2", border: BRAND.red,  color: "#991b1b" },
};

export function AlertBanner({ type, message }: AlertBannerProps) {
  const s = ALERT_STYLES[type];
  return (
    <Section
      style={{
        backgroundColor: s.bg,
        borderLeft: `4px solid ${s.border}`,
        borderRadius: "0 8px 8px 0",
        margin: "16px 0",
        padding: "12px 16px",
      }}
    >
      <Text style={{ color: s.color, fontSize: "14px", lineHeight: "1.5", margin: "0" }}>
        {message}
      </Text>
    </Section>
  );
}

/* ─── Info row ──────────────────────────────────────────────────────────────── */
export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Section style={{ marginBottom: "8px" }}>
      <Text style={{ color: BRAND.gray500, fontSize: "12px", fontWeight: "600", letterSpacing: "0.05em", margin: "0 0 2px", textTransform: "uppercase" as const }}>
        {label}
      </Text>
      <Text style={{ color: BRAND.gray900, fontSize: "14px", margin: "0" }}>
        {value}
      </Text>
    </Section>
  );
}

/* ─── Base layout ────────────────────────────────────────────────────────────  */
interface BaseLayoutProps {
  preview:  string;
  children: React.ReactNode;
}

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html lang="en" dir="ltr" style={styles.html}>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{ url: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2", format: "woff2" }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{ url: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2", format: "woff2" }}
          fontWeight={600}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Section style={styles.wrapper}>
          <Container style={styles.container}>
            {/* Header */}
            <Section style={styles.header}>
              <Img
                src={`${STORE_URL}/logo-white.png`}
                alt="APT Ghana"
                height={36}
                style={{ display: "block" }}
              />
            </Section>

            {/* Content */}
            <Section style={styles.content}>
              {children}
            </Section>

            <Hr style={styles.hr} />

            {/* Footer */}
            <Section style={styles.footer}>
              <Text style={styles.footerText}>
                © {new Date().getFullYear()} Automation &amp; Plant Technologies Ltd. All rights reserved.
              </Text>
              <Text style={styles.footerText}>
                Plot 48 Liberation Road, Accra, Ghana · +233 302 000 000
              </Text>
              <Text style={{ ...styles.footerText, marginTop: "12px" }}>
                <Link href={`${STORE_URL}/privacy`} style={styles.footerLink}>Privacy Policy</Link>
                {" · "}
                <Link href={`${STORE_URL}/terms`} style={styles.footerLink}>Terms of Service</Link>
                {" · "}
                <Link href={`${STORE_URL}/contact`} style={styles.footerLink}>Contact Us</Link>
              </Text>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}
