/**
 * nuqs parsers for the admin plans list — status/search/sort live in the URL
 * so filtered views are shareable and survive reload (Phase 4).
 */
import { parseAsString, parseAsStringLiteral } from "nuqs";

const STATUS_VALUES = ["all", "draft", "active", "archived"] as const;
const SORT_VALUES = [
  "updated_at:desc",
  "updated_at:asc",
  "created_at:desc",
  "created_at:asc",
] as const;

export const adminPlansSearchParams = {
  status: parseAsStringLiteral(STATUS_VALUES).withDefault("all"),
  search: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(SORT_VALUES).withDefault("updated_at:desc"),
};
