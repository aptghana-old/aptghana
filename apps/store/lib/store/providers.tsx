"use client";

import { type ReactNode } from "react";
import { CartProvider }     from "./cart";
import { ApprovalDraftProvider, RfqDraftProvider } from "./request-draft";
import { WishlistProvider } from "./wishlist";
import { CompareProvider }  from "./compare";
import CompareBar           from "@/components/store/CompareBar";
import CompareModal         from "@/components/store/CompareModal";

export function StoreProviders({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <ApprovalDraftProvider>
        <RfqDraftProvider>
          <WishlistProvider>
            <CompareProvider>
              {children}
              <CompareBar />
              <CompareModal />
            </CompareProvider>
          </WishlistProvider>
        </RfqDraftProvider>
      </ApprovalDraftProvider>
    </CartProvider>
  );
}
