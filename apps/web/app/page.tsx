import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { SITE_URL, STORE_URL, EMAIL_SALES } from "@apt/config";
import { safeJsonLd } from "@apt/auth";
import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import Hero from "@/components/home/Hero";
import WhoWeAre from "@/components/home/WhoWeAre";
import CertifiedPartnership from "@/components/home/CertifiedPartnership";
import Solutions from "@/components/home/Solutions";
import Industries from "@/components/home/Industries";
import Brands from "@/components/home/Brands";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import ContactSection from "@/components/home/ContactSection";

const sora = Sora({
  subsets: [ "latin" ],
  display: "swap",
  variable: "--font-sora",
  weight: [ "400", "600", "700", "800" ],
});

export const metadata: Metadata = {
  title: "APT Ghana | West Africa's Leading Industrial Technology Platform",
  description:
    "APT Ghana delivers enterprise-grade automation, electrical distribution, and industrial solutions to mining, manufacturing, energy, and infrastructure sectors across West Africa. Official Schneider Electric distributor since 2009.",
  keywords: [
    "APT Ghana",
    "Automation Plant Technologies Ghana",
    "industrial automation Ghana",
    "Schneider Electric distributor",
    "mining equipment West Africa",
    "electrical solutions Ghana",
    "manufacturing automation",
  ],
  openGraph: {
    title: "APT Ghana | West Africa's Leading Industrial Technology Platform",
    description:
      "Supplying 6,000+ industrial products from 26+ global brands to Ghana's mining, manufacturing, energy, and infrastructure sectors.",
    url: SITE_URL,
    type: "website",
    images: [ { url: `${SITE_URL}/og-image.png`, alt: "APT Ghana" } ],
  },
  twitter: {
    card: "summary_large_image",
    title: "APT Ghana | Industrial Technology Platform",
    description:
      "Enterprise automation and electrical solutions for West Africa's leading industries.",
  },
  robots: { index: true, follow: true },
};

export const revalidate = 3600;

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "APT Ghana",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${STORE_URL}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#local`,
  name: "APT Ghana Limited",
  description:
    "West Africa's leading industrial technology platform. Official Schneider Electric distributor.",
  url: SITE_URL,
  telephone: "+233-30-396-4346",
  email: EMAIL_SALES,
  priceRange: "$$",
  openingHours: "Mo-Fr 08:00-17:00",
  address: {
    "@type": "PostalAddress",
    streetAddress: "North Industrial Area Plot 7 Block 5 Dadeban Street",
    addressLocality: "Accra",
    addressCountry: "GH",
  },
  geo: { "@type": "GeoCoordinates", latitude: 5.614818, longitude: -0.205874 },
};

export default function HomePage() {
  return (
    <div className={sora.variable}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(localBusinessSchema) }}
      />
      <Header />
      <main>
        {/* 1. Full-viewport hero with search + glassmorphism stats */}
        <Hero />
        {/* 2. Company story — Who We Are */}
        <WhoWeAre />
        {/* 3. Schneider Electric certified partnership */}
        <CertifiedPartnership />
        {/* 4. End-to-end service capabilities */}
        <Solutions />
        {/* 6. Industries with real photography */}
        <Industries />
        {/* 8. Brand partners */}
        <Brands />
        {/* 9. Awards, recognitions, why choose APT */}
        <WhyChooseUs />
        {/* 10. Contact cards + quote CTA */}
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
