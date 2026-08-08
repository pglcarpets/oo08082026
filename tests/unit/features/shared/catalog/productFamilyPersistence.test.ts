/**
 * Name-mirror: features/shared/catalog/productFamilyPersistence
 * Pure serialize / migration helpers — in-memory only.
 */

import { describe, expect, it } from "vitest";
import {
  loadProductFamilyFromSerialized,
  planFamilyVersionReplacement,
  roundTripProductFamily,
  serializeProductFamily,
} from "@/features/shared/catalog/productFamilyPersistence";
import {
  PRODUCT_FAMILY_V1_FIXTURE,
  getFamilyVersion,
  type ProductFamilyVersionV1,
} from "@/features/shared/catalog/productFamilyContract";

function releasedCloneWithId(versionId: string): ProductFamilyVersionV1 {
  const v1 = getFamilyVersion(PRODUCT_FAMILY_V1_FIXTURE, "v1");
  if (!v1) throw new Error("fixture missing v1");
  return { ...v1, versionId, status: "released" };
}

describe("serializeProductFamily / loadProductFamilyFromSerialized", () => {
  it("writes a trailing newline and round-trips fixture identity", () => {
    const raw = serializeProductFamily(PRODUCT_FAMILY_V1_FIXTURE);
    expect(raw.endsWith("\n")).toBe(true);
    expect(raw.startsWith("{")).toBe(true);

    const loaded = loadProductFamilyFromSerialized(raw);
    expect(loaded.familyId).toBe(PRODUCT_FAMILY_V1_FIXTURE.familyId);
    expect(loaded.familySlug).toBe(PRODUCT_FAMILY_V1_FIXTURE.familySlug);
    expect(loaded.activeVersionId).toBe(PRODUCT_FAMILY_V1_FIXTURE.activeVersionId);
  });

  it("roundTripProductFamily preserves option group structure", () => {
    const again = roundTripProductFamily(PRODUCT_FAMILY_V1_FIXTURE);
    expect(again).toEqual(PRODUCT_FAMILY_V1_FIXTURE);
    const size = again.versions[0]?.optionGroups.find((g) => g.groupId === "size");
    expect(size?.options.map((o) => o.optionId)).toEqual(
      expect.arrayContaining(["size-1200", "size-1600"]),
    );
  });

  it("rejects malformed JSON payloads via schema parse", () => {
    expect(() =>
      loadProductFamilyFromSerialized(JSON.stringify({ familyId: "bad" })),
    ).toThrow();
  });
});

describe("planFamilyVersionReplacement", () => {
  it("blocks released overwrite when decision is block", () => {
    const plan = planFamilyVersionReplacement({
      family: PRODUCT_FAMILY_V1_FIXTURE,
      nextVersion: releasedCloneWithId("v1"),
      decision: "block",
    });
    expect(plan.allowed).toBe(false);
    expect(plan.nextFamily).toBeNull();
    expect(plan.message).toMatch(/explicit migration/i);
  });

  it("blocks operator decision=block even for new version ids", () => {
    const plan = planFamilyVersionReplacement({
      family: PRODUCT_FAMILY_V1_FIXTURE,
      nextVersion: releasedCloneWithId("v9"),
      decision: "block",
    });
    expect(plan.allowed).toBe(false);
    expect(plan.message).toMatch(/blocked by operator/i);
  });

  it("keep-both refuses reusing a released versionId", () => {
    const plan = planFamilyVersionReplacement({
      family: PRODUCT_FAMILY_V1_FIXTURE,
      nextVersion: releasedCloneWithId("v1"),
      decision: "keep-both",
    });
    expect(plan.allowed).toBe(false);
    expect(plan.message).toMatch(/immutable|new versionId/i);
  });

  it("keep-both appends a new version and leaves activeVersionId", () => {
    const plan = planFamilyVersionReplacement({
      family: PRODUCT_FAMILY_V1_FIXTURE,
      nextVersion: releasedCloneWithId("v2"),
      decision: "keep-both",
    });
    expect(plan.allowed).toBe(true);
    expect(plan.nextFamily?.activeVersionId).toBe(
      PRODUCT_FAMILY_V1_FIXTURE.activeVersionId,
    );
    expect(plan.nextFamily?.versions.map((v) => v.versionId)).toEqual(
      expect.arrayContaining(["v1", "v2"]),
    );
    expect(plan.message).toMatch(/active version unchanged/i);
  });

  it("replace-active refuses mutating a released version in place", () => {
    const plan = planFamilyVersionReplacement({
      family: PRODUCT_FAMILY_V1_FIXTURE,
      nextVersion: releasedCloneWithId("v1"),
      decision: "replace-active",
    });
    expect(plan.allowed).toBe(false);
    expect(plan.message).toMatch(/new versionId|do not mutate/i);
  });

  it("replace-active points activeVersionId at a new released version", () => {
    const plan = planFamilyVersionReplacement({
      family: PRODUCT_FAMILY_V1_FIXTURE,
      nextVersion: releasedCloneWithId("v2"),
      decision: "replace-active",
    });
    expect(plan.allowed).toBe(true);
    expect(plan.nextFamily?.activeVersionId).toBe("v2");
    expect(plan.message).toMatch(/Active version will point to v2/);
  });
});
