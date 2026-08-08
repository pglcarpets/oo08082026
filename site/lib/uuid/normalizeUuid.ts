import { validate as uuidValidate, v5 as uuidv5 } from "uuid";

/** Stable namespace for slug → UUID when legacy rows lack a UUID id. */
export const CATALOG_PRODUCT_ID_NAMESPACE = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

export function normalizeUuid(value: unknown): string | undefined {
  if (typeof value !== "string") {return undefined;}
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {return undefined;}
  return uuidValidate(trimmed) ? trimmed : undefined;
}

export function catalogProductIdFromSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) {
    throw new Error("catalogProductIdFromSlug requires a non-empty slug");
  }
  return uuidv5(normalized, CATALOG_PRODUCT_ID_NAMESPACE);
}

/** Prefer live UUID; otherwise deterministic UUID from slug (never slug-as-id). */
export function normalizeCatalogProductId(id: unknown, slug: string): string {
  return normalizeUuid(id) ?? catalogProductIdFromSlug(slug);
}
