/**
 * nuqs parsers for product category filter URL state.
 * URL keys stay aligned with `buildFilterParams` in filters.ts (API + product card `from=`).
 */
import {
  createParser,
  parseAsNativeArrayOf,
  parseAsString,
  parseAsStringLiteral,
  type inferParserType,
} from "nuqs/server";

import {
  DEFAULT_FILTERS,
  PRICE_RANGES,
  type ActiveFilters,
  type PriceRange,
  type SortOption,
} from "./filters";

const SORT_OPTIONS = ["az", "za", "ecoDesc", "ecoAsc"] as const satisfies readonly SortOption[];

/** Presence flag: only `1` is written (matches buildFilterParams). */
const parseAsOneFlag = createParser({
  parse: (value: string): boolean | null => (value === "1" ? true : null),
  serialize: (value: boolean) => (value ? "1" : "0"),
}).withDefault(false);

const parseAsNonEmptyString = createParser({
  parse: (value: string) => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  },
  serialize: (value: string) => value,
});

const parseAsPriceRange = createParser({
  parse: (value: string) => {
    const trimmed = value.trim();
    return PRICE_RANGES.includes(trimmed as PriceRange)
      ? (trimmed as PriceRange)
      : null;
  },
  serialize: (value: PriceRange) => value,
});

const parseAsEcoMin = createParser({
  parse: (value: string) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 10) {
      return null;
    }
    return parsed;
  },
  serialize: (value: number) => String(value),
});

/**
 * Parser map for `useQueryStates`. State keys match `ActiveFilters` field names;
 * URL keys are remapped via `filterUrlKeys`.
 */
export const filterSearchParams = {
  series: parseAsString.withDefault(DEFAULT_FILTERS.series),
  query: parseAsString.withDefault(DEFAULT_FILTERS.query),
  sort: parseAsStringLiteral(SORT_OPTIONS).withDefault(DEFAULT_FILTERS.sort),
  subcategory: parseAsNativeArrayOf(parseAsNonEmptyString),
  priceRange: parseAsNativeArrayOf(parseAsPriceRange),
  material: parseAsNativeArrayOf(parseAsNonEmptyString),
  hasHeadrest: parseAsOneFlag,
  isHeightAdjustable: parseAsOneFlag,
  bifmaCertified: parseAsOneFlag,
  isStackable: parseAsOneFlag,
  ecoMin: parseAsEcoMin,
};

/** Maps ActiveFilters field names → URL query keys used by buildFilterParams. */
export const filterUrlKeys = {
  query: "q",
  subcategory: "sub",
  priceRange: "price",
  material: "mat",
  hasHeadrest: "headrest",
  isHeightAdjustable: "heightAdj",
  bifmaCertified: "bifma",
  isStackable: "stackable",
} as const;

export type FilterQueryState = inferParserType<typeof filterSearchParams>;

/** Coerce nuqs state into ActiveFilters (ecoMin may be null). */
export function toActiveFilters(state: FilterQueryState): ActiveFilters {
  return {
    series: state.series,
    query: state.query,
    sort: state.sort,
    subcategory: dedupeStrings(state.subcategory),
    priceRange: dedupeStrings(state.priceRange),
    material: dedupeStrings(state.material),
    hasHeadrest: state.hasHeadrest,
    isHeightAdjustable: state.isHeightAdjustable,
    bifmaCertified: state.bifmaCertified,
    isStackable: state.isStackable,
    ecoMin: state.ecoMin,
  };
}

function dedupeStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}
