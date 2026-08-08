/**
 * Admin P05 / Phase 4 — price-book JSON contract (Buyer P04 consumes this shape).
 *
 * - versionId is immutable once the version exists (never reminted on edit).
 * - currency, effectiveFrom, and status are explicit on every version.
 * - ADM-PRICE-01: operator amounts format as currency; raw minor units secondary.
 * - Missing price is unavailable (null), never coerced to zero.
 */

export type PriceBookCurrency = "INR" | "USD";

export type PriceBookVersionStatus =
  | "draft"
  | "approved"
  | "active"
  | "retired"
  | "rolled_back";

export type PriceBookLineRule = {
  readonly sku: string;
  /** Integer minor currency units (e.g. paise / cents). Never use 0 for "missing". */
  readonly unitPriceMinor: number;
  readonly currency: PriceBookCurrency;
  readonly uom: "each" | "mm" | "sqm" | "seat";
  readonly adjustmentBps?: number;
};

export type PriceBookVersion = {
  /** Immutable version identifier for this book revision. */
  readonly versionId: string;
  /** ISO date (YYYY-MM-DD) when this version becomes commercially effective. */
  readonly effectiveFrom: string;
  /** Optional exclusive end date; omit for open-ended. */
  readonly effectiveTo?: string;
  readonly currency: PriceBookCurrency;
  readonly status: PriceBookVersionStatus;
  readonly rules: readonly PriceBookLineRule[];
};

export type PriceBookContract = {
  readonly type: "oando-price-book";
  readonly schemaVersion: 1;
  readonly familySlug: string;
  /** Stable book identifier (not reminted per version). */
  readonly bookId: string;
  readonly activeVersionId: string | null;
  readonly versions: readonly PriceBookVersion[];
};

/** Minor units per major unit for supported currencies (ISO 4217 exponent 2). */
export const PRICE_BOOK_MINOR_PER_MAJOR = 100 as const;

export function lineTotalMinor(
  rule: PriceBookLineRule,
  quantity: number,
): number | null {
  if (!Number.isFinite(quantity) || quantity <= 0) {return null;}
  if (!Number.isFinite(rule.unitPriceMinor) || rule.unitPriceMinor < 0) {return null;}
  // Missing must stay null elsewhere; explicit 0 is a free line, not "missing".
  const base = Math.round(rule.unitPriceMinor * quantity);
  const bps = rule.adjustmentBps ?? 0;
  return Math.round(base * (1 + bps / 10_000));
}

export function priceForSku(
  book: PriceBookContract,
  versionId: string,
  sku: string,
): PriceBookLineRule | null {
  const version = book.versions.find((v) => v.versionId === versionId);
  if (!version) {return null;}
  return version.rules.find((r) => r.sku === sku) ?? null;
}

export function getPriceBookVersion(
  book: PriceBookContract,
  versionId: string,
): PriceBookVersion | null {
  return book.versions.find((v) => v.versionId === versionId) ?? null;
}

/**
 * ADM-PRICE-01 — format minor units as operator-facing currency.
 * Raw minor string is for advanced technical view only.
 */
export function formatPriceBookCurrency(
  unitPriceMinor: number,
  currency: PriceBookCurrency,
  locale = "en-IN",
): string {
  if (!Number.isFinite(unitPriceMinor)) {
    return "Price unavailable";
  }
  const major = unitPriceMinor / PRICE_BOOK_MINOR_PER_MAJOR;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);
}

export function formatPriceBookMinorSecondary(
  unitPriceMinor: number,
  currency: PriceBookCurrency,
): string {
  if (!Number.isFinite(unitPriceMinor)) {return "—";}
  return `${Math.trunc(unitPriceMinor)} ${currency} minor units`;
}

export type PriceBookPriceDisplay =
  | {
      readonly available: true;
      readonly primary: string;
      readonly secondary: string;
      readonly unitPriceMinor: number;
      readonly currency: PriceBookCurrency;
    }
  | {
      readonly available: false;
      readonly primary: "Price unavailable";
      readonly secondary: null;
      readonly unitPriceMinor: null;
      readonly currency: null;
    };

/**
 * Resolve SKU display for operators.
 * Missing rule → unavailable (never 0).
 */
export function displayPriceForSku(
  book: PriceBookContract,
  versionId: string,
  sku: string,
  locale = "en-IN",
): PriceBookPriceDisplay {
  const rule = priceForSku(book, versionId, sku);
  if (
    !rule ||
    !Number.isFinite(rule.unitPriceMinor) ||
    rule.unitPriceMinor < 0
  ) {
    return {
      available: false,
      primary: "Price unavailable",
      secondary: null,
      unitPriceMinor: null,
      currency: null,
    };
  }
  return {
    available: true,
    primary: formatPriceBookCurrency(
      rule.unitPriceMinor,
      rule.currency,
      locale,
    ),
    secondary: formatPriceBookMinorSecondary(
      rule.unitPriceMinor,
      rule.currency,
    ),
    unitPriceMinor: rule.unitPriceMinor,
    currency: rule.currency,
  };
}

/** Summarize version for Admin list (explicit currency, dates, status). */
export function describePriceBookVersion(version: PriceBookVersion): {
  readonly versionId: string;
  readonly currency: PriceBookCurrency;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly status: PriceBookVersionStatus;
} {
  return {
    versionId: version.versionId,
    currency: version.currency,
    effectiveFrom: version.effectiveFrom,
    effectiveTo: version.effectiveTo ?? null,
    status: version.status,
  };
}