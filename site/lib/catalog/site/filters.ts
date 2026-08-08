import {
  getCanonicalSubcategoryId,
  getCanonicalSubcategoryLabel,
} from "./categories";

export const PRICE_RANGES = ["budget", "mid", "premium", "luxury"] as const;
export type PriceRange = (typeof PRICE_RANGES)[number];

export const SUSTAINABILITY_THRESHOLDS = [4, 6, 8] as const;

export type SortOption = "az" | "za" | "ecoDesc" | "ecoAsc";

export interface ActiveFilters {
  series: string;
  subcategory: string[];
  priceRange: string[];
  material: string[];
  hasHeadrest: boolean;
  isHeightAdjustable: boolean;
  bifmaCertified: boolean;
  isStackable: boolean;
  sort: SortOption;
  query: string;
  ecoMin: number | null;
}

export const DEFAULT_FILTERS: ActiveFilters = {
  series: "all",
  subcategory: [],
  priceRange: [],
  material: [],
  hasHeadrest: false,
  isHeightAdjustable: false,
  bifmaCertified: false,
  isStackable: false,
  sort: "az",
  query: "",
  ecoMin: null,
};

export function normalizeOptionValue(value?: string | null): string {
  return (value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

type SubcategoryFilterProduct = {
  metadata?: {
    subcategory?: string;
    subcategoryId?: string;
  };
};

function collectSubcategoryMatchTokens(categoryId: string, value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) {return [];}

  const tokens = new Set<string>([normalizeOptionValue(trimmed)]);
  const canonicalId = getCanonicalSubcategoryId(categoryId, trimmed);
  tokens.add(normalizeOptionValue(canonicalId));

  const canonicalLabel = getCanonicalSubcategoryLabel(categoryId, canonicalId, "");
  if (canonicalLabel) {
    tokens.add(normalizeOptionValue(canonicalLabel));
  }

  return [...tokens];
}

export function productMatchesSubcategoryFilters(
  categoryId: string,
  product: SubcategoryFilterProduct,
  filterValues: string[],
): boolean {
  if (filterValues.length === 0) {return true;}

  const productTokens = new Set<string>();
  for (const value of [
    product.metadata?.subcategory || "",
    product.metadata?.subcategoryId || "",
  ]) {
    for (const token of collectSubcategoryMatchTokens(categoryId, value)) {
      productTokens.add(token);
    }
  }

  const filterTokens = new Set<string>();
  for (const filterValue of filterValues) {
    for (const token of collectSubcategoryMatchTokens(categoryId, filterValue)) {
      filterTokens.add(token);
    }
  }

  for (const token of filterTokens) {
    if (productTokens.has(token)) {return true;}
  }

  return false;
}

export function parseSortOption(value: string | null): SortOption {
  if (value === "za" || value === "ecoDesc" || value === "ecoAsc") {return value;}
  return "az";
}

export function parseEcoMin(value: string | null): number | null {
  if (!value) {return null;}
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {return null;}
  if (parsed < 0 || parsed > 10) {return null;}
  return parsed;
}

function uniqueValues(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export function parseFiltersFromSearchParams(sp: URLSearchParams): ActiveFilters {
  return {
    series: sp.get("series") ?? DEFAULT_FILTERS.series,
    query: sp.get("q") ?? DEFAULT_FILTERS.query,
    sort: parseSortOption(sp.get("sort")),
    subcategory: uniqueValues(sp.getAll("sub")),
    priceRange: uniqueValues(
      sp
        .getAll("price")
        .filter((value) => PRICE_RANGES.includes(value as PriceRange)),
    ),
    material: uniqueValues(sp.getAll("mat")),
    hasHeadrest: sp.get("headrest") === "1",
    isHeightAdjustable:
      sp.get("heightAdj") === "1" || sp.get("height-adj") === "1",
    bifmaCertified:
      sp.get("bifma") === "1" || sp.get("bifmaCertified") === "1",
    isStackable:
      sp.get("stackable") === "1" || sp.get("isStackable") === "1",
    ecoMin: parseEcoMin(sp.get("ecoMin")),
  };
}

export function buildFilterParams(filters: ActiveFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.series !== DEFAULT_FILTERS.series) {params.set("series", filters.series);}
  if (filters.query) {params.set("q", filters.query);}
  if (filters.sort !== DEFAULT_FILTERS.sort) {params.set("sort", filters.sort);}
  filters.subcategory.forEach((value) => params.append("sub", value));
  filters.priceRange.forEach((value) => params.append("price", value));
  filters.material.forEach((value) => params.append("mat", value));
  if (filters.hasHeadrest) {params.set("headrest", "1");}
  if (filters.isHeightAdjustable) {params.set("heightAdj", "1");}
  if (filters.bifmaCertified) {params.set("bifma", "1");}
  if (filters.isStackable) {params.set("stackable", "1");}
  if (typeof filters.ecoMin === "number") {params.set("ecoMin", String(filters.ecoMin));}

  return params;
}

export function buildFilterUrl(pathname: string, filters: ActiveFilters): string {
  const params = buildFilterParams(filters);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function countActiveFilters(filters: ActiveFilters): number {
  let count = 0;
  if (filters.series !== DEFAULT_FILTERS.series) {count++;}
  if (filters.query.trim()) {count++;}
  count += filters.subcategory.length;
  count += filters.priceRange.length;
  count += filters.material.length;
  if (filters.hasHeadrest) {count++;}
  if (filters.isHeightAdjustable) {count++;}
  if (filters.bifmaCertified) {count++;}
  if (filters.isStackable) {count++;}
  if (filters.ecoMin !== null) {count++;}
  return count;
}
