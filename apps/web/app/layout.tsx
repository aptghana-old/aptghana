import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { SITE_URL, STORE_URL, EMAIL_INFO } from "@apt/config";
import { safeJsonLd } from "@apt/auth";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "APT Ghana | West Africa's Leading Industrial Technology Platform",
    template: "%s | APT Ghana",
  },
  description:
    "APT Ghana is West Africa's premier industrial technology distributor. Supplying 6,000+ products across electrical, pneumatic, automation, power, and conveying solutions to mining, oil & gas, manufacturing, and energy sectors.",
  keywords: [
    "industrial technology Ghana",
    "automation solutions West Africa",
    "electrical equipment Ghana",
    "pneumatic components",
    "WEG motors Ghana",
    "Schneider Electric distributor Ghana",
    "industrial distributor Accra",
    "PLC automation Ghana",
    "variable frequency drive",
    "motor control Ghana",
  ],
  authors: [{ name: "APT Ghana Limited" }],
  creator: "APT Ghana Limited",
  publisher: "APT Ghana Limited",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: SITE_URL,
    siteName: "APT Ghana",
    title: "APT Ghana | West Africa's Leading Industrial Technology Platform",
    description:
      "Your trusted industrial technology partner in West Africa. 6,000+ products, 26+ brands, expert technical support.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "APT Ghana Industrial Technology" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "APT Ghana | Industrial Technology Platform",
    description: "West Africa's premier industrial technology distributor. Electrical, Automation, Pneumatics & more.",
    images: ["/og-image.jpg"],
  },
  alternates: { canonical: SITE_URL },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "APT Ghana Limited",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: "West Africa's leading industrial technology platform",
  address: {
    "@type": "PostalAddress",
    streetAddress: "North Industrial Area Plot 7 Block 5 Dadeban Street",
    addressLocality: "Accra",
    addressCountry: "GH",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: EMAIL_INFO,
    availableLanguage: "English",
  },
  sameAs: [STORE_URL],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationSchema) }}
        />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
