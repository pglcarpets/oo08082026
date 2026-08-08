/**
 * Name-mirror: features/shared/quotes/index
 */

import { describe, expect, it } from "vitest";
import type {
  QuoteResult,
  SharedQuote,
  SharedQuoteItem,
} from "@/features/shared/quotes/index";

describe("shared quotes index", () => {
  it("re-exports quote type contracts from the barrel", async () => {
    const mod = await import("@/features/shared/quotes/index");
    expect(mod).toBeDefined();

    const item: SharedQuoteItem = {
      product: {
        id: "p1",
        name: "Desk",
        sku: "D-1",
        category_id: "ws",
        price: 1000,
      },
      quantity: 3,
    };
    const quote: SharedQuote = {
      id: "q1",
      items: [item],
      totalAmount: 3000,
    };
    const result: QuoteResult = {
      mode: "request",
      lineItems: [],
      pricedTotal: 0,
      hasPendingItems: true,
      pendingCount: 1,
      generatedAt: "2026-07-14T00:00:00.000Z",
    };

    expect(quote.items[0].quantity).toBe(3);
    expect(result.mode).toBe("request");
  });
});
