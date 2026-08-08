import { describe, expect, it } from "vitest";

import {
  DEFAULT_FILTERS,
  PRICE_RANGES,
  buildFilterParams,
  buildFilterUrl,
  countActiveFilters,
  normalizeOptionValue,
  parseEcoMin,
  parseFiltersFromSearchParams,
  parseSortOption,
  productMatchesSubcategoryFilters,
  type ActiveFilters,
} from "@/lib/catalog/site/filters";

describe("site catalog filters", () => {
  describe("normalizeOptionValue", () => {
    it("trims, collapses whitespace, and lowercases", () => {
      expect(normalizeOptionValue("  Mesh   Chair  ")).toBe("mesh chair");
      expect(normalizeOptionValue(null)).toBe("");
      expect(normalizeOptionValue(undefined)).toBe("");
    });
  });

  describe("productMatchesSubcategoryFilters", () => {
    const heightAdjustableProduct = {
      metadata: {
        subcategory: "Height Adjustable Series",
        subcategoryId: "height-adjustable",
      },
    };

    it("matches canonical subcategory labels", () => {
      expect(
        productMatchesSubcategoryFilters(
          "workstations",
          heightAdjustableProduct,
          ["Height Adjustable Series"],
        ),
      ).toBe(true);
    });

    it("matches canonical subcategory ids", () => {
      expect(
        productMatchesSubcategoryFilters(
          "workstations",
          heightAdjustableProduct,
          ["height-adjustable"],
        ),
      ).toBe(true);
    });

    it("matches when only subcategoryId is set on the product", () => {
      expect(
        productMatchesSubcategoryFilters(
          "workstations",
          { metadata: { subcategoryId: "height-adjustable" } },
          ["Height Adjustable Series"],
        ),
      ).toBe(true);
    });

    it("does not match unrelated subcategories", () => {
      expect(
        productMatchesSubcategoryFilters(
          "workstations",
          { metadata: { subcategory: "Desking Series", subcategoryId: "desking" } },
          ["Height Adjustable Series"],
        ),
      ).toBe(false);
    });
  });

  describe("parseSortOption", () => {
    it("accepts valid sort values", () => {
      expect(parseSortOption("za")).toBe("za");
      expect(parseSortOption("ecoDesc")).toBe("ecoDesc");
      expect(parseSortOption("ecoAsc")).toBe("ecoAsc");
    });

    it("defaults to az for unknown or null", () => {
      expect(parseSortOption(null)).toBe("az");
      expect(parseSortOption("invalid")).toBe("az");
    });
  });

  describe("parseEcoMin", () => {
    it("parses valid eco scores", () => {
      expect(parseEcoMin("0")).toBe(0);
      expect(parseEcoMin("10")).toBe(10);
      expect(parseEcoMin("6")).toBe(6);
    });

    it("rejects invalid eco scores", () => {
      expect(parseEcoMin(null)).toBeNull();
      expect(parseEcoMin("")).toBeNull();
      expect(parseEcoMin("abc")).toBeNull();
      expect(parseEcoMin("-1")).toBeNull();
      expect(parseEcoMin("11")).toBeNull();
    });
  });

  describe("parseFiltersFromSearchParams", () => {
    it("returns defaults for empty params", () => {
      const filters = parseFiltersFromSearchParams(new URLSearchParams());
      expect(filters).toEqual(DEFAULT_FILTERS);
    });

    it("parses all supported filter keys", () => {
      const sp = new URLSearchParams({
        series: "mesh",
        q: "  task chair  ",
        sort: "ecoDesc",
        headrest: "1",
        heightAdj: "1",
        bifma: "1",
        stackable: "1",
        ecoMin: "8",
      });
      sp.append("sub", "mesh");
      sp.append("sub", "  leather  ");
      sp.append("price", "budget");
      sp.append("price", "invalid");
      sp.append("mat", "fabric");
      sp.append("mat", "");

      const filters = parseFiltersFromSearchParams(sp);
      expect(filters.series).toBe("mesh");
      expect(filters.query).toBe("  task chair  ");
      expect(filters.sort).toBe("ecoDesc");
      expect(filters.subcategory).toEqual(["mesh", "leather"]);
      expect(filters.priceRange).toEqual(["budget"]);
      expect(filters.material).toEqual(["fabric"]);
      expect(filters.hasHeadrest).toBe(true);
      expect(filters.isHeightAdjustable).toBe(true);
      expect(filters.bifmaCertified).toBe(true);
      expect(filters.isStackable).toBe(true);
      expect(filters.ecoMin).toBe(8);
    });

    it("accepts legacy height-adj and bifmaCertified aliases", () => {
      const sp = new URLSearchParams({
        "height-adj": "1",
        bifmaCertified: "1",
        isStackable: "1",
      });
      const filters = parseFiltersFromSearchParams(sp);
      expect(filters.isHeightAdjustable).toBe(true);
      expect(filters.bifmaCertified).toBe(true);
      expect(filters.isStackable).toBe(true);
    });

    it("only keeps known price ranges", () => {
      const sp = new URLSearchParams();
      for (const range of PRICE_RANGES) sp.append("price", range);
      sp.append("price", "ultra");
      expect(parseFiltersFromSearchParams(sp).priceRange).toEqual([...PRICE_RANGES]);
    });
  });

  describe("buildFilterParams and buildFilterUrl", () => {
    const active: ActiveFilters = {
      ...DEFAULT_FILTERS,
      series: "mesh",
      query: "chair",
      sort: "za",
      subcategory: ["mesh", "leather"],
      priceRange: ["mid"],
      material: ["fabric"],
      hasHeadrest: true,
      isHeightAdjustable: true,
      bifmaCertified: true,
      isStackable: true,
      ecoMin: 6,
    };

    it("serializes active filters to search params", () => {
      const params = buildFilterParams(active);
      expect(params.get("series")).toBe("mesh");
      expect(params.get("q")).toBe("chair");
      expect(params.get("sort")).toBe("za");
      expect(params.getAll("sub")).toEqual(["mesh", "leather"]);
      expect(params.getAll("price")).toEqual(["mid"]);
      expect(params.getAll("mat")).toEqual(["fabric"]);
      expect(params.get("headrest")).toBe("1");
      expect(params.get("heightAdj")).toBe("1");
      expect(params.get("bifma")).toBe("1");
      expect(params.get("stackable")).toBe("1");
      expect(params.get("ecoMin")).toBe("6");
    });

    it("omits default values from params", () => {
      const params = buildFilterParams(DEFAULT_FILTERS);
      expect(params.toString()).toBe("");
    });

    it("builds pathname-only url when no filters active", () => {
      expect(buildFilterUrl("/products/seating", DEFAULT_FILTERS)).toBe("/products/seating");
    });

    it("builds query string url when filters active", () => {
      const url = buildFilterUrl("/products/seating", {
        ...DEFAULT_FILTERS,
        query: "mesh",
      });
      expect(url).toBe("/products/seating?q=mesh");
    });
  });

  describe("countActiveFilters", () => {
    it("counts zero for defaults", () => {
      expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0);
    });

    it("counts each active dimension", () => {
      expect(
        countActiveFilters({
          ...DEFAULT_FILTERS,
          series: "mesh",
          query: "chair",
          subcategory: ["mesh"],
          priceRange: ["budget"],
          material: ["leather"],
          hasHeadrest: true,
          isHeightAdjustable: true,
          bifmaCertified: true,
          isStackable: true,
          ecoMin: 5,
        }),
      ).toBe(10);
    });

    it("ignores whitespace-only query", () => {
      expect(countActiveFilters({ ...DEFAULT_FILTERS, query: "   " })).toBe(0);
    });
  });
});