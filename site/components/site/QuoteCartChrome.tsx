"use client";

import { useEffect } from "react";
import { useProductCompare } from "@/lib/store/productCompare";
import { useQuoteCart } from "@/lib/store/quoteCart";

/**
 * Deferred zustand persist rehydrate for quote cart + product compare.
 * skipHydration stores must rehydrate after mount to avoid React 19
 * "state update on a component that hasn't mounted yet" console errors.
 * No floating dock — shortlist lives on /quote-cart only.
 */
export function QuoteCartChrome() {
  useEffect(() => {
    void useQuoteCart.persist.rehydrate();
    void useProductCompare.persist.rehydrate();
  }, []);

  return null;
}
