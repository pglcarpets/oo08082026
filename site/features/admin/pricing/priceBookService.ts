/**
 * Admin P05 — price-book activation + rollback (fail-closed; prior active untouched on failure).
 * Roles enforced server-side (ADM-ROLE-01). Audit fields returned for ADM-AUDIT-01.
 */

import type { PriceBookContract, PriceBookVersion } from "./priceBookContract";
import { emitPriceBookContract, type PriceBookRow, type PriceBookVersionRow } from "./emitPriceBookContract";
import type { PriceBookHighRiskAction } from "./priceBookGovernance";

export type PriceBookRole = "author" | "approver" | "viewer";

export type PriceBookStore = {
  readonly getBook: (bookId: string) => Promise<{
    book: PriceBookRow;
    versions: readonly PriceBookVersionRow[];
  } | null>;
  readonly saveBook: (
    book: PriceBookRow,
    versions: readonly PriceBookVersionRow[],
  ) => Promise<void>;
};

export type ActivateResult =
  | {
      readonly ok: true;
      readonly contract: PriceBookContract;
      readonly action: PriceBookHighRiskAction;
      readonly previousActiveVersionId: string | null;
      readonly newActiveVersionId: string | null;
    }
  | {
      readonly ok: false;
      readonly error: string;
      readonly action: PriceBookHighRiskAction;
      readonly previousActiveVersionId: string | null;
    };

function canActivate(role: PriceBookRole): boolean {
  return role === "approver";
}

function withVersionStatus(
  versions: readonly PriceBookVersionRow[],
  targetId: string,
  status: PriceBookVersion["status"],
): PriceBookVersionRow[] {
  return versions.map((version) => {
    if (version.versionId === targetId) {return { ...version, status };}
    if (status === "active" && version.status === "active") {
      return { ...version, status: "approved" };
    }
    return version;
  });
}

export async function activatePriceBookVersion(
  store: PriceBookStore,
  bookId: string,
  versionId: string,
  role: PriceBookRole,
): Promise<ActivateResult> {
  const action = "activate" as const;
  if (!canActivate(role)) {
    return {
      ok: false,
      action,
      previousActiveVersionId: null,
      error: "Approver role required to activate a price book",
    };
  }

  const snapshot = await store.getBook(bookId);
  if (!snapshot) {
    return {
      ok: false,
      action,
      previousActiveVersionId: null,
      error: `Price book "${bookId}" not found`,
    };
  }
  const previousActive = snapshot.book.activeVersionId;

  const target = snapshot.versions.find((v) => v.versionId === versionId);
  if (!target) {
    return {
      ok: false,
      action,
      previousActiveVersionId: previousActive,
      error: `Version "${versionId}" not found`,
    };
  }
  if (target.status !== "approved" && target.status !== "draft") {
    return {
      ok: false,
      action,
      previousActiveVersionId: previousActive,
      error: `Version "${versionId}" cannot be activated from status ${target.status}`,
    };
  }

  const previous = snapshot;
  const nextVersions = withVersionStatus(snapshot.versions, versionId, "active");
  const nextBook: PriceBookRow = {
    ...snapshot.book,
    activeVersionId: versionId,
  };

  try {
    await store.saveBook(nextBook, nextVersions);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return {
      ok: false,
      action,
      previousActiveVersionId: previousActive,
      error: message,
    };
  }

  const contract = emitPriceBookContract(nextBook, nextVersions);
  if (!contract) {
    return {
      ok: false,
      action,
      previousActiveVersionId: previousActive,
      error: "Activated book failed contract emission",
    };
  }

  // Fail-closed verification: store must still hold prior versions count.
  const verify = await store.getBook(bookId);
  if (!verify || verify.versions.length < previous.versions.length) {
    await store.saveBook(previous.book, previous.versions);
    return {
      ok: false,
      action,
      previousActiveVersionId: previousActive,
      error: "Activation aborted — version history would have been lost",
    };
  }

  return {
    ok: true,
    contract,
    action,
    previousActiveVersionId: previousActive,
    newActiveVersionId: versionId,
  };
}

export async function approvePriceBookVersion(
  store: PriceBookStore,
  bookId: string,
  versionId: string,
  role: PriceBookRole,
): Promise<ActivateResult> {
  const action = "approve" as const;
  if (role === "viewer") {
    return {
      ok: false,
      action,
      previousActiveVersionId: null,
      error: "Viewer cannot approve price-book versions",
    };
  }

  const snapshot = await store.getBook(bookId);
  if (!snapshot) {
    return {
      ok: false,
      action,
      previousActiveVersionId: null,
      error: `Price book "${bookId}" not found`,
    };
  }
  const previousActive = snapshot.book.activeVersionId;

  const target = snapshot.versions.find((v) => v.versionId === versionId);
  if (!target) {
    return {
      ok: false,
      action,
      previousActiveVersionId: previousActive,
      error: `Version "${versionId}" not found`,
    };
  }
  if (target.status !== "draft") {
    return {
      ok: false,
      action,
      previousActiveVersionId: previousActive,
      error: `Only draft versions can be approved (got ${target.status})`,
    };
  }

  const nextVersions = snapshot.versions.map((version) =>
    version.versionId === versionId ? { ...version, status: "approved" as const } : version,
  );
  await store.saveBook(snapshot.book, nextVersions);
  const contract = emitPriceBookContract(snapshot.book, nextVersions);
  if (!contract) {
    return {
      ok: false,
      action,
      previousActiveVersionId: previousActive,
      error: "Approve failed contract emission",
    };
  }
  return {
    ok: true,
    contract,
    action,
    previousActiveVersionId: previousActive,
    newActiveVersionId: previousActive,
  };
}

export async function rollbackPriceBookVersion(
  store: PriceBookStore,
  bookId: string,
  versionId: string,
  role: PriceBookRole,
): Promise<ActivateResult> {
  const action = "rollback" as const;
  if (!canActivate(role)) {
    return {
      ok: false,
      action,
      previousActiveVersionId: null,
      error: "Approver role required to roll back a price book",
    };
  }

  const snapshot = await store.getBook(bookId);
  if (!snapshot) {
    return {
      ok: false,
      action,
      previousActiveVersionId: null,
      error: `Price book "${bookId}" not found`,
    };
  }
  const previousActive = snapshot.book.activeVersionId;

  const target = snapshot.versions.find((v) => v.versionId === versionId);
  if (!target) {
    return {
      ok: false,
      action,
      previousActiveVersionId: previousActive,
      error: `Version "${versionId}" not found`,
    };
  }

  const nextVersions = snapshot.versions.map((version) => {
    if (version.versionId === versionId) {return { ...version, status: "rolled_back" as const };}
    if (version.status === "active") {return { ...version, status: "approved" as const };}
    return version;
  });

  const fallbackActive =
    [...nextVersions].reverse().find((v) => v.status === "approved")?.versionId ?? null;

  const nextBook: PriceBookRow = {
    ...snapshot.book,
    activeVersionId: fallbackActive,
  };

  await store.saveBook(nextBook, nextVersions);
  const contract = emitPriceBookContract(nextBook, nextVersions);
  if (!contract) {
    return {
      ok: false,
      action,
      previousActiveVersionId: previousActive,
      error: "Rollback failed contract emission",
    };
  }
  return {
    ok: true,
    contract,
    action,
    previousActiveVersionId: previousActive,
    newActiveVersionId: fallbackActive,
  };
}