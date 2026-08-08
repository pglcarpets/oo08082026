/**
 * Phase 03 Catalog Domain Model
 *
 * Research-backed types derived from Wayfair taxonomy-decoupled architecture,
 * IKEA three-layer knowledge graph, and furniture taxonomy best practices
 * (LynkPIM, WISEPIM). Implements type-based primary hierarchy with room/style/material
 * as filterable attributes, two-field material approach, and immutable placed-configuration
 * snapshot for BOQ/quote/export/AI traceability.
 */

// ── Display units (mirrors model/types.ts for catalog isolation) ──

export type PlannerCatalogDisplayUnit = "mm" | "cm" | "m" | "in" | "ft-in";

// ── Canonical taxonomy types ──

/**
 * Primary type-based category (e.g. "Sofas", "Tables", "Chairs").
 * This is the canonical organization axis, not room-based.
 */
export type PlannerCatalogCategory =
  | "Furniture"
  | "Lighting"
  | "Decor"
  | "Outdoor"
  | "Bedding & Textiles"
  | "Storage & Organisation"
  | "Kitchen & Dining"
  | "Symbols";

export type PlannerCatalogSubCategory = string;

/**
 * Full taxonomy path: Category > SubCategory > LeafCategory
 * Example: "Furniture > Sofas & Sectionals > 3-Seater Sofas"
 */
export type PlannerCatalogTaxonomyPath = string;

/**
 * Room as multi-value filterable attribute (not top-level category).
 * Matches Wayfair/IKEA best practice: type-based primary hierarchy.
 */
export type PlannerRoomTag =
  | "Living Room"
  | "Bedroom"
  | "Kitchen"
  | "Bathroom"
  | "Office"
  | "Dining"
  | "Outdoor"
  | "Garage"
  | "Utility"
  | "Kids & Nursery"
  | "Entryway & Hallway";

/**
 * Style as multi-select filterable attribute.
 * A product can carry multiple style tags (e.g., Coastal + Boho).
 */
export type PlannerStyleTag =
  | "Modern"
  | "Scandinavian"
  | "Industrial"
  | "Traditional"
  | "Coastal"
  | "Boho"
  | "Mid-Century"
  | "Minimalist"
  | "Contemporary"
  | "Rustic";

/**
 * Two-field material: marketing name for display, normalized value for filtering.
 * Example: marketingMaterial="Smoked Oak", normalizedMaterial="Oak"
 */
export interface PlannerCatalogMaterial {
  /** Customer-facing marketing name (e.g. "Smoked Oak", "Warm Walnut Veneer") */
  marketingMaterial: string;
  /** Normalized value for filtering and feed submission (e.g. "Oak", "Walnut") */
  normalizedMaterial: string;
}

/**
 * Structured color with hex, name, and normalized family.
 */
export interface PlannerCatalogColor {
  hex: string;
  name: string;
  /** Normalized color family for filtering (e.g. "Blue", "Neutral", "Red") */
  normalizedFamily: string;
}

export type PlannerAssemblyType = "flat-pack" | "partial" | "fully-assembled";

export type PlannerAvailabilityStatus = "in-stock" | "out-of-stock" | "discontinued" | "preorder" | "backorder";
export type PlannerConfigurability = "fixed" | "configurable";
export type PlannerMountingContract = "floor" | "wall" | "ceiling" | "floating";
export type PlannerAssetReadiness = "ready" | "missing-image" | "missing-mesh" | "missing-svg" | "degraded";

// ── Catalog item dimension metadata ──

/**
 * Canonical dimensions stored in millimetres.
 * The legacy OOFPLWeb catalog stores dimensions as cm in fields named `widthMm`/`heightMm`
 * (naming debt documented here). Converters in unitConversion.ts handle the mapping.
 */
export interface PlannerCatalogDimensions {
  /** Width in canonical millimetres */
  widthMm: number;
  /** Depth in canonical millimetres */
  depthMm: number;
  /** Height in canonical millimetres */
  heightMm: number;
  /** Seat height in millimetres (for chairs/sofas) */
  seatHeightMm?: number;
  /** Weight in kilograms */
  weightKg?: number;
}

// ── Variant identity ──

/**
 * A specific variant of a catalog product (e.g., different color, size, material).
 * Master variant + variant array pattern from ThreeKit/commercetools/Fabric.
 */
export interface PlannerCatalogVariant {
  /** Unique variant identifier */
  variantId: string;
  /** Stock-keeping unit for this variant */
  sku: string;
  /** Reference to parent catalog item */
  parentProductId: string;
  /** Human-readable variant label (e.g. "Oak / 180cm / 3-Seater") */
  label: string;
  /** Variant attributes that differentiate this from the master */
  variantAttributes: {
    color?: PlannerCatalogColor;
    size?: string;
    material?: PlannerCatalogMaterial;
    finish?: string;
  };
  /** Variant-specific dimensions if different from master */
  dimensions: PlannerCatalogDimensions;
  /** Variant-specific pricing */
  pricing?: PlannerCatalogPricing;
  /** Variant-specific preview image */
  imageUrl?: string;
  /** Variant-specific 3D mesh URL */
  meshUrl?: string;
  /** Availability for this specific variant */
  availability: PlannerAvailabilityStatus;
}

// ── Pricing metadata ──

export interface PlannerCatalogPricing {
  /** Price in smallest currency unit (e.g., cents, paise) */
  price: number;
  currencyCode: string;
  originalPrice?: number;
  /** Optional quote/BOQ metadata */
  quoteMetadata?: Record<string, string>;
}

// ── Asset URLs ──

export interface PlannerCatalogAssets {
  /** Preview/thumbnail image URL (validated against origin allowlist) */
  previewImageUrl?: string;
  /**
   * Explicit PNG plan-symbol URL (`planSymbolPngUrl` descriptor field).
   * Prefer over SVG preview when present (Phase 2 consumer shim).
   */
  planSymbolPngUrl?: string;
  /** Full-resolution or lifestyle image URLs */
  imageUrls: string[];
  /** 3D mesh/GLB URL for rendering */
  meshUrl?: string;
  /** App-specific AR format URL (USDZ for iOS) */
  arUrl?: string;
}

// ── Provenance metadata ──

export interface PlannerCatalogProvenance {
  /** Source catalog system (e.g. "planner_managed_products", "configurator_products") */
  source: string;
  /** OOFPLWeb legacy product ID if mapped from existing catalog */
  legacyProductId?: string;
  /** Planner source slug for cross-reference */
  plannerSourceSlug?: string;
  /** Category ID from source system */
  sourceCategoryId?: string;
  /** Series ID from source system */
  sourceSeriesId?: string;
  /** Original import timestamp */
  importedAt?: string;
  /** License classification for 3D assets */
  assetLicense?: string;
  /** Attribution required for runtime assets */
  assetAttribution?: string;
}

// ── Core catalog item ──

/**
 * Canonical catalog item definition.
 * This is the concept layer (IKEA three-layer model): product identity, taxonomy, metadata.
 * Individual variants carry variant-specific data.
 */
export interface PlannerCatalogItem {
  /** Unique catalog identifier (source system ID preserved) */
  id: string;
  /** Human-readable slug for URLs */
  slug: string;
  /** Stock-keeping unit (master SKU) */
  sku: string;
  /** Display name */
  name: string;
  /** Short display name (≤ 30 chars, for compact UI) */
  shortName: string;
  /** Description / marketing copy */
  description: string;
  /** Primary type-based category (canonical hierarchy axis) */
  category: PlannerCatalogCategory;
  /** Taxonomy subcategory */
  subCategory: PlannerCatalogSubCategory;
  /**
   * Product family label for inventory grouping/filter/compare (PF-22).
   * When omitted, UI derives family from subCategory / taxonomy path.
   */
  family?: string;
  /** Full taxonomy path string */
  taxonomyPath: PlannerCatalogTaxonomyPath;
  /** Canonical dimensions in millimetres */
  dimensions: PlannerCatalogDimensions;
  /** Display unit preference */
  displayUnit: PlannerCatalogDisplayUnit;
  /** Asset URLs */
  assets: PlannerCatalogAssets;
  /** Material (two-field: marketing + normalized) */
  material: PlannerCatalogMaterial;
  /** Room tags (multi-value filterable attribute) */
  roomTags: PlannerRoomTag[];
  /** Style tags (multi-select filterable attribute) */
  styleTags: PlannerStyleTag[];
  /** Structured color info */
  color?: PlannerCatalogColor;
  /** Pricing metadata */
  pricing?: PlannerCatalogPricing;
  /** Availability status */
  availability: PlannerAvailabilityStatus;
  /** Assembly type */
  assemblyType: PlannerAssemblyType;
  /** Whether dimensions are manufacturer-fixed or user-configurable within bounds */
  configurability?: PlannerConfigurability;
  /** Placement anchoring contracts supported by this item */
  mounting?: PlannerMountingContract[];
  /** Asset readiness for degraded-state search and UI indicators */
  assetReadiness?: PlannerAssetReadiness[];
  /** Whether product is flat-pack (redundant with assemblyType but explicit for filtering) */
  flatPack: boolean;
  /** Search/discovery tags */
  tags: string[];
  /** Number of seats (for chairs, sofas) */
  seatCount?: number;
  /** Maximum weight capacity in kg */
  weightCapacityKg?: number;
  /** Available variants (master variant at index 0 per convention) */
  variants: PlannerCatalogVariant[];
  /** Source provenance for identity traceability */
  provenance: PlannerCatalogProvenance;
  /** Whether this is a 2D-only architectural symbol (like electrical/plumbing symbols) */
  symbolOnly: boolean;
  /**
   * Optional geometry generation mode for placement → 3D.
   * When omitted, placement may still detect modular via id/slug `cabinet-v0`.
   */
  geometryMode?: "box" | "modular-cabinet-v0" | "workstation-v0";

  // Sketchfab search parity facets (added for catalogue-first; BP-06 / design §9-10 / REC-02/04 / PLAN-FAIL-0419)
  // license, animated, staffPicked, favourite, downloadable per search_models contract.
  license?: string;
  animated?: boolean;
  staffPicked?: boolean;
  favourite?: boolean;
  downloadable?: boolean;
}

// ── Immutable placed-configuration snapshot ──

/**
 * Immutable snapshot of a placed catalog item.
 * Captures the exact product identity, variant identity, and configuration
 * at placement time. Used for undo/AI/export/BOQ traceability.
 * Must not be mutated after creation; edits produce a new snapshot.
 */
export interface PlannerPlacedConfiguration {
  /** Unique placement identifier (deterministic, timestamp + random suffix) */
  placementId: string;
  /** ISO 8601 timestamp of placement */
  placedAt: string;
  /** Source catalog item identity */
  productIdentity: {
    catalogId: string;
    slug: string;
    sku: string;
    name: string;
  };
  /** Source variant identity (null if master variant placed) */
  variantIdentity: {
    variantId: string;
    sku: string;
    label: string;
  } | null;
  /** Overridden dimensions at placement time (if user resized) */
  overriddenDimensions?: Partial<PlannerCatalogDimensions>;
  /** Position in floor-plan coordinates */
  position: { x: number; y: number };
  /** Rotation in degrees */
  rotation: number;
  /** Scale factors (x, y, z) */
  scale: { x: number; y: number; z: number };
  /** Material override (if different from catalog default) */
  materialOverride?: string;
  /** Color override (if different from catalog default) */
  colorOverride?: string;
  /** Locked state (prevent accidental moves) */
  locked: boolean;
  /** Source provenance for full traceability */
  sourceMetadata: {
    catalogSource: string;
    catalogSourceId: string;
    legacyProductId?: string;
    plannerSourceSlug?: string;
    placedFrom: "click" | "drag" | "api" | "import";
  };
}

// ── Catalog index for client-side search ──

/**
 * Client-side search index for O(1) lookups and full-text search.
 * Built from normalized catalog data on load.
 */
export interface PlannerCatalogIndex {
  /** O(1) lookup by canonical ID */
  byId: Map<string, PlannerCatalogItem>;
  /** O(1) lookup by slug */
  bySlug: Map<string, PlannerCatalogItem>;
  /** O(1) lookup by SKU */
  bySku: Map<string, PlannerCatalogItem>;
  /** Indexed by category for filtered views */
  byCategory: Map<PlannerCatalogCategory, PlannerCatalogItem[]>;
  /** Indexed by tag for filtered views */
  byTag: Map<string, PlannerCatalogItem[]>;
  /** Indexed by room tag for filtered views */
  byRoom: Map<PlannerRoomTag, PlannerCatalogItem[]>;
  /** Indexed by style tag for filtered views */
  byStyle: Map<PlannerStyleTag, PlannerCatalogItem[]>;
  /** Full-text search index: token → item IDs */
  textIndex: Map<string, Set<string>>;
  /** All items in insertion order */
  all: PlannerCatalogItem[];
  /** Index build timestamp */
  builtAt: number;
}

// ── Search types ──

export type PlannerCatalogSortOrder = "relevance" | "name-asc" | "name-desc" | "price-asc" | "price-desc" | "newest";
export type PlannerCatalogSortField = "relevance" | "name" | "price" | "newest";
export type PlannerCatalogSortDirection = "asc" | "desc";

export interface PlannerCatalogDimensionFilter {
  minWidthMm?: number;
  maxWidthMm?: number;
  minDepthMm?: number;
  maxDepthMm?: number;
  minHeightMm?: number;
  maxHeightMm?: number;
}

export interface PlannerCatalogSearchQuery {
  /** Free-text search query */
  text?: string;
  /** Category filter */
  categoryFilter?: PlannerCatalogCategory;
  /** Room tag filter (items matching any of the given rooms) */
  roomFilter?: PlannerRoomTag[];
  /** Style tag filter (items matching any of the given styles) */
  styleFilter?: PlannerStyleTag[];
  /** Normalized material filter */
  materialFilter?: string[];
  /** Normalized color family filter */
  colorFilter?: string[];
  /** Dimension range filter */
  dimensionFilter?: PlannerCatalogDimensionFilter;
  /** Availability filter */
  availabilityFilter?: PlannerAvailabilityStatus[];
  /** Configurability filter from Phase 03A benchmark */
  configurabilityFilter?: PlannerConfigurability[];
  /** Mounting/anchoring filter from Phase 03A benchmark */
  mountingFilter?: PlannerMountingContract[];
  /** Asset readiness filter for degraded-state recovery */
  assetReadinessFilter?: PlannerAssetReadiness[];
  /** Sort order */
  sortOrder?: PlannerCatalogSortOrder;
  /** Deterministic sort field; preferred over legacy sortOrder when set */
  sortField?: PlannerCatalogSortField;
  /** Deterministic sort direction; used with sortField */
  sortDirection?: PlannerCatalogSortDirection;
  /** Cursor for pagination (opaque string from previous result) */
  cursor?: string;
  /** Page size (default 20 for search, 50 for browse) */
  pageSize?: number;

  // Sketchfab parity facets (BP-06 / design §9-10 / REC-02/04; search_models cursor + facets)
  // Catalogue-first (REC-04): these + cursor used in inventory via loader primary descriptors.
  licenseFilter?: string[];
  animatedFilter?: boolean;
  staffPicked?: boolean;
  favourite?: boolean;
  downloadable?: boolean;
}

export interface PlannerCatalogSearchResult {
  /** Matching items for the current page */
  items: PlannerCatalogItem[];
  /** Total matching items (across all pages) */
  totalCount: number;
  /** Opaque cursor for next page (null if no more results) */
  nextCursor: string | null;
  /** Whether more pages exist */
  hasMore: boolean;
  /** Server-side search duration in ms (for performance monitoring) */
  tookMs: number;
}

// ── Fallback geometry ──

export type PlannerFallbackGeometryType = "box" | "cylinder" | "plane";

/**
 * Visible fallback geometry used when an asset URL is missing, expired, or invalid.
 * Always a colored procedural shape with accessible name and visible border.
 */
export interface PlannerFallbackGeometry {
  /** Geometry type for fallback rendering */
  type: PlannerFallbackGeometryType;
  /** Fill color (hex) */
  color: string;
  /** Border color (hex) for visibility */
  borderColor: string;
  /** Material label for accessibility */
  material: string;
  /** Accessible name (e.g. "Missing asset: Office Chair (placeholder)") */
  accessibleName: string;
  /** Approximate dimensions matched to catalog item */
  dimensions: PlannerCatalogDimensions;
  /** Reason for fallback (for debugging/error reporting) */
  reason: string;
}

// ── Recent items and favorites ──

export interface PlannerRecentItemEntry {
  /** SKU of the catalog item */
  sku: string;
  /** Catalog item ID for lookup */
  catalogId: string;
  /** Human-readable name for display */
  name: string;
  /** ISO 8601 timestamp of last use */
  lastUsedAt: string;
}

export interface PlannerFavoriteEntry {
  /** Catalog item ID */
  catalogId: string;
  /** SKU */
  sku: string;
  /** Human-readable name for display */
  name: string;
  /** Category for filtered views */
  category: PlannerCatalogCategory;
  /** ISO 8601 timestamp when favorited */
  favoritedAt: string;
}

export interface PlannerRecentItemsData {
  /** Schema version for migration support */
  schemaVersion: number;
  /** Recent items in reverse-chronological order */
  items: PlannerRecentItemEntry[];
}

export interface PlannerFavoritesData {
  /** Schema version for migration support */
  schemaVersion: number;
  /** Favorite items */
  items: PlannerFavoriteEntry[];
}
