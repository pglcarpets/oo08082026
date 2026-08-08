import { describe, expect, it } from "vitest";
import { createSerializer } from "nuqs/server";

import {
  DEFAULT_FILTERS,
  buildFilterParams,
  type ActiveFilters,
} from "@/lib/catalog/site/filters";
import {
  filterSearchParams,
  filterUrlKeys,
  toActiveFilters,
  type FilterQueryState,
} from "@/lib/catalog/site/filterSearchParams";

const serializeFilters = createSerializer(filterSearchParams, {
  urlKeys: filterUrlKeys,
  clearOnDefault: true,
});

function stateFromActive(filters: ActiveFilters): FilterQueryState {
  return {
    series: filters.series,
    query: filters.query,
    sort: filters.sort,
    subcategory: filters.subcategory,
    priceRange: filters.priceRange as FilterQueryState["priceRange"],
    material: filters.material,
    hasHeadrest: filters.hasHeadrest,
    isHeightAdjustable: filters.isHeightAdjustable,
    bifmaCertified: filters.bifmaCertified,
    isStackable: filters.isStackable,
    ecoMin: filters.ecoMin,
  };
}

describe("filterSearchParams", () => {
  it("toActiveFilters maps defaults", () => {
    const defaults: FilterQueryState = {
      series: "all",
      query: "",
      sort: "az",
      subcategory: [],
      priceRange: [],
      material: [],
      hasHeadrest: false,
      isHeightAdjustable: false,
      bifmaCertified: false,
      isStackable: false,
      ecoMin: null,
    };
    expect(toActiveFilters(defaults)).toEqual(DEFAULT_FILTERS);
  });

  it("toActiveFilters dedupes multi-value facets", () => {
    const state: FilterQueryState = {
      ...stateFromActive(DEFAULT_FILTERS),
      subcategory: ["mesh", "mesh", "leather"],
      material: ["fabric", "fabric"],
    };
    expect(toActiveFilters(state).subcategory).toEqual(["mesh", "leather"]);
    expect(toActiveFilters(state).material).toEqual(["fabric"]);
  });

  it("serialize matches buildFilterParams keys for full filter set", () => {
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

    const fromNuqs = new URLSearchParams(
      serializeFilters(stateFromActive(active)).replace(/^\?/, ""),
    );
    const fromBuild = buildFilterParams(active);

    expect(fromNuqs.get("series")).toBe(fromBuild.get("series"));
    expect(fromNuqs.get("q")).toBe(fromBuild.get("q"));
    expect(fromNuqs.get("sort")).toBe(fromBuild.get("sort"));
    expect(fromNuqs.getAll("sub").sort()).toEqual(fromBuild.getAll("sub").sort());
    expect(fromNuqs.getAll("price")).toEqual(fromBuild.getAll("price"));
    expect(fromNuqs.getAll("mat")).toEqual(fromBuild.getAll("mat"));
    expect(fromNuqs.get("headrest")).toBe(fromBuild.get("headrest"));
    expect(fromNuqs.get("heightAdj")).toBe(fromBuild.get("heightAdj"));
    expect(fromNuqs.get("bifma")).toBe(fromBuild.get("bifma"));
    expect(fromNuqs.get("stackable")).toBe(fromBuild.get("stackable"));
    expect(fromNuqs.get("ecoMin")).toBe(fromBuild.get("ecoMin"));
  });

  it("serialize omits defaults (empty query string)", () => {
    const qs = serializeFilters(stateFromActive(DEFAULT_FILTERS));
    expect(qs === "" || qs === "?").toBe(true);
  });

  it("flag parsers use 1 for true", () => {
    const qs = serializeFilters({
      hasHeadrest: true,
      isHeightAdjustable: true,
      bifmaCertified: true,
      isStackable: true,
    });
    const params = new URLSearchParams(qs.replace(/^\?/, ""));
    expect(params.get("headrest")).toBe("1");
    expect(params.get("heightAdj")).toBe("1");
    expect(params.get("bifma")).toBe("1");
    expect(params.get("stackable")).toBe("1");
  });
});
