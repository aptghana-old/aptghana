import { FooterBase } from "@apt/ui";
import type { FooterConfig } from "@apt/ui";
import { EMAIL_SALES, CONTACT_PHONE, CONTACT_PHONE_HREF, CONTACT_ADDRESS, CONTACT_MAPS_URL, SOCIAL_LINKS } from "@apt/config";

const WEB_FOOTER_CONFIG: FooterConfig = {
  brand: {
    logoText: "APT",
    name: "APT Ghana",
    tagline: "Industrial Technology",
    href: "/",
    description:
      "West Africa's premier industrial technology distributor. Supplying 6,000+ products to Ghana's leading industries since 1999.",
  },

  contact: [
    {
      iconPath:
        "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z",
      text: CONTACT_PHONE,
      href: CONTACT_PHONE_HREF,
    },
    {
      iconPath:
        "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
      text: EMAIL_SALES,
      href: `mailto:${EMAIL_SALES}`,
    },
    {
      iconPath:
        "M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
      text: CONTACT_ADDRESS,
      href: CONTACT_MAPS_URL,
    },
  ],

  socials: [
    {
      label: "LinkedIn",
      href: SOCIAL_LINKS.linkedin,
      iconPath:
        "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z",
      filled: true,
    },
    {
      label: "Twitter / X",
      href: SOCIAL_LINKS.twitter,
      iconPath:
        "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
      filled: true,
    },
    {
      label: "YouTube",
      href: SOCIAL_LINKS.youtube,
      iconPath:
        "M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75l4.5 2.25-4.5 2.25V9.75z",
      filled: false,
    },
  ],

  columns: [
    {
      title: "Solutions",
      links: [
        { label: "Electrical Solutions", href: "/solutions/electrical" },
        { label: "Automation & Control", href: "/solutions/automation" },
        { label: "Pneumatic Systems", href: "/solutions/pneumatics" },
        { label: "Power & Energy", href: "/solutions/power" },
        { label: "Conveying Solutions", href: "/solutions/conveying" },
        { label: "All Solutions", href: "/solutions" },
      ],
    },
    {
      title: "Industries",
      links: [
        { label: "Mining & Resources", href: "/industries/mining" },
        { label: "Manufacturing", href: "/industries/manufacturing" },
        { label: "Power & Energy", href: "/industries/energy" },
        { label: "Water & Utilities", href: "/industries/water" },
        { label: "Ports & Logistics", href: "/industries/ports" },
        { label: "Construction", href: "/industries/construction" },
        { label: "All Industries", href: "/industries" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Technical Library", href: "/resources/library" },
        { label: "Case Studies", href: "/resources/case-studies" },
        { label: "News & Insights", href: "/resources/news" },
        { label: "All Resources", href: "/resources" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About APT Ghana", href: "/company/about" },
        { label: "Our Services", href: "/services" },
        { label: "Brand Partners", href: "/brands" },
        { label: "Careers", href: "/company/careers" },
        { label: "Contact Us", href: "/contact" },
      ],
    },
  ],

  featuredBrands: [
    { name: "Schneider Electric", href: "/brands/schneider-electric" },
    { name: "WEG", href: "/brands/weg" },
    { name: "Camozzi", href: "/brands/camozzi" },
    { name: "Telemecanique", href: "/brands/telemecanique" },
    { name: "Provulco", href: "/brands/provulco" },
    { name: "EMC", href: "/brands/emc" },
    { name: "View all brands →", href: "/brands" },
  ],

  legalLinks: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Sitemap", href: "/sitemap.xml" },
  ],

  certifications: ["ISO 9001", "GSA Registered"],

  containerClass: "container-apt",
};

export default function Footer() {
  return <FooterBase config={WEB_FOOTER_CONFIG} />;
}
