// @vitest-environment node
import { describe, it, expect } from "vitest";
import { getTableName, isTable } from "drizzle-orm";
import {
  catalogProducts,
  catalogCategories,
  catalogProductSpecs,
  catalogProductImages,
  catalogProductSlugAliases,
  configuratorProducts,
  businessStatsCurrent,
  svgRevisions,
  svgRevisionArtifacts,
  blockDescriptors,
} from "@/platform/drizzle/schema/catalog";

describe("platform/drizzle/schema/catalog", () => {
  const expectedTables: Array<{ table: unknown; name: string }> = [
    { table: catalogProducts, name: "catalog_products" },
    { table: catalogCategories, name: "catalog_categories" },
    { table: catalogProductSpecs, name: "catalog_product_specs" },
    { table: catalogProductImages, name: "catalog_product_images" },
    { table: catalogProductSlugAliases, name: "catalog_product_slug_aliases" },
    { table: configuratorProducts, name: "configurator_products" },
    { table: businessStatsCurrent, name: "business_stats_current" },
    { table: svgRevisions, name: "svg_revisions" },
    { table: svgRevisionArtifacts, name: "svg_revision_artifacts" },
    { table: blockDescriptors, name: "block_descriptors" },
  ];

  it("exports pgTable symbols for products/catalog tables", () => {
    for (const { table, name } of expectedTables) {
      expect(isTable(table), name).toBe(true);
      expect(getTableName(table as Parameters<typeof getTableName>[0])).toBe(name);
    }
  });

  it("catalog_products exposes core columns", () => {
    expect(catalogProducts.id).toBeDefined();
    expect(catalogProducts.slug).toBeDefined();
    expect(catalogProducts.name).toBeDefined();
  });

  it("svg_revisions exposes revision identity columns", () => {
    expect(svgRevisions.revisionId).toBeDefined();
    expect(svgRevisions.slug).toBeDefined();
    expect(svgRevisions.version).toBeDefined();
  });
});
