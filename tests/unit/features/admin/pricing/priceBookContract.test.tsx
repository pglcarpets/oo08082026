/**
 * ADM-PRICE-01: immutable versions, currency primary, missing price never zero.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  describePriceBookVersion,
  displayPriceForSku,
  formatPriceBookCurrency,
  getPriceBookVersion,
  lineTotalMinor,
  priceForSku,
  type PriceBookContract,
} from "@/features/admin/pricing/priceBookContract";
import { AdminPriceBookPageView } from "@/features/admin/pricing/AdminPriceBookPageView";

const FIXTURE: PriceBookContract = {
  type: "oando-price-book",
  schemaVersion: 1,
  familySlug: "linear-desk-1200",
  bookId: "pb-linear-2026-q3",
  activeVersionId: "v1",
  versions: [
    {
      versionId: "v1",
      effectiveFrom: "2026-07-01",
      currency: "INR",
      status: "active",
      rules: [
        {
          sku: "OFL-DSK-LIN-1200",
          unitPriceMinor: 450_000_00,
          currency: "INR",
          uom: "each",
        },
        {
          sku: "OFL-TBL-001",
          unitPriceMinor: 12_500_00,
          currency: "INR",
          uom: "each",
          adjustmentBps: -500,
        },
      ],
    },
    {
      versionId: "v0",
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-06-30",
      currency: "INR",
      status: "rolled_back",
      rules: [
        {
          sku: "OFL-DSK-LIN-1200",
          unitPriceMinor: 400_000_00,
          currency: "INR",
          uom: "each",
        },
      ],
    },
  ],
};

describe("priceBookContract", () => {
  it("keeps version identity and resolves SKU rules with adjustments", () => {
    const meta = describePriceBookVersion(getPriceBookVersion(FIXTURE, "v1")!);
    expect(meta).toEqual({
      versionId: "v1",
      currency: "INR",
      effectiveFrom: "2026-07-01",
      effectiveTo: null,
      status: "active",
    });
    expect(FIXTURE.versions.map((v) => v.versionId)).toEqual(["v1", "v0"]);

    const rule = priceForSku(FIXTURE, "v1", "OFL-TBL-001");
    expect(rule?.unitPriceMinor).toBe(12_500_00);
    expect(lineTotalMinor(rule!, 2)).toBe(
      Math.round(12_500_00 * 2 * (1 - 500 / 10_000)),
    );
  });

  it("never shows zero for missing price; free zero remains available", () => {
    expect(priceForSku(FIXTURE, "v1", "MISSING")).toBeNull();
    const missing = displayPriceForSku(FIXTURE, "v1", "MISSING");
    expect(missing.available).toBe(false);
    expect(missing.primary).toBe("Price unavailable");
    expect(missing.primary).not.toMatch(/^0/);

    expect(formatPriceBookCurrency(Number.NaN, "INR")).toBe("Price unavailable");
    const display = displayPriceForSku(FIXTURE, "v1", "OFL-DSK-LIN-1200");
    expect(display.available).toBe(true);
    if (!display.available) throw new Error("expected available");
    expect(display.primary.replace(/[^\d]/g, "")).toMatch(/450000/);
    expect(display.secondary).toMatch(/minor/i);

    const freeBook: PriceBookContract = {
      ...FIXTURE,
      versions: [
        {
          versionId: "v-free",
          effectiveFrom: "2026-07-01",
          currency: "INR",
          status: "active",
          rules: [
            { sku: "PROMO-FREE", unitPriceMinor: 0, currency: "INR", uom: "each" },
          ],
        },
      ],
    };
    const free = displayPriceForSku(freeBook, "v-free", "PROMO-FREE");
    expect(free.available).toBe(true);
    if (!free.available) throw new Error("expected free available");
    expect(free.unitPriceMinor).toBe(0);
  });

  it("renders currency/status primary and Price unavailable for missing SKU", () => {
    render(
      <AdminPriceBookPageView
        initialBookId={FIXTURE.bookId}
        initialContract={FIXTURE}
      />,
    );
    expect(screen.getByTestId("admin-price-book-id")).toHaveTextContent(
      "pb-linear-2026-q3",
    );
    expect(screen.getByTestId("admin-price-book-version-meta")).toHaveTextContent(
      /Currency:\s*INR/,
    );
    expect(screen.getByTestId("admin-price-primary-missing")).toHaveTextContent(
      "Price unavailable",
    );
    expect(screen.getByTestId("admin-price-book-activate")).toHaveAttribute(
      "data-variant",
      "primary",
    );
  });
});
