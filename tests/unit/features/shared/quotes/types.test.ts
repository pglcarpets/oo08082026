/**
 * Name-mirror: features/shared/quotes/types
 */

import { describe, expect, it } from "vitest";
import type {
  QuoteLineItem,
  QuoteResult,
  SharedQuote,
  SharedQuoteItem,
} from "@/features/shared/quotes/types";

describe("shared quotes types", () => {
  it("shapes cart quote items and BOQ quote results with pending pricing", () => {
    const cartItem: SharedQuoteItem = {
      product: {
        id: "p1",
        name: "Task chair",
        sku: "CH-1",
        category_id: "seating",
        price: null,
      },
      quantity: 2,
    };
    const cart: SharedQuote = {
      id: "cart-1",
      items: [cartItem],
      totalAmount: 0,
    };

    const line: QuoteLineItem = {
      productName: "Task chair",
      sku: "CH-1",
      category: "seating",
      quantity: 2,
      widthMm: 600,
      depthMm: 600,
      heightMm: 1100,
      unitPriceInr: null,
      lineTotal: null,
    };
    const result: QuoteResult = {
      mode: "auto",
      lineItems: [line],
      pricedTotal: 0,
      hasPendingItems: true,
      pendingCount: 1,
      generatedAt: "2026-07-14T12:00:00.000Z",
    };

    expect(cart.items[0].product.price).toBeNull();
    expect(result.lineItems[0].unitPriceInr).toBeNull();
    expect(result.hasPendingItems).toBe(true);
  });
});
