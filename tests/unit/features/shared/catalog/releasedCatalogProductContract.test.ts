import { describe, expect, it } from "vitest";

import {
  RELEASED_CATALOG_PRODUCT_SCHEMA_VERSION,
  ReleasedCatalogProductV1Schema,
  parseReleasedCatalogProductV1,
  releasedCatalogProductFromParts,
} from "@/features/shared/catalog/releasedCatalogProductContract";

const validParts = {
  productId: "f81e3a1b-7c4d-4e2a-9f0b-1a2b3c4d5e6f",
  slug: "side-table-001",
  name: "Side table",
  sku: "OFL-TBL-001",
  boqIdentity: "OFL-TBL-001",
  availability: "available" as const,
  dimensionsMm: { width: 600, depth: 600, height: 450 },
  svg: {
    revisionId: "side-table-001-r1",
    checksum:
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    resourceUrl: "/api/planner/catalog/svg/side-table-001-r1",
  },
  definitionTypeId: "side-table-001",
  definitionVersion: 1,
  publishedAt: "2026-07-13T12:00:00.000Z",
};

describe("ReleasedCatalogProductV1 — one versioned core contract (Phase 2)", () => {
  it("pins schema version 1", () => {
    expect(RELEASED_CATALOG_PRODUCT_SCHEMA_VERSION).toBe(1);
  });

  it("includes identity, dimensions, availability, SVG, and BOQ identity keys", () => {
    const parsed = parseReleasedCatalogProductV1({
      schemaVersion: 1,
      ...validParts,
    });
    expect(parsed).toMatchObject({
      productId: expect.any(String),
      slug: expect.any(String),
      name: expect.any(String),
      boqIdentity: expect.any(String),
      availability: "available",
      dimensionsMm: {
        width: expect.any(Number),
        depth: expect.any(Number),
      },
      svg: {
        revisionId: expect.any(String),
        checksum: expect.any(String),
        resourceUrl: expect.any(String),
      },
    });
  });

  it("is the same module from Admin and shared entry points", async () => {
    // Planner catalog-api re-export retired with the fork; shared is canonical.
    const admin = await import(
      "@/features/admin/catalog/releasedCatalogContract"
    );
    const shared = await import(
      "@/features/shared/catalog/releasedCatalogProductContract"
    );
    expect(admin.RELEASED_CATALOG_PRODUCT_SCHEMA_VERSION).toBe(
      shared.RELEASED_CATALOG_PRODUCT_SCHEMA_VERSION,
    );
    expect(admin.ReleasedCatalogProductV1Schema).toBe(
      shared.ReleasedCatalogProductV1Schema,
    );
  });

  it("parses a complete released product record", () => {
    const parsed = parseReleasedCatalogProductV1({
      schemaVersion: 1,
      ...validParts,
    });
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.slug).toBe("side-table-001");
    expect(parsed.svg.revisionId).toBe("side-table-001-r1");
    expect(parsed.boqIdentity).toBe("OFL-TBL-001");
    expect(parsed.dimensionsMm.width).toBe(600);
  });

  it("rejects incomplete records (missing svg, boq, or dimensions)", () => {
    expect(() =>
      ReleasedCatalogProductV1Schema.parse({
        schemaVersion: 1,
        productId: validParts.productId,
        slug: validParts.slug,
        name: validParts.name,
        availability: "available",
        dimensionsMm: { width: 600, depth: 600 },
        // missing svg + boqIdentity
      }),
    ).toThrow();

    expect(() =>
      parseReleasedCatalogProductV1({
        schemaVersion: 1,
        ...validParts,
        dimensionsMm: { width: 0, depth: 600 },
      }),
    ).toThrow();
  });

  it("rejects contradictory svg product identity", () => {
    expect(() =>
      parseReleasedCatalogProductV1({
        schemaVersion: 1,
        ...validParts,
        definitionTypeId: "other-product",
      }),
    ).toThrow(/same product|definitionTypeId|contradict/i);
  });

  it("builds from Admin publish parts without mutating inputs", () => {
    const built = releasedCatalogProductFromParts({
      productId: validParts.productId,
      slug: validParts.slug,
      name: validParts.name,
      sku: validParts.sku,
      boqIdentity: validParts.boqIdentity,
      availability: "available",
      dimensionsMm: validParts.dimensionsMm,
      svgRevisionId: validParts.svg.revisionId,
      svgChecksum: validParts.svg.checksum,
      svgResourceUrl: validParts.svg.resourceUrl,
      definitionTypeId: validParts.definitionTypeId,
      definitionVersion: validParts.definitionVersion,
      publishedAt: validParts.publishedAt,
    });
    expect(built).toEqual({
      schemaVersion: 1,
      ...validParts,
    });
  });
});
