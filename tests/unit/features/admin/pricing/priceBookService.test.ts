import { describe, expect, it } from "vitest";

import {
  activatePriceBookVersion,
  approvePriceBookVersion,
  rollbackPriceBookVersion,
  type PriceBookStore,
} from "@/features/admin/pricing/priceBookService";
import type {
  PriceBookRow,
  PriceBookVersionRow,
} from "@/features/admin/pricing/emitPriceBookContract";

function memoryStore(seed: {
  bookId: string;
  familySlug?: string;
  activeVersionId?: string | null;
  versions: PriceBookVersionRow[];
}): PriceBookStore & {
  getState: () => { book: PriceBookRow; versions: PriceBookVersionRow[] };
} {
  let book: PriceBookRow = {
    familySlug: seed.familySlug ?? "linear-desk-1200",
    bookId: seed.bookId,
    activeVersionId: seed.activeVersionId ?? null,
  };
  let versions = [...seed.versions];
  return {
    async getBook(bookId) {
      if (bookId !== seed.bookId) return null;
      return { book, versions };
    },
    async saveBook(nextBook, nextVersions) {
      book = nextBook;
      versions = [...nextVersions];
    },
    getState() {
      return { book, versions };
    },
  };
}

const rule = {
  sku: "OFL-TBL-001",
  unitPriceMinor: 1_000_00,
  currency: "INR" as const,
  uom: "each" as const,
};

describe("priceBookService gate paths", () => {
  it("denies non-approver activate and rejects bad status/book/version", async () => {
    const store = memoryStore({
      bookId: "pb-1",
      versions: [
        {
          versionId: "v1",
          effectiveFrom: "2026-07-01",
          currency: "INR",
          status: "approved",
          rules: [rule],
        },
      ],
    });
    const denied = await activatePriceBookVersion(store, "pb-1", "v1", "author");
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.error).toMatch(/Approver role required/i);

    const missingBook = await activatePriceBookVersion(store, "missing", "v1", "approver");
    expect(missingBook.ok).toBe(false);

    const missingVersion = await activatePriceBookVersion(store, "pb-1", "v9", "approver");
    expect(missingVersion.ok).toBe(false);

    const retiredStore = memoryStore({
      bookId: "pb-1",
      versions: [
        {
          versionId: "v1",
          effectiveFrom: "2026-07-01",
          currency: "INR",
          status: "retired",
          rules: [rule],
        },
      ],
    });
    const retired = await activatePriceBookVersion(retiredStore, "pb-1", "v1", "approver");
    expect(retired.ok).toBe(false);
    if (!retired.ok) expect(retired.error).toMatch(/retired/i);
  });

  it("walks draft → approve → activate and demotes previous active", async () => {
    const store = memoryStore({
      bookId: "pb-path",
      activeVersionId: "v1",
      versions: [
        {
          versionId: "v1",
          effectiveFrom: "2026-01-01",
          currency: "INR",
          status: "active",
          rules: [rule],
        },
        {
          versionId: "v2",
          effectiveFrom: "2026-07-01",
          currency: "INR",
          status: "draft",
          rules: [rule],
        },
      ],
    });

    const approved = await approvePriceBookVersion(store, "pb-path", "v2", "author");
    expect(approved.ok).toBe(true);
    expect(store.getState().versions.find((v) => v.versionId === "v2")?.status).toBe(
      "approved",
    );
    expect(store.getState().book.activeVersionId).toBe("v1");

    const activated = await activatePriceBookVersion(store, "pb-path", "v2", "approver");
    expect(activated.ok).toBe(true);
    if (!activated.ok) throw new Error("expected activate ok");
    expect(activated.newActiveVersionId).toBe("v2");
    expect(activated.previousActiveVersionId).toBe("v1");
    expect(store.getState().versions.find((v) => v.versionId === "v1")?.status).toBe(
      "approved",
    );
    expect(store.getState().versions.find((v) => v.versionId === "v2")?.status).toBe(
      "active",
    );
    expect(activated.contract.activeVersionId).toBe("v2");
  });

  it("rollback requires approver and marks active version rolled_back", async () => {
    const store = memoryStore({
      bookId: "pb-1",
      activeVersionId: "v2",
      versions: [
        {
          versionId: "v1",
          effectiveFrom: "2026-01-01",
          currency: "INR",
          status: "approved",
          rules: [rule],
        },
        {
          versionId: "v2",
          effectiveFrom: "2026-07-01",
          currency: "INR",
          status: "active",
          rules: [rule],
        },
      ],
    });
    const denied = await rollbackPriceBookVersion(store, "pb-1", "v2", "author");
    expect(denied.ok).toBe(false);

    const rolled = await rollbackPriceBookVersion(store, "pb-1", "v2", "approver");
    expect(rolled.ok).toBe(true);
    if (!rolled.ok) throw new Error("expected rollback ok");
    expect(store.getState().versions.find((v) => v.versionId === "v2")?.status).toBe(
      "rolled_back",
    );
  });
});
