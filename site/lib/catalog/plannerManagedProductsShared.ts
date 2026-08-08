/**
 * Normalize a `planner_managed_products` row (or local payload) to a stable shape.
 */

export type PlannerManagedProductNormalized = {
  id: string;
  slug: string;
  planner_source_slug: string;
  name: string;
  description: string;
  category: string;
  category_id: string;
  category_name: string;
  series_id: string;
  series_name: string;
  flagship_image: string;
  images: string[];
  specs: Record<string, unknown>;
  metadata: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBool(value: unknown, fallback = true): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export function normalizePlannerManagedProductRow(
  row: unknown,
): PlannerManagedProductNormalized {
  const r = asRecord(row);
  const now = new Date().toISOString();
  return {
    id: asString(r.id, cryptoRandomId()),
    slug: asString(r.slug),
    planner_source_slug: asString(r.planner_source_slug, asString(r.slug)),
    name: asString(r.name, "Untitled"),
    description: asString(r.description),
    category: asString(r.category, "misc"),
    category_id: asString(r.category_id, asString(r.category, "misc")),
    category_name: asString(r.category_name, asString(r.category, "misc")),
    series_id: asString(r.series_id, "general"),
    series_name: asString(r.series_name, "General"),
    flagship_image: asString(r.flagship_image),
    images: asStringArray(r.images),
    specs: asRecord(r.specs),
    metadata: asRecord(r.metadata),
    active: asBool(r.active, true),
    created_at: asString(r.created_at, now),
    updated_at: asString(r.updated_at, now),
  };
}

function cryptoRandomId(): string {
  try {
    return globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}`;
  } catch {
    return `local-${Date.now()}`;
  }
}
