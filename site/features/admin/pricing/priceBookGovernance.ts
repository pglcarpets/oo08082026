/**
 * Phase 4 governance helpers for price books (client-safe):
 * ADM-PRICE-02 lifecycle labels · ADM-PRICE-03 high-risk confirm ·
 * ADM-ROLE-01 action availability · ADM-AUDIT-01 entry shape ·
 * ADM-PUB-02 release impact summary.
 *
 * Pure functions only — no node:fs. File audit lives in priceBookGovernance.server.ts.
 */

import type {
  PriceBookContract,
  PriceBookVersionStatus,
} from "./priceBookContract";
import type { PriceBookRole } from "./priceBookService";

export type PriceBookHighRiskAction = "approve" | "activate" | "rollback";

/** ADM-PRICE-02 — distinct operator-facing lifecycle labels. */
export const PRICE_BOOK_STATUS_LABEL: Readonly<
  Record<PriceBookVersionStatus, string>
> = Object.freeze({
  draft: "Draft — not customer-visible",
  approved: "Approved — ready to activate",
  active: "Active — commercial rates live",
  retired: "Retired — not for new quotes",
  rolled_back: "Rolled back — superseded, history kept",
});

export function priceBookStatusLabel(status: PriceBookVersionStatus): string {
  return PRICE_BOOK_STATUS_LABEL[status];
}

export type PriceBookActionAvailability = {
  readonly allowed: boolean;
  /** Safe explanation when not allowed (no secret leakage). */
  readonly reason: string | null;
  readonly requiredRole: PriceBookRole;
};

/**
 * ADM-ROLE-01 — which actions the UI may offer for a role + version status.
 * Server re-enforces; this only explains unavailable actions.
 */
export function describePriceBookActionAvailability(
  action: PriceBookHighRiskAction,
  role: PriceBookRole,
  versionStatus: PriceBookVersionStatus,
): PriceBookActionAvailability {
  if (action === "approve") {
    if (role === "viewer") {
      return {
        allowed: false,
        reason: "Your role is viewer. Approving drafts requires author or approver.",
        requiredRole: "author",
      };
    }
    if (versionStatus !== "draft") {
      return {
        allowed: false,
        reason: `Only draft versions can be approved (this version is ${versionStatus}).`,
        requiredRole: "author",
      };
    }
    return { allowed: true, reason: null, requiredRole: "author" };
  }

  if (action === "activate") {
    if (role !== "approver") {
      return {
        allowed: false,
        reason: "Activating commercial rates requires the approver role.",
        requiredRole: "approver",
      };
    }
    if (versionStatus !== "approved" && versionStatus !== "draft") {
      return {
        allowed: false,
        reason: `Version cannot be activated from status “${versionStatus}”.`,
        requiredRole: "approver",
      };
    }
    return { allowed: true, reason: null, requiredRole: "approver" };
  }

  // rollback
  if (role !== "approver") {
    return {
      allowed: false,
      reason: "Rolling back an active price book requires the approver role.",
      requiredRole: "approver",
    };
  }
  if (versionStatus !== "active") {
    return {
      allowed: false,
      reason: `Only the active version can be rolled back (this version is ${versionStatus}).`,
      requiredRole: "approver",
    };
  }
  return { allowed: true, reason: null, requiredRole: "approver" };
}

export type PriceBookConfirmInput = {
  readonly action: PriceBookHighRiskAction;
  readonly role: PriceBookRole;
  readonly bookId: string;
  readonly familySlug: string;
  readonly versionId: string;
  readonly versionStatus: PriceBookVersionStatus;
  readonly currency: string;
  readonly effectiveFrom: string;
  readonly activeVersionId: string | null;
  readonly ruleCount: number;
  readonly reason: string;
};

/**
 * ADM-PRICE-03 + ADM-PUB-02 — role, reason, version, impact before confirmation.
 */
export function buildPriceBookConfirmMessage(input: PriceBookConfirmInput): string {
  const reason = input.reason.trim() || "(no reason provided)";
  const impact =
    input.action === "approve"
      ? `Impact: version ${input.versionId} moves from draft to approved. Customer-facing prices stay on active version ${input.activeVersionId ?? "—"} until activation.`
      : input.action === "activate"
        ? `Impact: version ${input.versionId} becomes the active commercial book (${input.ruleCount} rule(s), ${input.currency}, effective ${input.effectiveFrom}). Prior active version ${input.activeVersionId ?? "none"} is demoted but kept.`
        : `Impact: version ${input.versionId} is rolled back. A prior approved version may become active. History is retained; quotes pinned to this version stay reproducible.`;

  return [
    `${input.action.toUpperCase()} price book “${input.bookId}” (${input.familySlug})?`,
    "",
    `Role: ${input.role}`,
    `Reason: ${reason}`,
    `Target version: ${input.versionId} (status ${input.versionStatus})`,
    `Currency: ${input.currency} · effective from ${input.effectiveFrom}`,
    `Rules in version: ${input.ruleCount}`,
    `Current active version: ${input.activeVersionId ?? "—"}`,
    "",
    impact,
    "",
    "Confirm only if you intend this commercial change.",
  ].join("\n");
}

/** ADM-PUB-02 — short release impact for pre-confirm UI strip. */
export function buildPriceBookReleaseImpactSummary(input: {
  readonly bookId: string;
  readonly versionId: string;
  readonly currency: string;
  readonly effectiveFrom: string;
  readonly ruleCount: number;
  readonly previousActiveVersionId: string | null;
}): string {
  return [
    `Release target: book ${input.bookId}, version ${input.versionId}.`,
    `Currency ${input.currency}, effective ${input.effectiveFrom}, ${input.ruleCount} price rule(s).`,
    `Previous active version: ${input.previousActiveVersionId ?? "none"}.`,
    "Activation replaces live commercial rates; prior versions remain for audit and quote pins.",
  ].join(" ");
}

export type PriceBookAuditAction =
  | "approve"
  | "activate"
  | "rollback"
  | "deny";

export type PriceBookAuditEntry = {
  readonly id: string;
  readonly at: string;
  readonly actorId: string;
  readonly role: PriceBookRole;
  readonly action: PriceBookAuditAction;
  readonly objectType: "price_book_version";
  readonly bookId: string;
  readonly versionId: string;
  readonly previousVersionId: string | null;
  readonly newVersionId: string | null;
  readonly reason: string;
  readonly result: "success" | "failure";
  readonly resultDetail: string;
};

export function createPriceBookAuditEntry(input: {
  readonly actorId: string;
  readonly role: PriceBookRole;
  readonly action: PriceBookAuditAction;
  readonly bookId: string;
  readonly versionId: string;
  readonly previousVersionId: string | null;
  readonly newVersionId: string | null;
  readonly reason: string;
  readonly result: "success" | "failure";
  readonly resultDetail: string;
  readonly now?: () => Date;
  readonly idFactory?: () => string;
}): PriceBookAuditEntry {
  const now = input.now ?? (() => new Date());
  const idFactory =
    input.idFactory ??
    (() => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  return {
    id: idFactory(),
    at: now().toISOString(),
    actorId: input.actorId,
    role: input.role,
    action: input.action,
    objectType: "price_book_version",
    bookId: input.bookId,
    versionId: input.versionId,
    previousVersionId: input.previousVersionId,
    newVersionId: input.newVersionId,
    reason: input.reason.trim() || "(none)",
    result: input.result,
    resultDetail: input.resultDetail,
  };
}

/** Format one audit row for Admin history (ADM-AUDIT-01). */
export function formatPriceBookAuditLine(entry: PriceBookAuditEntry): string {
  return [
    entry.at,
    `actor=${entry.actorId}`,
    `role=${entry.role}`,
    `action=${entry.action}`,
    `object=${entry.objectType}:${entry.bookId}/${entry.versionId}`,
    `versions prev=${entry.previousVersionId ?? "—"} new=${entry.newVersionId ?? "—"}`,
    `reason=${entry.reason}`,
    `result=${entry.result}`,
    entry.resultDetail,
  ].join(" · ");
}

export function listDistinctVersionStatuses(
  contract: PriceBookContract,
): readonly PriceBookVersionStatus[] {
  return [...new Set(contract.versions.map((v) => v.status))];
}
