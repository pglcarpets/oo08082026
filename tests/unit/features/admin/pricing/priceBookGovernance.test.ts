/**
 * ADM-PRICE-02/03, ADM-ROLE-01 — price book governance contracts.
 */

import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";

import {
  PRICE_BOOK_STATUS_LABEL,
  buildPriceBookConfirmMessage,
  buildPriceBookReleaseImpactSummary,
  createPriceBookAuditEntry,
  describePriceBookActionAvailability,
  formatPriceBookAuditLine,
  priceBookStatusLabel,
} from "@/features/admin/pricing/priceBookGovernance";
import {
  appendPriceBookAudit,
  readPriceBookAudit,
} from "@/features/admin/pricing/priceBookGovernance.server";

describe("priceBookGovernance", () => {
  it("labels distinct commercial lifecycle states", () => {
    expect(Object.keys(PRICE_BOOK_STATUS_LABEL).sort()).toEqual(
      ["active", "approved", "draft", "retired", "rolled_back"].sort(),
    );
    for (const status of Object.keys(PRICE_BOOK_STATUS_LABEL) as Array<
      keyof typeof PRICE_BOOK_STATUS_LABEL
    >) {
      expect(priceBookStatusLabel(status).length).toBeGreaterThan(0);
    }
    expect(new Set(Object.values(PRICE_BOOK_STATUS_LABEL)).size).toBe(
      Object.keys(PRICE_BOOK_STATUS_LABEL).length,
    );
  });

  it("enforces role + status gates for approve/activate/rollback", () => {
    expect(
      describePriceBookActionAvailability("approve", "author", "draft").allowed,
    ).toBe(true);
    expect(
      describePriceBookActionAvailability("approve", "viewer", "draft").allowed,
    ).toBe(false);
    expect(
      describePriceBookActionAvailability("activate", "author", "approved").allowed,
    ).toBe(false);
    expect(
      describePriceBookActionAvailability("activate", "approver", "approved").allowed,
    ).toBe(true);
    expect(
      describePriceBookActionAvailability("activate", "approver", "retired").allowed,
    ).toBe(false);
    expect(
      describePriceBookActionAvailability("rollback", "approver", "active").allowed,
    ).toBe(true);
    expect(
      describePriceBookActionAvailability("rollback", "approver", "approved").allowed,
    ).toBe(false);
  });

  it("builds confirm/impact copy with role, version, and prior active", () => {
    const text = buildPriceBookConfirmMessage({
      action: "activate",
      role: "approver",
      bookId: "pb-linear-2026-q3",
      familySlug: "linear-desk-1200",
      versionId: "v1",
      versionStatus: "approved",
      currency: "INR",
      effectiveFrom: "2026-07-01",
      activeVersionId: null,
      ruleCount: 2,
      reason: "Q3 rate card go-live",
    });
    expect(text).toMatch(/Role: approver/);
    expect(text).toMatch(/Reason: Q3 rate card go-live/);
    expect(text).toMatch(/Target version: v1/);
    expect(text).toMatch(/2 rule/);

    const summary = buildPriceBookReleaseImpactSummary({
      bookId: "pb-1",
      versionId: "v2",
      currency: "USD",
      effectiveFrom: "2026-08-01",
      ruleCount: 3,
      previousActiveVersionId: "v1",
    });
    expect(summary).toMatch(/pb-1/);
    expect(summary).toMatch(/v2/);
    expect(summary).toMatch(/v1/);
  });

  it("writes audit history with actor/action/object/result", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "pb-audit-"));
    try {
      const entry = createPriceBookAuditEntry({
        actorId: "admin@example.com",
        role: "approver",
        action: "activate",
        bookId: "pb-1",
        versionId: "v1",
        previousVersionId: null,
        newVersionId: "v1",
        reason: "go live",
        result: "success",
        resultDetail: "activated",
      });
      appendPriceBookAudit(entry, dir);
      const lines = readPriceBookAudit("pb-1", dir);
      expect(lines.length).toBeGreaterThan(0);
      const formatted = formatPriceBookAuditLine(entry);
      expect(formatted).toMatch(/activate/);
      expect(formatted).toMatch(/pb-1/);
      expect(formatted).toMatch(/go live/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
