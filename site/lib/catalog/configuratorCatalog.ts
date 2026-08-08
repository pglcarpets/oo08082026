// ---------------------------------------------------------------------------
// Configurator catalog repository (Plan D / D2)
// ---------------------------------------------------------------------------
// Maps the typed parametric `Product` (lib/catalog/types.ts) to/from rows of the
// `configurator_products` table, and provides read access. Writes are done by the
// seed/admin layer with a service-role client (see scripts + API routes).
//
// This is a SEPARATE catalog from the public `products` marketing table — it holds
// the configurator's parametric/discrete/fixed catalog only.

import type {
  DerivedRules,
  Dim,
  Product,
  SizeOption,
  SizingType,
  WorkstationSpec,
} from "./types";

const EPOCH = new Date(0).toISOString();

/** Shape of a `configurator_products` row (snake_case, as stored in Postgres). */
export interface ConfiguratorProductRow {
  id?: string;
  slug: string;
  name: string;
  category: string;
  family: string | null;
  brand_name: string | null;
  sizing_type: SizingType;
  workstation: WorkstationSpec | null;
  size_options: SizeOption[];
  default_footprint: Dim | null;
  derived_rules: DerivedRules | null;
  materials: string[];
  thumbnail_url: string | null;
  model_3d_url: string | null;
  description: string | null;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Map a typed `Product` → an upsert-ready row (omits id so slug drives upsert). */
export function productToRow(product: Product): ConfiguratorProductRow {
  if (!product.sizingType) {
    throw new Error(`Product ${product.id} has no sizingType — cannot persist to configurator_products`);
  }
  return {
    slug: product.slug || product.id,
    name: product.name,
    category: product.category_id,
    family: product.family ?? null,
    brand_name: product.brandName ?? null,
    sizing_type: product.sizingType,
    workstation: product.workstation ?? null,
    size_options: product.sizeOptions ?? [],
    default_footprint: product.defaultFootprint ?? null,
    derived_rules: product.derivedRules ?? null,
    materials: product.specs?.materials ?? [],
    thumbnail_url: product.thumbnailUrl ?? null,
    model_3d_url: product.model3dUrl ?? null,
    description: product.description ?? null,
  };
}

/** Map a `configurator_products` row → the typed `Product` used by the app. */
export function rowToProduct(row: ConfiguratorProductRow): Product {
  return {
    id: row.slug,
    slug: row.slug,
    name: row.name,
    category_id: row.category,
    series: row.family ? row.family.toLowerCase().replace(/\s+/g, "-") : row.category,
    series_id: `${row.category}-${(row.family ?? row.category).toLowerCase().replace(/\s+/g, "-")}`,
    series_name: row.family ?? row.category,
    family: row.family ?? undefined,
    brandName: row.brand_name ?? undefined,
    description: row.description ?? "",
    images: [],
    sizingType: row.sizing_type,
    workstation: row.workstation ?? undefined,
    sizeOptions: row.size_options?.length ? row.size_options : undefined,
    defaultFootprint: row.default_footprint ?? undefined,
    derivedRules: row.derived_rules ?? undefined,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    model3dUrl: row.model_3d_url ?? undefined,
    specs: {
      dimensions: "",
      materials: row.materials ?? [],
      features: [],
    },
    created_at: row.created_at ?? EPOCH,
    metadata: { source: "configurator-catalog", category: row.category },
  } as Product;
}
