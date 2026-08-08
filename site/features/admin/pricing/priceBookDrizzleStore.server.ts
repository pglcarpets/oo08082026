/**
 * Admin P05 — Drizzle price-book store on Planner/Auth Postgres.
 * Tables: public.price_books + public.price_book_versions (migration 20260713).
 */
import "server-only";

import { eq } from "drizzle-orm";

import { adminDb } from "@/platform/drizzle/adminDb";
import { priceBooks, priceBookVersions } from "@/platform/drizzle/schema/planner";
import { isPlannerDatabaseUrlConfigured } from "@/platform/drizzle/databaseUrls";
import type { PriceBookVersionRow } from "./emitPriceBookContract";
import type { PriceBookStore } from "./priceBookService";
import type { PriceBookLineRule } from "./priceBookContract";

function mapVersionStatus(status: string): PriceBookVersionRow["status"] {
  switch (status) {
    case "draft":
    case "approved":
    case "active":
    case "retired":
    case "rolled_back":
      return status;
    case "superseded":
      return "rolled_back";
    default:
      return "draft";
  }
}

function mapRules(raw: unknown): readonly PriceBookLineRule[] {
  if (!Array.isArray(raw)) {return [];}
  return raw as PriceBookLineRule[];
}

export function createPriceBookDrizzleStore(): PriceBookStore {
  return {
    async getBook(bookId) {
      const books = await adminDb
        .select()
        .from(priceBooks)
        .where(eq(priceBooks.bookId, bookId))
        .limit(1);
      const book = books[0];
      if (!book) {return null;}

      const versions = await adminDb
        .select()
        .from(priceBookVersions)
        .where(eq(priceBookVersions.bookRowId, book.id));

      return {
        book: {
          familySlug: book.familySlug,
          bookId: book.bookId,
          activeVersionId: book.activeVersionId,
        },
        versions: versions.map(
          (row): PriceBookVersionRow => ({
            versionId: row.versionId,
            effectiveFrom: String(row.effectiveFrom),
            currency: row.currency,
            status: mapVersionStatus(row.status),
            rules: mapRules(row.rules),
          }),
        ),
      };
    },

    async saveBook(book, versions) {
      const existing = await adminDb
        .select()
        .from(priceBooks)
        .where(eq(priceBooks.bookId, book.bookId))
        .limit(1);

      let bookRowId: string;
      if (existing[0]) {
        bookRowId = existing[0].id;
        await adminDb
          .update(priceBooks)
          .set({
            familySlug: book.familySlug,
            activeVersionId: book.activeVersionId,
            updatedAt: new Date(),
          })
          .where(eq(priceBooks.id, bookRowId));
        await adminDb
          .delete(priceBookVersions)
          .where(eq(priceBookVersions.bookRowId, bookRowId));
      } else {
        const inserted = await adminDb
          .insert(priceBooks)
          .values({
            familySlug: book.familySlug,
            bookId: book.bookId,
            activeVersionId: book.activeVersionId,
          })
          .returning({ id: priceBooks.id });
        const created = inserted[0];
        if (!created) {
          throw new Error(`Failed to insert price book ${book.bookId}`);
        }
        bookRowId = created.id;
      }

      if (versions.length === 0) {return;}

      await adminDb.insert(priceBookVersions).values(
        versions.map((version) => ({
          bookRowId,
          versionId: version.versionId,
          effectiveFrom: version.effectiveFrom,
          currency: version.currency,
          status: version.status,
          rules: [...version.rules],
        })),
      );
    },
  };
}

/**
 * Prefer Auth DB store when `SUPABASE_AUTH_DATABASE_URL` is set.
 * Callers that inject a test dir should keep the file store path.
 */
export function tryCreatePriceBookDrizzleStore(): PriceBookStore | null {
  if (!isPlannerDatabaseUrlConfigured()) {return null;}
  return createPriceBookDrizzleStore();
}
