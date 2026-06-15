export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterSocial {
  label: string;
  href: string;
  /** SVG path string */
  iconPath: string;
  viewBox?: string;
  /** true = fill, false = stroke */
  filled?: boolean;
}

export interface FooterContact {
  iconPath: string;
  text: string;
  href: string;
}

export interface FooterBrand {
  /** Short text rendered in the logo badge */
  logoText: string;
  /** Displayed name next to the logo */
  name: string;
  /** Subdomain / tagline under name */
  tagline: string;
  /** Where the logo links */
  href: string;
  /** Short description paragraph */
  description: string;
}

export interface FooterNewsletter {
  heading: string;
  subheading: string;
  /** API route for the subscribe action */
  action: string;
}

export interface FooterFeaturedBrand {
  name: string;
  href: string;
}

export interface FooterConfig {
  brand: FooterBrand;
  contact: FooterContact[];
  socials: FooterSocial[];
  columns: FooterColumn[];
  legalLinks: FooterLink[];
  certifications?: string[];
  /** Newsletter bar — omit to hide */
  newsletter?: FooterNewsletter;
  /** Featured brands strip — omit to hide */
  featuredBrands?: FooterFeaturedBrand[];
  /** Tailwind container utility class */
  containerClass?: string;
}
