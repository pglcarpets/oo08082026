/**
 * Server helpers for admin price-book routes.
 */

import fs from "node:fs";
import path from "node:path";

import { resolveSitePackageRoot } from "@/lib/paths/sitePackageRoot";
import { emitPriceBookContract } from "./emitPriceBookContract";
import {
  PRICE_BOOKS_DIR_DEFAULT,
  createPriceBookFileStore,
  listPriceBookIds,
  type readPriceBookFile,
  seedPriceBookIfMissing,
  writePriceBookFile,
} from "./priceBookFileStore";
import { tryCreatePriceBookDrizzleStore } from "./priceBookDrizzleStore.server";
import {
  activatePriceBookVersion,
  approvePriceBookVersion,
  rollbackPriceBookVersion,
  type PriceBookRole,
} from "./priceBookService";
import { createPriceBookAuditEntry } from "./priceBookGovernance";
import {
  appendPriceBookAudit,
  readPriceBookAudit,
} from "./priceBookGovernance.server";

export const DEFAULT_PRICE_BOOK_ID = "pb-linear-2026-q3";

function loadFixtureSeed(): ReturnType<typeof readPriceBookFile> {
  const fixturePath = path.join(
    resolveSitePackageRoot(),
    "features/admin/pricing/fixtures/linear-desk-2026-q3.json",
  );
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as {
    familySlug: string;
    bookId: string;
    activeVersionId: string | null;
    versions: Array<{
      versionId: string;
      effectiveFrom: string;
      currency: string;
      status: string;
      rules: unknown[];
    }>;
  };
  return {
    familySlug: fixture.familySlug,
    bookId: fixture.bookId,
    activeVersionId: null,
    versions: fixture.versions.map((version) => ({
      versionId: version.versionId,
      effectiveFrom: version.effectiveFrom,
      currency: version.currency as "INR",
      status: "draft" as const,
      rules: version.rules as never,
    })),
  };
}

/**
 * Prefer Planner/Auth Postgres when configured; file store remains for
 * isolated tests (custom dir) and offline seed fallback.
 */
export function getPriceBookStore(dir: string = PRICE_BOOKS_DIR_DEFAULT) {
  // Custom dirs are test isolation — always file-backed.
  if (dir !== PRICE_BOOKS_DIR_DEFAULT) {
    return createPriceBookFileStore(dir);
  }
  const drizzle = tryCreatePriceBookDrizzleStore();
  if (drizzle) {return drizzle;}
  return createPriceBookFileStore(dir);
}

export async function ensureDefaultPriceBookSeeded(
  dir: string = PRICE_BOOKS_DIR_DEFAULT,
) {
  const seed = loadFixtureSeed();
  if (!seed) {return null;}
  // Always keep a local file seed for offline tools; also upsert into DB store.
  const fileSeed = seedPriceBookIfMissing(DEFAULT_PRICE_BOOK_ID, seed, dir);
  if (dir === PRICE_BOOKS_DIR_DEFAULT) {
    try {
      const store = getPriceBookStore(dir);
      const existing = await store.getBook(DEFAULT_PRICE_BOOK_ID);
      if (!existing) {
        await store.saveBook(
          {
            familySlug: seed.familySlug,
            bookId: seed.bookId,
            activeVersionId: seed.activeVersionId,
          },
          seed.versions,
        );
      }
    } catch {
      // DB optional for pure file flows
    }
  }
  return fileSeed;
}

/** E2E/dev reset — restores draft seed so approve→activate→rollback is repeatable. */
export function resetDefaultPriceBookSeed(dir: string = PRICE_BOOKS_DIR_DEFAULT) {
  const seed = loadFixtureSeed();
  if (!seed) {return null;}
  writePriceBookFile(seed, dir);
  return seed;
}

export async function readAdminPriceBook(
  bookId: string,
  dir: string = PRICE_BOOKS_DIR_DEFAULT,
) {
  await ensureDefaultPriceBookSeeded(dir);
  const store = getPriceBookStore(dir);
  const snapshot = await store.getBook(bookId);
  if (!snapshot) {return null;}
  const contract = emitPriceBookContract(snapshot.book, snapshot.versions);
  return { snapshot, contract };
}

export async function runPriceBookAction(
  bookId: string,
  action: "approve" | "activate" | "rollback",
  versionId: string,
  role: PriceBookRole,
  options: {
    readonly actorId?: string;
    readonly reason?: string;
    /** Injectable store/audit root (tests). Defaults to product price-books dir. */
    readonly dir?: string;
  } = {},
) {
  const dir = options.dir ?? PRICE_BOOKS_DIR_DEFAULT;
  await ensureDefaultPriceBookSeeded(dir);
  const store = getPriceBookStore(dir);
  const actorId = options.actorId ?? "unknown";
  const reason = options.reason ?? "";

  let result;
  if (action === "approve") {
    result = await approvePriceBookVersion(store, bookId, versionId, role);
  } else if (action === "activate") {
    result = await activatePriceBookVersion(store, bookId, versionId, role);
  } else {
    result = await rollbackPriceBookVersion(store, bookId, versionId, role);
  }

  const entry = createPriceBookAuditEntry({
    actorId,
    role,
    action: result.ok ? action : "deny",
    bookId,
    versionId,
    previousVersionId: result.previousActiveVersionId,
    newVersionId: result.ok ? result.newActiveVersionId : null,
    reason,
    result: result.ok ? "success" : "failure",
    resultDetail: result.ok ? `${action} ok` : result.error,
  });
  try {
    appendPriceBookAudit(entry, dir);
  } catch {
    // audit best-effort; do not fail commercial action if log write fails
  }
  return result;
}

export async function readAdminPriceBookAudit(
  bookId: string,
  limit = 40,
  dir: string = PRICE_BOOKS_DIR_DEFAULT,
) {
  await ensureDefaultPriceBookSeeded(dir);
  return readPriceBookAudit(bookId, dir, limit);
}

export async function listAdminPriceBooks(
  dir: string = PRICE_BOOKS_DIR_DEFAULT,
): Promise<string[]> {
  await ensureDefaultPriceBookSeeded(dir);
  if (dir === PRICE_BOOKS_DIR_DEFAULT) {
    try {
      const store = getPriceBookStore(dir);
      const seeded = await store.getBook(DEFAULT_PRICE_BOOK_ID);
      if (seeded) {return [DEFAULT_PRICE_BOOK_ID];}
    } catch {
      // fall through to file list
    }
  }
  return listPriceBookIds(dir);
}
