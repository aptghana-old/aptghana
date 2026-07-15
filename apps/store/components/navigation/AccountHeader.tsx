"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import UserAccountButton from "./UserAccountButton";
import { useCart } from "@/lib/store/cart";


/* ─── Icons ──────────────────────────────────────────────────────────────── */
function Icon({ d, size = 20, strokeWidth = 1.75, className = "", style }: { d: string; size?: number; strokeWidth?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function AccountHeader() {
  const [ scrolled, setScrolled ] = useState(false);
  const { count: cartCount } = useCart();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className={`sticky top-0 z-50 transition-shadow duration-200 ${scrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.4)]" : ""}`}
      >
        {/* ── Desktop header row (lg+): Logo · Search · Actions ── */}
        <div className="hidden lg:block bg-[var(--apt-bg)]">
          <div className="container-store">
            <div className="flex items-center gap-3 h-15 justify-between">

              {/* Logo */}
              <Link href="/" className="flex items-center shrink-0">
                <Image src="/logo.png" alt="APT Ghana" width={140} height={69}
                  className="h-10 w-auto object-contain dark:invert" priority />
              </Link>

              {/* Actions */}
              <div className="flex items-center gap-0.5 shrink-0">
                <UserAccountButton />

                <Link
                  href="/cart"
                  className="relative p-2 text-[var(--apt-text-muted)] hover:text-[var(--apt-text)] hover:bg-[var(--apt-bg-subtle)] rounded-lg transition-all"
                  aria-label="Cart"
                >
                  <Icon d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" size={20} />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 text-[9px] font-bold bg-[var(--apt-color-primary)] text-white rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/rfq"
                  className="flex items-center gap-1.5 h-9 px-4 bg-[var(--apt-color-primary)] hover:bg-[var(--apt-color-primary)_/90] text-white text-[13px] font-bold rounded-lg ml-1 transition-colors shadow-md"
                >
                  <Icon d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" size={16} />
                  RFQ
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile header (< lg): Row 1 + Row 2 ── */}
        <div className="lg:hidden bg-[var(--apt-bg)]">
          <div className="container-store">

            {/* Row 1: Logo (left) · Account, Wishlist, Cart, Menu (right) */}
            <div className="flex items-center h-14">
              <Link href="/" className="flex items-center shrink-0">
                <Image src="/logo.png" alt="APT Ghana" width={120} height={59}
                  className="h-9 w-auto object-contain" priority />
              </Link>

              <div className="ml-auto flex items-center gap-0.5">
                <UserAccountButton />

                <Link
                  href="/cart"
                  className="relative p-2 text-[var(--apt-text-muted)] hover:text-[var(--apt-text)] hover:bg-[var(--apt-bg-subtle)] rounded-lg transition-all"
                  aria-label="Cart"
                >
                  <Icon d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" size={20} />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 text-[9px] font-bold bg-[var(--apt-color-primary)] text-white rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
