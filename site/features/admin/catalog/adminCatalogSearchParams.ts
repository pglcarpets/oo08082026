/**
 * nuqs parsers for the admin catalog list — search/category/status/page live
 * in the URL so filtered views are shareable and survive reload (Phase 4).
 */
import { parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs";

const VISIBLE_OPTIONS = ["", "true", "false"] as const;

export const adminCatalogSearchParams = {
  search: parseAsString.withDefault(""),
  category: parseAsString.withDefault(""),
  visible: parseAsStringLiteral(VISIBLE_OPTIONS).withDefault(""),
  page: parseAsInteger.withDefault(1),
};
