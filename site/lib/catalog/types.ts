// ---------------------------------------------------------------------------
// Parametric catalog model (Plan D / D1)
// ---------------------------------------------------------------------------
// Dimensions are NUMERIC, not free text. Every placeable product resolves to a
// numeric footprint so the 2D canvas can draw it to scale and the BOQ can list
// it. No pricing in v1 — geometry only.

/** A numeric dimension in millimetres. Height is optional (top-down 2D ignores it). */
export interface Dim {
  L: number; // length / width along the primary axis (mm)
  D: number; // depth (mm)
  H?: number; // height (mm) — optional, used by 3D only
}

/** One concrete, orderable size of a `discrete` product (storage, some tables). */
export interface SizeOption {
  sku: string;
  label: string; // e.g. "3-Drawer Pedestal"
  dim: Dim;
}

/**
 * Parametric spec for workstations. The product is NOT a flat SKU list — it is
 * an option matrix the configurator/BOQ expands on demand.
 *
 * - Straight (Linear / Linear-Partition): length 1200/1350/1500 × depth 600/750,
 *   height 750 always. Seaters NS 1–5 / SH 2–10.
 *   Footprint = seaters × length; NS depth 600 mm, SH depth 1200 mm (face-to-face).
 * - L-Shape (L-Shape / Neo-L panel): two arms L1, L2 each ∈ 1200/1350/1500, any
 *   combination; depth 600/750; height 750. Seaters NS 1–4 / SH 2–8. Footprint =
 *   L1 × L2 bounding box, L-shaped.
 */
export interface WorkstationSpec {
  shape: "straight" | "l-shape";
  system: "leg" | "partition"; // leg = Linear/L-Shape; partition = "Panel" family
  wireManagement: string[]; // admin-editable list (125/250/400 raceway, flipdown, partition…)
  sharing: "non-sharing" | "sharing";
  seaterOptions: number[]; // straight NS1-5/SH2-10; L NS1-4/SH2-8
  lengthOptions: number[]; // [1200, 1350, 1500]
  depthOptions: number[]; // [600, 750] worktop depth
  heightMm: 750; // always 750 for worksurfaces
  armOptions?: number[]; // L-shape only: L2 ∈ [1200,1350,1500], any combo with L1
}

/**
 * Editable derived-part rules (data, not code). Screen length = topLength − offset
 * (intermediate −75, main −150); modesty follows topLength. Offsets are admin fields.
 */
export interface DerivedRules {
  screenOffsetIntermediate: number; // mm subtracted from top length for intermediate screens
  screenOffsetMain: number; // mm subtracted from top length for main/end screens
}

/** Discriminates how a product is sized — drives which optional field is populated. */
export type SizingType = "parametric" | "discrete" | "fixed";

export interface ProductVariant {
  id: string;
  variantName: string;
  galleryImages: string[];
  threeDModelUrl?: string;
}

export interface ProductDetailedInfo {
  overview: string;
  features: string[];
  dimensions: string;
  materials: string[];
}

export interface ProductMetadata {
  source?: string;
  sourceSlug?: string;
  category?: string;
  subcategory?: string;
  categoryIdCanonical?: string;
  subcategoryId?: string;
  subcategoryLabel?: string;
  canonicalSlugV2?: string;
  canonicalSeriesId?: string;
  bifmaCertified?: boolean;
  warrantyYears?: number;
  sustainabilityScore?: number;
  tags?: string[];
  priceRange?: "budget" | "mid" | "premium" | "luxury";
  useCase?: string[];
  material?: string[];
  colorOptions?: string[];
  hasHeadrest?: boolean;
  isHeightAdjustable?: boolean;
  isStackable?: boolean;
  isNestable?: boolean;
  isBifoldable?: boolean;
  seriesId?: string;
  ai_alt_text?: string;
  aiAltText?: string;
}

export interface Product {
  id: string;
  category_id: string;
  series: string;
  name: string;
  slug: string;
  description?: string;
  images: string[];
  flagship_image?: string;
  map_layout?: string;
  features?: string[];
  finishes?: string[];
  "3d_model"?: string;
  metadata?: ProductMetadata;
  specs: {
    dimensions: string;
    materials: string[];
    features: string[];
    sustainability_score?: number;
  };
  series_id: string;
  series_name: string;
  created_at: string;
  alt_text?: string;

  // --- Parametric catalog (Plan D / D1) — all optional during migration ---
  // `specs.dimensions` above stays as a human-readable display label; the fields
  // below carry the structured geometry the canvas + BOQ actually compute from.
  sizingType?: SizingType;
  workstation?: WorkstationSpec; // when sizingType === "parametric"
  sizeOptions?: SizeOption[]; // when sizingType === "discrete"
  defaultFootprint?: Dim; // when sizingType === "fixed"
  derivedRules?: DerivedRules; // editable screen/modesty offsets
  brandName?: string; // oando brand name e.g. "DeskPro" (on top of generic family)
  family?: string; // catalog family e.g. "Linear", "L-Shape", "Panel"
  thumbnailUrl?: string; // generic placeholder now; real render later (admin-editable)
  model3dUrl?: string; // none for now; optional future (admin-editable)
}

export interface CompatProduct {
  id: string;
  slug?: string;
  name: string;
  description: string;
  flagshipImage: string;
  sceneImages: string[];
  variants: ProductVariant[];
  detailedInfo: ProductDetailedInfo;
  metadata: ProductMetadata;
  "3d_model"?: string;
  threeDModelUrl?: string;
  technicalDrawings?: string[];
  documents?: string[];
  images?: string[];
  altText?: string;
  specs?: Record<string, unknown>;
}

export interface CompatSeries {
  id: string;
  name: string;
  description: string;
  products: CompatProduct[];
}

export interface CompatCategory {
  id: string;
  name: string;
  description: string;
  series: CompatSeries[];
}

export interface CategoryRow {
  id: string;
  name: string;
}
