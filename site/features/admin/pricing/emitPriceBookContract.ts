/**
 * Admin P05 — map persisted price-book rows → documented JSON contract.
 * Released versions are immutable; emit is a pure projection for Buyer P04 fixtures.
 */

import type {
  PriceBookContract,
  PriceBookCurrency,
  PriceBookLineRule,
  PriceBookVersion,
} from "./priceBookContract";

export type PriceBookRow = {
  readonly familySlug: string;
  readonly bookId: string;
  readonly activeVersionId: string | null;
};

export type PriceBookVersionRow = {
  readonly versionId: string;
  readonly effectiveFrom: string;
  readonly currency: string;
  readonly status: PriceBookVersion["status"];
  readonly rules: readonly PriceBookLineRule[];
};

const CURRENCIES = new Set<PriceBookCurrency>(["INR", "USD"]);

function isCurrency(value: string): value is PriceBookCurrency {
  return CURRENCIES.has(value as PriceBookCurrency);
}

function normalizeRule(raw: unknown): PriceBookLineRule | null {
  if (!raw || typeof raw !== "object") {return null;}
  const row = raw as Record<string, unknown>;
  const sku = typeof row.sku === "string" ? row.sku.trim() : "";
  const unitPriceMinor =
    typeof row.unitPriceMinor === "number" ? row.unitPriceMinor : Number.NaN;
  const currency = typeof row.currency === "string" ? row.currency : "";
  const uom = row.uom;
  if (
    sku === "" ||
    !Number.isFinite(unitPriceMinor) ||
    unitPriceMinor < 0 ||
    !isCurrency(currency) ||
    (uom !== "each" && uom !== "mm" && uom !== "sqm" && uom !== "seat")
  ) {
    return null;
  }
  const adjustmentBps =
    typeof row.adjustmentBps === "number" && Number.isFinite(row.adjustmentBps)
      ? row.adjustmentBps
      : undefined;
  return {
    sku,
    unitPriceMinor,
    currency,
    uom,
    ...(adjustmentBps !== undefined ? { adjustmentBps } : {}),
  };
}

export function emitPriceBookContract(
  book: PriceBookRow,
  versions: readonly PriceBookVersionRow[],
): PriceBookContract | null {
  if (!book.familySlug.trim() || !book.bookId.trim()) {return null;}

  const emittedVersions: PriceBookVersion[] = [];
  for (const version of versions) {
    if (!version.versionId.trim() || !version.effectiveFrom.trim()) {continue;}
    if (!isCurrency(version.currency)) {continue;}
    const rules = version.rules
      .map(normalizeRule)
      .filter((rule): rule is PriceBookLineRule => rule !== null);
    emittedVersions.push({
      versionId: version.versionId,
      effectiveFrom: version.effectiveFrom,
      currency: version.currency,
      status: version.status,
      rules,
    });
  }

  if (emittedVersions.length === 0) {return null;}

  return {
    type: "oando-price-book",
    schemaVersion: 1,
    familySlug: book.familySlug,
    bookId: book.bookId,
    activeVersionId: book.activeVersionId,
    versions: emittedVersions,
  };
}