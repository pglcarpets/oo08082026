/**
 * Admin P05 — file-backed price-book store (dev + tests; Drizzle path can wrap this shape).
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

import { resolveSitePackageRoot } from "@/lib/paths/sitePackageRoot";
import type { PriceBookLineRule } from "./priceBookContract";
import type { PriceBookVersionRow } from "./emitPriceBookContract";
import type { PriceBookStore } from "./priceBookService";

export type PriceBookFileRecord = {
  readonly familySlug: string;
  readonly bookId: string;
  readonly activeVersionId: string | null;
  readonly versions: readonly PriceBookVersionRow[];
};

export const PRICE_BOOKS_DIR_DEFAULT = path.join(
  resolveSitePackageRoot(),
  "features",
  "admin",
  "pricing",
  "data",
  "price-books",
);

function bookPath(bookId: string, dir: string): string {
  return path.resolve(dir, `${bookId}.json`);
}

export function ensurePriceBooksDir(dir: string = PRICE_BOOKS_DIR_DEFAULT): string {
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function readPriceBookFile(
  bookId: string,
  dir: string = PRICE_BOOKS_DIR_DEFAULT,
): PriceBookFileRecord | null {
  const file = bookPath(bookId, dir);
  if (!existsSync(file)) {return null;}
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as PriceBookFileRecord;
    if (parsed.bookId !== bookId) {return null;}
    return parsed;
  } catch {
    return null;
  }
}

export function writePriceBookFile(
  record: PriceBookFileRecord,
  dir: string = PRICE_BOOKS_DIR_DEFAULT,
): void {
  ensurePriceBooksDir(dir);
  const file = bookPath(record.bookId, dir);
  const temp = `${file}.tmp-${randomBytes(4).toString("hex")}`;
  writeFileSync(temp, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  renameSync(temp, file);
}

export function listPriceBookIds(dir: string = PRICE_BOOKS_DIR_DEFAULT): string[] {
  ensurePriceBooksDir(dir);
  return readdirSync(dir)
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => entry.slice(0, -".json".length));
}

export function createPriceBookFileStore(
  dir: string = PRICE_BOOKS_DIR_DEFAULT,
): PriceBookStore {
  return {
    async getBook(bookId) {
      const record = readPriceBookFile(bookId, dir);
      if (!record) {return null;}
      return {
        book: {
          familySlug: record.familySlug,
          bookId: record.bookId,
          activeVersionId: record.activeVersionId,
        },
        versions: record.versions,
      };
    },
    async saveBook(book, versions) {
      writePriceBookFile(
        {
          familySlug: book.familySlug,
          bookId: book.bookId,
          activeVersionId: book.activeVersionId,
          versions: [...versions],
        },
        dir,
      );
    },
  };
}

export function seedPriceBookIfMissing(
  bookId: string,
  seed: PriceBookFileRecord,
  dir: string = PRICE_BOOKS_DIR_DEFAULT,
): PriceBookFileRecord {
  const existing = readPriceBookFile(bookId, dir);
  if (existing) {return existing;}
  writePriceBookFile(seed, dir);
  return seed;
}

export function normalizeRules(rules: readonly PriceBookLineRule[]): PriceBookLineRule[] {
  return rules.map((rule) => ({ ...rule }));
}
