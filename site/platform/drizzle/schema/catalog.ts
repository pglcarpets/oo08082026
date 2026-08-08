import { sql } from "drizzle-orm";
import { boolean, check, date, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/** Products Supabase — marketing catalog (canonical table name). */
export const catalogProducts = pgTable("catalog_products", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  category: text("category"),
  category_id: text("category_id"),
  performance_tier: text("performance_tier"),
  flagship_image: text("flagship_image"),
  description: text("description"),
  scene_images: text("scene_images").array(),
  variants: jsonb("variants"),
  detailed_info: jsonb("detailed_info"),
  metadata: jsonb("metadata"),
  specs: jsonb("specs"),
  series_id: text("series_id"),
  series_name: text("series_name"),
  created_at: timestamp("created_at", { withTimezone: true }),
  images: jsonb("images"),
  alt_text: text("alt_text"),
  model_3d: text("3d_model"),
  canonical_category_id: text("canonical_category_id"),
  canonical_series_id: text("canonical_series_id"),
  canonical_slug_v2: text("canonical_slug_v2"),
  canonical_subcategory_id: text("canonical_subcategory_id"),
  canonical_subcategory_label: text("canonical_subcategory_label"),
  normalized_name_key: text("normalized_name_key"),
});

export const catalogCategories = pgTable("catalog_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  canonical_id: text("canonical_id"),
});

export const catalogProductSpecs = pgTable("catalog_product_specs", {
  product_id: uuid("product_id").primaryKey(),
  specs: jsonb("specs").notNull(),
  source: text("source"),
  created_at: timestamp("created_at", { withTimezone: true }),
  updated_at: timestamp("updated_at", { withTimezone: true }),
});

export const catalogProductImages = pgTable("catalog_product_images", {
  id: uuid("id").primaryKey(),
  product_id: uuid("product_id").notNull(),
  image_url: text("image_url").notNull(),
  image_kind: text("image_kind"),
  variant_id: text("variant_id"),
  sort_order: integer("sort_order"),
  created_at: timestamp("created_at", { withTimezone: true }),
  updated_at: timestamp("updated_at", { withTimezone: true }),
});

export const catalogProductSlugAliases = pgTable("catalog_product_slug_aliases", {
  id: uuid("id").primaryKey(),
  alias_slug: text("alias_slug").notNull(),
  canonical_slug: text("canonical_slug").notNull(),
  reason: text("reason"),
  is_active: boolean("is_active"),
  created_at: timestamp("created_at", { withTimezone: true }),
  updated_at: timestamp("updated_at", { withTimezone: true }),
});

/** Products Supabase — parametric catalog consumed by Planner. */
export const configuratorProducts = pgTable("configurator_products", {
  id: uuid("id").primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  family: text("family"),
  brand_name: text("brand_name"),
  sizing_type: text("sizing_type")
    .$type<"parametric" | "discrete" | "fixed">()
    .notNull(),
  workstation: jsonb("workstation"),
  size_options: jsonb("size_options").notNull(),
  default_footprint: jsonb("default_footprint"),
  derived_rules: jsonb("derived_rules"),
  materials: text("materials").array().notNull(),
  thumbnail_url: text("thumbnail_url"),
  model_3d_url: text("model_3d_url"),
  description: text("description"),
  active: boolean("active").notNull(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const businessStatsCurrent = pgTable("business_stats_current", {
  id: uuid("id").primaryKey(),
  is_active: boolean("is_active").notNull(),
  projects_delivered: integer("projects_delivered").notNull(),
  client_organisations: integer("client_organisations").notNull(),
  sectors_served: integer("sectors_served").notNull(),
  locations_served: integer("locations_served").notNull(),
  years_experience: integer("years_experience").notNull(),
  as_of_date: date("as_of_date").notNull(),
  source_note: text("source_note"),
  updated_at: timestamp("updated_at", { withTimezone: true }),
  updated_by: text("updated_by"),
});

// ─── Products DB (SVG revisions + artifacts) ────────────────────────────

/** Immutable SVG revision published via the pipeline. */
export const svgRevisions = pgTable(
  "svg_revisions",
  {
    revisionId: text("revision_id").primaryKey(),
    schemaVersion: integer("schema_version").notNull(),
    definitionTypeId: text("definition_type_id").notNull(),
    definitionVersion: integer("definition_version").notNull(),
    compilerVersion: text("compiler_version"),
    sourceRevision: integer("source_revision"),
    artifactChecksums: jsonb("artifact_checksums"),
    validation: jsonb("validation"),
    actorId: text("actor_id").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    reason: text("reason"),
    slug: text("slug").notNull(),
    version: integer("version").notNull(),
    definition: jsonb("definition").notNull(),
    releasedProduct: jsonb("released_product"),
  },
  (table) => [
    index("svg_revisions_slug_idx").on(table.slug),
    uniqueIndex("svg_revisions_slug_version_idx").on(table.slug, table.version),
  ],
);

/** Artifact records (descriptor JSON + compiled SVG + generated PNG/thumbnail). */
export const svgRevisionArtifacts = pgTable(
  "svg_revision_artifacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    revisionId: text("revision_id")
      .notNull()
      .references(() => svgRevisions.revisionId, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    checksum: text("checksum").notNull(),
    storageKey: text("storage_key").notNull(),
    width: integer("width"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("svg_revision_artifacts_revision_id_idx").on(table.revisionId),
  ],
);

/** Live block descriptor (latest released descriptor per slug). */
export const blockDescriptors = pgTable(
  "block_descriptors",
  {
    slug: text("slug").primaryKey(),
    currentVersion: integer("current_version").notNull(),
    currentChecksum: text("current_checksum"),
    descriptor: jsonb("descriptor").notNull(),
    /** Buyer visibility under db authority (Phase 5 D5). */
    lifecycle: text("lifecycle")
      .$type<"live" | "draft" | "retired">()
      .notNull()
      .default("live"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by"),
  },
  (table) => [index("block_descriptors_lifecycle_idx").on(table.lifecycle)],
);

// V2 remains isolated from the V1 tables above until the reversible cutover.
export const svgAssetsV2 = pgTable(
  "svg_assets_v2",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").references(() => catalogProducts.id, { onDelete: "set null" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    assetKind: text("asset_kind").$type<"fixed" | "configurable" | "parametric">().notNull(),
    dimensionsMm: jsonb("dimensions_mm").notNull(),
    lifecycle: text("lifecycle").$type<"draft" | "review" | "live" | "retired">().notNull(),
    currentVersion: integer("current_version").notNull().default(0),
    currentVersionId: uuid("current_version_id"),
    currentSourceChecksum: text("current_source_checksum").notNull(),
    capabilities: text("capabilities").array().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("svg_assets_v2_slug_uidx").on(table.slug),
    index("svg_assets_v2_product_id_idx").on(table.productId),
    index("svg_assets_v2_lifecycle_idx").on(table.lifecycle),
    index("svg_assets_v2_current_version_id_idx").on(table.currentVersionId),
    check("svg_assets_v2_current_version_check", sql`${table.currentVersion} >= 0`),
  ],
);

export const svgAssetVersionsV2 = pgTable(
  "svg_asset_versions_v2",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id").notNull().references(() => svgAssetsV2.id, { onDelete: "restrict" }),
    version: integer("version").notNull(),
    manifest: jsonb("manifest").notNull(),
    sourceChecksum: text("source_checksum").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("svg_asset_versions_v2_asset_version_uidx").on(table.assetId, table.version),
    index("svg_asset_versions_v2_asset_id_idx").on(table.assetId),
    index("svg_asset_versions_v2_checksum_idx").on(table.sourceChecksum),
    check("svg_asset_versions_v2_version_check", sql`${table.version} > 0`),
  ],
);

export const svgAssetArtifactsV2 = pgTable(
  "svg_asset_artifacts_v2",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    versionId: uuid("version_id").notNull().references(() => svgAssetVersionsV2.id, { onDelete: "restrict" }),
    provider: text("provider").$type<"supabase" | "r2">().notNull(),
    bucket: text("bucket").notNull(),
    objectKey: text("object_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    checksum: text("checksum").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("svg_asset_artifacts_v2_object_uidx").on(table.provider, table.bucket, table.objectKey),
    index("svg_asset_artifacts_v2_version_id_idx").on(table.versionId),
    index("svg_asset_artifacts_v2_checksum_idx").on(table.checksum),
    check("svg_asset_artifacts_v2_size_check", sql`${table.sizeBytes} >= 0`),
  ],
);

export const svgAiRunsV2 = pgTable(
  "svg_ai_runs_v2",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id").notNull().references(() => svgAssetsV2.id, { onDelete: "restrict" }),
    baseVersionId: uuid("base_version_id").references(() => svgAssetVersionsV2.id, { onDelete: "set null" }),
    actorId: text("actor_id").notNull(),
    mode: text("mode").$type<"edit" | "audit">().notNull(),
    status: text("status").$type<"requested" | "completed" | "failed" | "applied" | "discarded">().notNull(),
    provider: text("provider"),
    model: text("model"),
    inputSnapshotKey: text("input_snapshot_key").notNull(),
    outputSnapshotKey: text("output_snapshot_key"),
    inputChecksum: text("input_checksum").notNull(),
    outputChecksum: text("output_checksum"),
    errorCode: text("error_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("svg_ai_runs_v2_asset_id_idx").on(table.assetId),
    index("svg_ai_runs_v2_status_idx").on(table.status),
    index("svg_ai_runs_v2_base_version_id_idx").on(table.baseVersionId),
  ],
);

/**
 * Products Supabase — admin-curated Planner workspace library.
 * Schema: migrations/20260628100000_create_planner_managed_products_and_feature_flags.sql
 * published_svg_revision_id: migrations/20260716100000_add_published_svg_revision_id.sql
 */
export const plannerManagedProducts = pgTable(
  "planner_managed_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyProductId: text("legacy_product_id"),
    slug: text("slug").notNull(),
    plannerSourceSlug: text("planner_source_slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    category: text("category").notNull(),
    categoryId: text("category_id").notNull(),
    categoryName: text("category_name").notNull(),
    seriesId: text("series_id").notNull(),
    seriesName: text("series_name").notNull(),
    price: integer("price").notNull().default(0),
    flagshipImage: text("flagship_image").notNull().default(""),
    images: text("images").array().notNull().default([]),
    specs: jsonb("specs").notNull().default({}),
    metadata: jsonb("metadata").notNull().default({}),
    active: boolean("active").notNull().default(true),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    /** DB-SVG-05: pointer to the current published SVG revision for this product. */
    publishedSvgRevisionId: text("published_svg_revision_id"),
  },
  (table) => [
    uniqueIndex("planner_managed_products_slug_uidx").on(table.slug),
    index("planner_managed_products_active_idx").on(table.active),
    index("planner_managed_products_category_idx").on(table.category),
    index("planner_managed_products_updated_at_idx").on(table.updatedAt),
    index("planner_managed_products_planner_source_slug_idx").on(table.plannerSourceSlug),
  ],
);
