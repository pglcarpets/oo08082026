/**
 * Admin Phase 3 — product family contract + ADM-FAM-01 / ADM-FAM-02.
 */

import { describe, expect, it } from "vitest";

import {
  PRODUCT_FAMILY_SCHEMA_VERSION,
  PRODUCT_FAMILY_V1_FIXTURE,
  buildDraftFamilyFromForm,
  formatFamilyConfigError,
  getFamilyVersion,
  parseProductFamilyV1,
  previewFamilyConfiguration,
  validateFamilyConfiguration,
} from "@/features/shared/catalog/productFamilyContract";

describe("ProductFamilyV1 — stable family and version IDs", () => {
  it("pins schema version and stable family/version identifiers", () => {
    expect(PRODUCT_FAMILY_SCHEMA_VERSION).toBe(1);
    const family = PRODUCT_FAMILY_V1_FIXTURE;
    expect(family.familyId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(family.familySlug).toBe("linear-desk-family");
    expect(family.activeVersionId).toBe("v1");
    const version = getFamilyVersion(family, "v1");
    expect(version?.versionId).toBe("v1");
    expect(version?.status).toBe("released");
  });

  it("is the same module from Admin and shared entry points", async () => {
    // Planner catalog-api re-export retired with the fork; shared is canonical.
    const admin = await import(
      "@/features/admin/catalog/productFamilyContract"
    );
    const shared = await import(
      "@/features/shared/catalog/productFamilyContract"
    );
    expect(admin.PRODUCT_FAMILY_SCHEMA_VERSION).toBe(
      shared.PRODUCT_FAMILY_SCHEMA_VERSION,
    );
    expect(admin.ProductFamilyV1Schema).toBe(shared.ProductFamilyV1Schema);
  });
});

describe("option groups — stable IDs and selection rules", () => {
  it("declares required single-choice and optional multi-choice groups", () => {
    const version = getFamilyVersion(PRODUCT_FAMILY_V1_FIXTURE, "v1");
    expect(version, "fixture must expose v1").toBeDefined();
    if (!version) throw new Error("expected family version v1");
    const size = version.optionGroups.find((g) => g.groupId === "size");
    const accessories = version.optionGroups.find(
      (g) => g.groupId === "accessories",
    );
    expect(size).toMatchObject({
      selection: "single",
      requirement: "required",
      minSelect: 1,
      maxSelect: 1,
    });
    expect(size?.options.every((o) => o.optionId && o.boqIdentity)).toBe(true);
    expect(accessories).toMatchObject({
      selection: "multi",
      requirement: "optional",
      minSelect: 0,
      maxSelect: 2,
    });
  });

  it("rejects malformed group rules at parse time", () => {
    expect(() =>
      parseProductFamilyV1({
        ...PRODUCT_FAMILY_V1_FIXTURE,
        versions: [
          {
            versionId: "bad",
            status: "draft",
            optionGroups: [
              {
                groupId: "g1",
                label: "G",
                selection: "single",
                requirement: "required",
                minSelect: 0,
                maxSelect: 1,
                options: [
                  { optionId: "o1", label: "O", boqIdentity: "BOQ-1" },
                ],
              },
            ],
            compatibilityRules: [],
          },
        ],
        activeVersionId: null,
      }),
    ).toThrow(/minSelect/i);
  });
});

describe("invalid combinations blocked with clear reason", () => {
  const version = getFamilyVersion(PRODUCT_FAMILY_V1_FIXTURE, "v1")!;

  it("accepts a valid complete selection", () => {
    const result = validateFamilyConfiguration(version, [
      "size-1200",
      "finish-oak",
      "acc-panel",
    ]);
    expect(result.ok).toBe(true);
  });

  it("blocks missing required group with plain-language reason", () => {
    const result = validateFamilyConfiguration(version, ["finish-oak"]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.groupId === "size")).toBe(true);
    expect(result.errors[0]?.message).toMatch(/Desk size|Choose/i);
  });

  it("blocks excluded combination with rule message", () => {
    const result = validateFamilyConfiguration(version, [
      "size-1200",
      "finish-white",
      "acc-panel",
      "acc-monitor",
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const err = result.errors.find((e) => e.ruleId === "no-panel-with-monitor");
    expect(err?.message).toMatch(/Privacy panel cannot be combined/i);
  });

  it("blocks requires rule when pedestal without 1600 size", () => {
    const result = validateFamilyConfiguration(version, [
      "size-1200",
      "finish-oak",
      "acc-pedestal",
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const err = result.errors.find((e) => e.ruleId === "pedestal-needs-1600");
    expect(err?.message).toMatch(/Pedestal storage requires/i);
  });

  it("blocks multi group over max", () => {
    const result = validateFamilyConfiguration(version, [
      "size-1600",
      "finish-oak",
      "acc-panel",
      "acc-pedestal",
      "acc-monitor",
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.code === "group_over_max")).toBe(true);
  });
});

describe("Admin form path — draft family from form draft", () => {
  it("builds a draft ProductFamilyV1 from form fields", () => {
    const family = buildDraftFamilyFromForm({
      familyId: "11111111-1111-4111-8111-111111111111",
      familySlug: "draft-family",
      name: "Draft family",
      versionId: "draft-1",
      optionGroups: [
        {
          groupId: "only",
          label: "Only",
          selection: "single",
          requirement: "required",
          minSelect: 1,
          maxSelect: 1,
          options: [
            { optionId: "opt-a", label: "A", boqIdentity: "A-1", boqQuantity: 1 },
          ],
        },
      ],
      compatibilityRules: [],
    });
    expect(family.activeVersionId).toBeNull();
    expect(family.versions[0]?.status).toBe("draft");
    expect(family.versions[0]?.versionId).toBe("draft-1");
  });
});

describe("ADM-FAM-01 plain language options and precise errors", () => {
  const version = getFamilyVersion(PRODUCT_FAMILY_V1_FIXTURE, "v1")!;

  it("uses option group labels in required-field errors", () => {
    const result = validateFamilyConfiguration(version, ["finish-oak"]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const sizeErr = result.errors.find((e) => e.groupId === "size");
    expect(sizeErr?.groupLabel).toBe("Desk size");
    expect(sizeErr?.message).toMatch(/Desk size/);
    expect(formatFamilyConfigError(sizeErr!)).toMatch(/Choose one option/);
  });

  it("formats compatibility errors with plain rule text and selected labels", () => {
    const result = validateFamilyConfiguration(version, [
      "size-1200",
      "finish-white",
      "acc-panel",
      "acc-monitor",
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const err = result.errors.find((e) => e.ruleId === "no-panel-with-monitor");
    expect(err?.message).toMatch(/Privacy panel cannot be combined/i);
    expect(err?.optionLabels).toContain("Monitor arm");
    expect(formatFamilyConfigError(err!)).toMatch(/Incompatible:/);
    expect(formatFamilyConfigError(err!)).toMatch(/Privacy panel/);
  });
});

describe("ADM-FAM-02 one configuration previews matching 2D 3D BOQ identity", () => {
  it("previews footprint, mesh keys, and BOQ lines from the same selection", () => {
    const result = previewFamilyConfiguration(
      PRODUCT_FAMILY_V1_FIXTURE,
      "v1",
      ["size-1600", "finish-oak", "acc-pedestal"],
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected preview ok");
    const { preview } = result;
    expect(preview.matchingIdentities).toBe(true);
    expect(preview.selectedLabels).toEqual(
      expect.arrayContaining(["1600 × 600 mm", "Oak", "Pedestal"]),
    );
    // 2D from size option footprint
    expect(preview.identity2d).toMatchObject({
      widthMm: 1600,
      depthMm: 600,
      heightMm: 750,
    });
    expect(preview.identity2d.symbolKey).toContain("linear-desk-family");
    expect(preview.identity2d.symbolKey).toContain(preview.selectionFingerprint);
    // 3D mesh keys from the same options
    expect(preview.identity3d.meshKeys).toEqual(
      expect.arrayContaining([
        "desk-top-1600",
        "finish-oak",
        "acc-pedestal",
      ]),
    );
    expect(preview.identity3d.primaryMeshKey).toBe("desk-top-1600");
    // BOQ lines from the same options
    expect(preview.identityBoq.lineIdentities).toEqual(
      expect.arrayContaining(["DSK-1600", "FIN-OAK", "ACC-PED"]),
    );
    expect(preview.identityBoq.lines).toHaveLength(3);
    // Same fingerprint ties all three identities
    expect(preview.selectionFingerprint).toBe(
      ["acc-pedestal", "finish-oak", "size-1600"].sort().join("|"),
    );
  });

  it("refuses preview when configuration is invalid (no false release preview)", () => {
    const result = previewFamilyConfiguration(
      PRODUCT_FAMILY_V1_FIXTURE,
      "v1",
      ["size-1200", "finish-oak", "acc-panel", "acc-monitor"],
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected preview to fail");
    expect(result.formattedErrors.some((m) => /Privacy panel/i.test(m))).toBe(
      true,
    );
  });

  it("2D 3D BOQ change together when selection changes", () => {
    const a = previewFamilyConfiguration(PRODUCT_FAMILY_V1_FIXTURE, "v1", [
      "size-1200",
      "finish-oak",
    ]);
    const b = previewFamilyConfiguration(PRODUCT_FAMILY_V1_FIXTURE, "v1", [
      "size-1600",
      "finish-white",
    ]);
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) throw new Error("expected both previews ok");
    expect(a.preview.identity2d.widthMm).toBe(1200);
    expect(b.preview.identity2d.widthMm).toBe(1600);
    expect(a.preview.identity3d.primaryMeshKey).toBe("desk-top-1200");
    expect(b.preview.identity3d.primaryMeshKey).toBe("desk-top-1600");
    expect(a.preview.identityBoq.lineIdentities).toContain("DSK-1200");
    expect(b.preview.identityBoq.lineIdentities).toContain("DSK-1600");
    expect(a.preview.selectionFingerprint).not.toBe(
      b.preview.selectionFingerprint,
    );
  });
});
