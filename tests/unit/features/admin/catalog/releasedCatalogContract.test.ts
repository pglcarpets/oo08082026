import { describe, expect, it } from "vitest";
import * as admin from "@/features/admin/catalog/releasedCatalogContract";
import * as shared from "@/features/shared/catalog/releasedCatalogProductContract";

const baseParts = {
  productId: "11111111-1114-4111-8111-111111111111",
  slug: "desk-basic",
  name: "Basic Desk",
  sku: "DESK-001",
  boqIdentity: "BOQ-DESK-001",
  availability: "available" as const,
  dimensionsMm: { width: 1200, depth: 600, height: 750 },
  svgRevisionId: "rev-1",
  svgChecksum: "a".repeat(64),
  svgResourceUrl: "/svg-catalog/desk-basic.svg",
  definitionTypeId: "desk-basic",
  definitionVersion: 1,
  publishedAt: "2026-07-01T00:00:00.000Z",
};

describe("admin releasedCatalogContract re-export", () => {
  it("mirrors shared schema version and helpers", () => {
    expect(admin.RELEASED_CATALOG_PRODUCT_SCHEMA_VERSION).toBe(
      shared.RELEASED_CATALOG_PRODUCT_SCHEMA_VERSION,
    );
    expect(admin.parseReleasedCatalogProductV1).toBe(
      shared.parseReleasedCatalogProductV1,
    );
    expect(admin.releasedCatalogProductFromParts).toBe(
      shared.releasedCatalogProductFromParts,
    );
    expect(admin.ReleasedCatalogProductV1Schema).toBe(
      shared.ReleasedCatalogProductV1Schema,
    );
    expect(admin.ReleasedAvailabilitySchema).toBe(
      shared.ReleasedAvailabilitySchema,
    );
  });

  it("builds a product from parts", () => {
    const product = admin.releasedCatalogProductFromParts(baseParts);
    const parsed = admin.parseReleasedCatalogProductV1(product);
    expect(parsed.slug).toBe("desk-basic");
    expect(parsed.name).toBe("Basic Desk");
    expect(parsed.svg.checksum).toHaveLength(64);
    expect(parsed.availability).toBe("available");
  });

  it("rejects definitionTypeId that contradicts slug", () => {
    expect(() =>
      admin.releasedCatalogProductFromParts({
        ...baseParts,
        definitionTypeId: "other-slug",
      }),
    ).toThrow(/definitionTypeId|same-product/i);
  });

  it("rejects invalid slug, checksum, and non-uuid productId", () => {
    expect(() =>
      admin.releasedCatalogProductFromParts({
        ...baseParts,
        slug: "Bad_Slug",
        definitionTypeId: "Bad_Slug",
      }),
    ).toThrow();
    expect(() =>
      admin.releasedCatalogProductFromParts({
        ...baseParts,
        svgChecksum: "not-a-sha",
      }),
    ).toThrow();
    expect(() =>
      admin.releasedCatalogProductFromParts({
        ...baseParts,
        productId: "not-a-uuid",
      }),
    ).toThrow();
  });

  it("accepts unavailable and retired availability", () => {
    for (const availability of ["unavailable", "retired"] as const) {
      const product = admin.releasedCatalogProductFromParts({
        ...baseParts,
        availability,
      });
      expect(product.availability).toBe(availability);
    }
  });

  it("omits optional sku when not provided", () => {
    const { sku: _sku, ...withoutSku } = baseParts;
    const product = admin.releasedCatalogProductFromParts(withoutSku);
    expect(product.sku).toBeUndefined();
  });
});
