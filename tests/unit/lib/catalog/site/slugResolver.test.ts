import { describe, expect, it } from "vitest";

import {
  buildCanonicalCatalogProductSlug,
  buildCanonicalProductSlug,
  buildCanonicalSeriesId,
  buildLegacyProductSlug,
  canonicalCategorySlugSegment,
  categorySlugSegment,
  isCanonicalCatalogSlug,
  isLegacyCatalogSlug,
  isSupportedCatalogSlug,
  repairProductSlug,
  slugifyProductName,
} from "@/lib/catalog/site/slugResolver";

describe("site catalog slugResolver", () => {
  describe("slugifyProductName", () => {
    it("delegates to catalog token slugify", () => {
      expect(slugifyProductName("Fluid X Chair")).toBe("fluid-x-chair");
      expect(slugifyProductName("  ")).toBe("");
    });
  });

  describe("categorySlugSegment", () => {
    it("maps legacy oando category ids", () => {
      expect(categorySlugSegment("oando-seating")).toBe("seating");
      expect(categorySlugSegment("oando-workstations")).toBe("workstations");
      expect(categorySlugSegment("storages")).toBe("storage");
      expect(categorySlugSegment("education")).toBe("educational");
    });

    it("strips oando prefix from unknown ids", () => {
      expect(categorySlugSegment("oando-custom")).toBe("custom");
    });

    it("falls back to products for empty input", () => {
      expect(categorySlugSegment("")).toBe("products");
      expect(categorySlugSegment(null)).toBe("products");
    });
  });

  describe("canonicalCategorySlugSegment", () => {
    it("returns canonical category ids", () => {
      expect(canonicalCategorySlugSegment("oando-seating")).toBe("seating");
      expect(canonicalCategorySlugSegment("storage")).toBe("storages");
    });

    it("slugifies unknown categories", () => {
      expect(canonicalCategorySlugSegment("Custom Range")).toBe("custom-range");
    });
  });

  describe("buildCanonicalCatalogProductSlug", () => {
    it("builds category-subcategory-product slug", () => {
      expect(
        buildCanonicalCatalogProductSlug({
          categoryId: "seating",
          subcategoryLabel: "Mesh chairs",
          name: "Task Pro",
        }),
      ).toBe("seating-mesh-task-pro");
    });

    it("omits subcategory when absent", () => {
      expect(
        buildCanonicalCatalogProductSlug({
          categoryId: "tables",
          name: "Opus Meet",
        }),
      ).toBe("tables-opus-meet");
    });

    it("returns empty string when name slugifies to empty", () => {
      expect(
        buildCanonicalCatalogProductSlug({
          categoryId: "seating",
          name: "!!!",
        }),
      ).toBe("");
    });
  });

  describe("buildCanonicalSeriesId", () => {
    it("builds series id with general subcategory fallback", () => {
      expect(
        buildCanonicalSeriesId({
          categoryId: "workstations",
          seriesName: "DeskPro",
        }),
      ).toBe("workstations-general-deskpro");
    });

    it("uses resolved subcategory when provided", () => {
      expect(
        buildCanonicalSeriesId({
          categoryId: "seating",
          subcategoryId: "mesh",
          seriesName: "Mesh Line",
        }),
      ).toBe("seating-mesh-mesh-line");
    });
  });

  describe("legacy and canonical slug detection", () => {
    it("detects legacy oando double-dash slugs", () => {
      expect(isLegacyCatalogSlug("oando-seating--arvo", "seating")).toBe(true);
      expect(isLegacyCatalogSlug("seating-mesh-arvo", "seating")).toBe(false);
      expect(isLegacyCatalogSlug("", "seating")).toBe(false);
    });

    it("detects canonical category-prefixed slugs", () => {
      expect(isCanonicalCatalogSlug("seating-mesh-arvo", "seating")).toBe(true);
      expect(isCanonicalCatalogSlug("oando-seating--arvo", "seating")).toBe(false);
      expect(isCanonicalCatalogSlug("", "seating")).toBe(false);
    });

    it("accepts either format as supported", () => {
      expect(isSupportedCatalogSlug("oando-seating--arvo", "seating")).toBe(true);
      expect(isSupportedCatalogSlug("seating-mesh-arvo", "seating")).toBe(true);
      expect(isSupportedCatalogSlug("random-slug", "seating")).toBe(false);
    });
  });

  describe("buildLegacyProductSlug and buildCanonicalProductSlug", () => {
    it("builds legacy oando slug", () => {
      expect(buildLegacyProductSlug("seating", "Arvo Chair")).toBe("oando-seating--arvo-chair");
    });

    it("returns empty when product name is blank", () => {
      expect(buildLegacyProductSlug("seating", "   ")).toBe("");
    });

    it("buildCanonicalProductSlug mirrors legacy builder", () => {
      expect(buildCanonicalProductSlug("tables", "Opus")).toBe("oando-tables--opus");
    });
  });

  describe("repairProductSlug", () => {
    it("keeps existing slug when present", () => {
      expect(
        repairProductSlug({
          slug: "  Seating-Mesh-Arvo  ",
          categoryId: "seating",
          name: "Arvo",
        }),
      ).toBe("seating-mesh-arvo");
    });

    it("builds legacy slug when slug missing", () => {
      expect(
        repairProductSlug({
          categoryId: "seating",
          name: "Arvo Chair",
        }),
      ).toBe("oando-seating--arvo-chair");
    });
  });
});