/**
 * Phase 3 — family save/reload + explicit version-replacement migration decision.
 * Pure serialize helpers. Tests use in-memory strings only.
 */

import {
  parseProductFamilyV1,
  type ProductFamilyV1,
  type ProductFamilyVersionV1,
} from "./productFamilyContract";

export function serializeProductFamily(family: ProductFamilyV1): string {
  return `${JSON.stringify(family)}\n`;
}

export function loadProductFamilyFromSerialized(raw: string): ProductFamilyV1 {
  return parseProductFamilyV1(JSON.parse(raw) as unknown);
}

/** Round-trip preserve family version + options (save/reload contract). */
export function roundTripProductFamily(family: ProductFamilyV1): ProductFamilyV1 {
  return loadProductFamilyFromSerialized(serializeProductFamily(family));
}

export type FamilyVersionMigrationDecision =
  | "block"
  | "keep-both"
  | "replace-active";

export type FamilyVersionMigrationPlan = {
  readonly decision: FamilyVersionMigrationDecision;
  readonly allowed: boolean;
  readonly message: string;
  readonly nextFamily: ProductFamilyV1 | null;
};

/**
 * Replacing a released version requires an explicit migration decision.
 * - block: refuse
 * - keep-both: append new version, leave activeVersionId unchanged
 * - replace-active: append/replace slot and point activeVersionId at new version
 */
export function planFamilyVersionReplacement(input: {
  readonly family: ProductFamilyV1;
  readonly nextVersion: ProductFamilyVersionV1;
  readonly decision: FamilyVersionMigrationDecision;
}): FamilyVersionMigrationPlan {
  const { family, nextVersion, decision } = input;
  const existing = family.versions.find((v) => v.versionId === nextVersion.versionId);

  if (existing && existing.status === "released" && decision === "block") {
    return {
      decision,
      allowed: false,
      message:
        "Replacing a released family version requires an explicit migration decision (keep-both or replace-active).",
      nextFamily: null,
    };
  }

  if (decision === "block") {
    return {
      decision,
      allowed: false,
      message: "Migration blocked by operator decision.",
      nextFamily: null,
    };
  }

  if (existing && existing.status === "released" && decision === "keep-both") {
    // Cannot reuse same versionId for a new payload — force new id policy
    if (existing.versionId === nextVersion.versionId) {
      return {
        decision,
        allowed: false,
        message:
          "keep-both requires a new versionId; released version IDs are immutable.",
        nextFamily: null,
      };
    }
  }

  let versions = [...family.versions];
  const idx = versions.findIndex((v) => v.versionId === nextVersion.versionId);
  if (idx >= 0) {
    if (versions[idx]?.status === "released" && decision !== "replace-active") {
      return {
        decision,
        allowed: false,
        message:
          "Cannot overwrite a released version without replace-active migration.",
        nextFamily: null,
      };
    }
    if (versions[idx]?.status === "released" && decision === "replace-active") {
      // Keep old released history: demote status and add new version with new id required
      return {
        decision,
        allowed: false,
        message:
          "replace-active must add a new versionId; do not mutate a released version in place.",
        nextFamily: null,
      };
    }
    versions[idx] = nextVersion;
  } else {
    versions = [...versions, nextVersion];
  }

  const activeVersionId =
    decision === "replace-active" && nextVersion.status === "released"
      ? nextVersion.versionId
      : family.activeVersionId;

  const nextFamily = parseProductFamilyV1({
    ...family,
    activeVersionId,
    versions,
  });

  return {
    decision,
    allowed: true,
    message:
      decision === "replace-active"
        ? `Active version will point to ${nextVersion.versionId}. Prior versions remain.`
        : `Version ${nextVersion.versionId} saved; active version unchanged (${family.activeVersionId ?? "none"}).`,
    nextFamily,
  };
}
