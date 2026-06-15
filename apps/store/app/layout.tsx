import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/navigation/ThemeProvider";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { StoreProviders } from "@/lib/store/providers";
import { STORE_URL } from "@apt/config";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(STORE_URL),
  title: {
    default: "APT Ghana Store | Industrial Products Online",
    template: "%s | APT Ghana Store",
  },
  description:
    "Shop 6,000+ industrial products online. Electrical, pneumatic, automation, and conveying solutions from top global brands. Fast shipping in Ghana.",
};

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('apt-theme')||'system';if(t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`;

export interface NavSubcategory { name: string; slug: string; href: string; }
export interface NavCategory {
  name: string; slug: string; href: string;
  desc?: string; image?: string; subcategories?: NavSubcategory[];
}
export interface NavGroup {
  id: string; label: string; slug: string; href: string;
  color: string; iconPath: string; iconImage?: string; description?: string;
  categories: NavCategory[];
  featured: { name: string; tag: string; href: string; desc: string };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col antialiased">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <ThemeProvider>
          <SessionProvider>
            <StoreProviders>
              <AnalyticsProvider>
                {children}
              </AnalyticsProvider>
            </StoreProviders>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
