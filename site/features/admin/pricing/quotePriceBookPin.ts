/**
 * Admin P05 / Buyer P04 — pin a quote to an immutable price-book version.
 */

import {
  lineTotalMinor,
  priceForSku,
  type PriceBookContract,
} from "./priceBookContract";

export type QuoteBoqLine = {
  readonly sku: string;
  readonly quantity: number;
};

export type PinnedQuotePriceBook = {
  readonly quoteId: string;
  readonly bookId: string;
  readonly versionId: string;
  readonly pinnedAt: string;
};

export type QuoteLineBreakdown = {
  readonly sku: string;
  readonly quantity: number;
  readonly unitPriceMinor: number | null;
  readonly adjustmentBps: number;
  readonly lineTotalMinor: number | null;
  readonly unavailable: boolean;
};

export function pinQuotePriceBook(
  quoteId: string,
  book: PriceBookContract,
  versionId: string,
): PinnedQuotePriceBook {
  return {
    quoteId,
    bookId: book.bookId,
    versionId,
    pinnedAt: new Date().toISOString(),
  };
}

export function computePinnedQuoteBreakdown(
  pin: PinnedQuotePriceBook,
  book: PriceBookContract,
  lines: readonly QuoteBoqLine[],
): {
  readonly pin: PinnedQuotePriceBook;
  readonly lines: readonly QuoteLineBreakdown[];
  readonly totalMinor: number | null;
} {
  const breakdown: QuoteLineBreakdown[] = [];
  let total = 0;
  let hasUnavailable = false;

  for (const line of lines) {
    const rule = priceForSku(book, pin.versionId, line.sku);
    if (!rule) {
      hasUnavailable = true;
      breakdown.push({
        sku: line.sku,
        quantity: line.quantity,
        unitPriceMinor: null,
        adjustmentBps: 0,
        lineTotalMinor: null,
        unavailable: true,
      });
      continue;
    }
    const lineTotal = lineTotalMinor(rule, line.quantity);
    if (lineTotal === null) {
      hasUnavailable = true;
      breakdown.push({
        sku: line.sku,
        quantity: line.quantity,
        unitPriceMinor: rule.unitPriceMinor,
        adjustmentBps: rule.adjustmentBps ?? 0,
        lineTotalMinor: null,
        unavailable: true,
      });
      continue;
    }
    total += lineTotal;
    breakdown.push({
      sku: line.sku,
      quantity: line.quantity,
      unitPriceMinor: rule.unitPriceMinor,
      adjustmentBps: rule.adjustmentBps ?? 0,
      lineTotalMinor: lineTotal,
      unavailable: false,
    });
  }

  return {
    pin,
    lines: breakdown,
    totalMinor: hasUnavailable ? null : total,
  };
}

/** Past quotes keep their pinned version even when the active book advances. */
export function quoteStillValidAgainstBook(
  pin: PinnedQuotePriceBook,
  book: PriceBookContract,
): boolean {
  return book.versions.some((version) => version.versionId === pin.versionId);
}

/** Pin at activation time so released books stay reproducible for saved quotes. */
export function pinQuoteAtBookVersion(
  quoteId: string,
  book: PriceBookContract,
  versionId: string,
): PinnedQuotePriceBook | { ok: false; error: string } {
  const version = book.versions.find((entry) => entry.versionId === versionId);
  if (!version) {
    return { ok: false, error: `Version "${versionId}" not found on book ${book.bookId}` };
  }
  if (version.status !== "active" && version.status !== "approved" && version.status !== "draft") {
    return { ok: false, error: `Version "${versionId}" is not pin-able (status ${version.status})` };
  }
  return pinQuotePriceBook(quoteId, book, versionId);
}

/** Released version rules are frozen — pinned totals ignore a newer active version. */
export function reproduciblePinnedTotal(
  pin: PinnedQuotePriceBook,
  bookAtPinTime: PriceBookContract,
  bookAfterAdvance: PriceBookContract,
  lines: readonly QuoteBoqLine[],
): boolean {
  const atPin = computePinnedQuoteBreakdown(pin, bookAtPinTime, lines).totalMinor;
  const afterAdvance = computePinnedQuoteBreakdown(pin, bookAfterAdvance, lines).totalMinor;
  return atPin === afterAdvance && quoteStillValidAgainstBook(pin, bookAfterAdvance);
}