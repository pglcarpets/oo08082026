/**
 * Phase 03A SVG Types
 *
 * Typed SVG symbol contract with canonical mm dimensions, stable viewBox,
 * theme separation, and geometry type definitions for every inventory shape.
 */

import type { PlannerCatalogDimensions, PlannerCatalogCategory } from "../catalogTypes";
import { z } from "zod";
import { PlanSymbolPngPointerFieldsSchema } from "../planSymbolPngContract";
import { sha256Hex } from "./sha256";

// ── SVG symbol geometry ──

/** Primitive shapes used to compose SVG symbols */
export type SvgShapeType =
  | "rect"
  | "circle"
  | "ellipse"
  | "line"
  | "path";

export interface SvgShapeCommand {
  shape: SvgShapeType;
  /** Attributes specific to this shape (x, y, width, height, r, cx, cy, d, etc.) */
  attrs: Record<string, string | number>;
}

/** A composed symbol built from multiple primitives */
export interface SvgSymbolDefinition {
  /** Contract version for deterministic cache/export compatibility */
  version: "03a-symbol-v1";
  /** Unique symbol ID (stable across versions) */
  symbolId: string;
  /** Catalog category this symbol represents */
  category: PlannerCatalogCategory;
  /** Display name for accessibility */
  name: string;
  /** Canonical dimensions in mm (for viewBox calculation) */
  dimensions: PlannerCatalogDimensions;
  /** Composed shape commands */
  shapes: SvgShapeCommand[];
  /** Optional label/text overlay */
  label?: string;
}

export interface SvgSymbolDimensionAgreement {
  viewBox: string;
  preview: { widthMm: number; depthMm: number };
  canvas: { widthMm: number; depthMm: number };
  export: { widthMm: number; depthMm: number };
  agrees: boolean;
}

// ── SVG theme contract ──

export interface SvgThemeColors {
  mode: "css-vars" | "literal";
  color: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  textFill: string;
  opacity: number;
}

export type SvgThemeName = "light" | "dark" | "print" | "selected" | "high-contrast" | "fallback";

/** Theme-aware color palette for all supported themes */
export const SVG_THEMES: Record<SvgThemeName, SvgThemeColors> = {
  light: {
    mode: "css-vars",
    color: "var(--svg-theme-light-color, var(--color-text, var(--text-strong)))",
    fill: "var(--svg-theme-light-fill, var(--color-surface-raised, var(--surface-panel)))",
    stroke: "currentColor",
    strokeWidth: 1.5,
    textFill: "currentColor",
    opacity: 1,
  },
  dark: {
    mode: "css-vars",
    color: "var(--svg-theme-dark-color, var(--text-inverse-body, var(--color-text, var(--text-strong))))",
    fill: "var(--svg-theme-dark-fill, var(--surface-canvas-panel, var(--surface-panel)))",
    stroke: "currentColor",
    strokeWidth: 1.5,
    textFill: "currentColor",
    opacity: 1,
  },
  print: {
    mode: "css-vars",
    color: "var(--svg-theme-print-color, currentColor)",
    fill: "var(--svg-theme-print-fill, var(--color-paper, var(--surface-page)))",
    stroke: "currentColor",
    strokeWidth: 1,
    textFill: "currentColor",
    opacity: 1,
  },
  selected: {
    mode: "css-vars",
    color: "var(--svg-theme-selected-color, var(--color-blueprint-strong, var(--color-primary-hover)))",
    fill: "var(--svg-theme-selected-fill, var(--color-blueprint-soft, var(--surface-accent-wash)))",
    stroke: "currentColor",
    strokeWidth: 2,
    textFill: "currentColor",
    opacity: 1,
  },
  "high-contrast": {
    mode: "css-vars",
    color: "var(--svg-theme-high-contrast-color, var(--surface-inverse, var(--color-text, var(--text-strong))))",
    fill: "var(--svg-theme-high-contrast-fill, var(--color-surface, var(--surface-page)))",
    stroke: "currentColor",
    strokeWidth: 2,
    textFill: "currentColor",
    opacity: 1,
  },
  fallback: {
    mode: "css-vars",
    color: "var(--svg-theme-fallback-color, var(--color-danger, var(--color-primary)))",
    fill: "var(--svg-theme-fallback-fill, var(--color-warning-soft, var(--surface-status-bad)))",
    stroke: "currentColor",
    strokeWidth: 2,
    textFill: "currentColor",
    opacity: 0.7,
  },
};

// ── SVG render output ──

export interface SvgRenderOutput {
  /** Complete SVG markup string */
  svg: string;
  /** Stable viewBox based on canonical dimensions */
  viewBox: string;
  /** Symbol width in mm */
  widthMm: number;
  /** Symbol height in mm */
  heightMm: number;
  /** Theme used for this render */
  theme: SvgThemeName;
  /** Deterministic generation marker for cache/debugging */
  generatedAt: number;
  /** Content hash for cache key (deterministic) */
  contentHash: string;
}

// ── Category-specific shape palettes ──

/** Shape colors by category for deterministic SVG rendering */
export const CATEGORY_SHAPE_COLORS: Record<string, { fill: string; stroke: string }> = {
  Furniture: {
    fill: "var(--svg-category-furniture-fill, var(--color-block-desk, var(--color-primary)))",
    stroke: "var(--svg-category-furniture-stroke, var(--color-text, var(--text-strong)))",
  },
  Lighting: {
    fill: "var(--svg-category-lighting-fill, var(--color-accent-soft, var(--surface-accent-wash)))",
    stroke: "var(--svg-category-lighting-stroke, var(--color-accent, var(--color-primary)))",
  },
  Decor: {
    fill: "var(--svg-category-decor-fill, var(--surface-panel-soft, var(--surface-soft)))",
    stroke: "var(--svg-category-decor-stroke, var(--color-text-muted, var(--text-muted)))",
  },
  Outdoor: {
    fill: "var(--svg-category-outdoor-fill, var(--color-success-soft, var(--surface-status-ok)))",
    stroke: "var(--svg-category-outdoor-stroke, var(--color-success, var(--color-primary)))",
  },
  "Bedding & Textiles": {
    fill: "var(--svg-category-bedding-fill, var(--surface-soft, var(--surface-panel-soft)))",
    stroke: "var(--svg-category-bedding-stroke, var(--color-text-subtle, var(--text-subtle)))",
  },
  "Storage & Organisation": {
    fill: "var(--svg-category-storage-fill, var(--color-surface-raised, var(--surface-panel)))",
    stroke: "var(--svg-category-storage-stroke, var(--color-border-strong, var(--border-muted)))",
  },
  "Kitchen & Dining": {
    fill: "var(--svg-category-kitchen-fill, var(--color-warning-soft, var(--surface-status-bad)))",
    stroke: "var(--svg-category-kitchen-stroke, var(--color-warning, var(--color-accent)))",
  },
  Symbols: {
    fill: "var(--svg-category-symbols-fill, var(--color-surface-sunken, var(--surface-muted)))",
    stroke: "var(--svg-category-symbols-stroke, var(--color-text, var(--text-strong)))",
  },
};

// ============================================================================
// Phase 02 — BlockDescriptor Zod Schema (single source of truth)
// ============================================================================
//
// Authority: Phase 02 plan §02-CAT-01 .. §02-CAT-11 and §02-ERR-01 .. §02-ERR-06.
// The schema below satisfies:
//   - §02-CAT-02 discriminated union (fixed | configurable | parametric)
//   - §02-CAT-03 geometry contract: widthMm/depthMm/heightMm/seatHeightMm?/weightKg?
//   - §02-CAT-04 identity: id (uuid v4), slug (kebab regex), sku?, parentProductId?, sourceProvenance
//   - §02-CAT-05 mounting: floor | wall | ceiling | floating + mountingPoints for parametric
//   - §02-CAT-06 roving-focus arrays + live-announcement category enum
//   - §02-CAT-07 cartography: themeTokens values must reference semantic CSS vars / currentColor
//   - §02-CAT-08 generatedAt frozen on first parse (see Decision log 2026-07-04 addendum)
//   - §02-CAT-09 SHA-256 checksum immutability (recompute on canonicalize; mismatch ⇒ .hashMismatch)
//   - §02-CAT-10 viewBox-stable: schema requires positive finite viewBox width/height
//   - §02-CAT-11 parseFresh stamps generatedAt at first write, parseExisting refuses post-write mutation
//
// No parallel Zod schemas exist at admin, portal, or planner routes. The
// schema is re-exported by `./svgBlockDescriptorLoader.ts` (Phase 06 consumer)
// and may be imported by any reader; downstream consumers must NOT redefine
// the schema, the discriminated union, or the `PlannerDescriptorError` taxonomy.

/** Pinned schema version. Increment only via a coordinated migration. */
export const BLOCK_DESCRIPTOR_SCHEMA_VERSION = "2026-07-04.v2" as const;

/** Marker exported for documentation/tests; matches §02-CAT-08 freeze rule. */
export const BLOCK_DESCRIPTOR_GENERATED_AT_FROZEN_ON_FIRST_PARSE = true as const;

/** RFC 4122 UUID v4 (string form, lowercase or uppercase). */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Slug regex: kebab, ascii lowercase start, then [a-z0-9-], total 2..64 chars. */
export const BLOCK_DESCRIPTOR_SLUG_REGEX = /^[a-z][a-z0-9-]{1,63}$/;

/** SHA-256 hex digest (64 lowercase hex chars). */
const SHA256_HEX_REGEX = /^[0-9a-f]{64}$/;

/** Theme token reference: `currentColor` literal or semantic CSS variable. */
const THEME_TOKEN_REF_REGEX = /^(currentColor$|--[a-z0-9-]+$)/i;

/** Any #hex literal blocklist regex (3, 4, 6, or 8 hex digits). */
const HEX_LITERAL_REGEX = /#[0-9a-fA-F]{3,8}\b/;

// ── Sub-schemas ─────────────────────────────────────────────────────────────

export const MountPlaneSchema = z.enum(["floor", "wall", "ceiling", "floating"]);
/** Placement plane per benchmark binding #12 (Phase 02 §02-CAT-05). */
export type MountPlane = z.infer<typeof MountPlaneSchema>;

export const BlockDescriptorVec2Schema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});
/** 2-D vector in mm. */
export type BlockDescriptorVec2 = z.infer<typeof BlockDescriptorVec2Schema>;

export const BlockDescriptorViewBoxSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().positive(),
  height: z.number().finite().positive(),
});
/** Stable viewBox bound (Phase 02 §02-CAT-03). */
export type BlockDescriptorViewBox = z.infer<typeof BlockDescriptorViewBoxSchema>;

export const MountingPointSchema = z.object({
  plane: MountPlaneSchema,
  offset: BlockDescriptorVec2Schema,
});
/** Parametric mounting control point. */
export type MountingPoint = z.infer<typeof MountingPointSchema>;

/**
 * Optional explicit blocks array on BlockDescriptor (handoff 02→06, PLAN-FAIL-0413).
 * Provides per-block rects for resolver + Phase 03 polygon ops (instead of single synthesised).
 * Cites Global Standard benchmark BP-02 (schema source-of-truth) + design §2, §8 (resolver contract).
 */
export const BlockDescriptorBlockSchema = z.object({
  id: z.string().optional(),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().positive(),
  depth: z.number().finite().positive(),
  height: z.number().finite().positive().optional(),
  mounting: MountingPointSchema.optional(),
});
/** Single block rect in a descriptor's explicit blocks list (mm coords relative to viewBox). */
export type BlockDescriptorBlock = z.infer<typeof BlockDescriptorBlockSchema>;

/**
 * A freeform imported/drawn path part (custom furniture). Carries an SVG `d`
 * in viewBox plan space so an arbitrary outline survives persist and reaches the
 * compile pipeline (rect `blocks` cannot represent it). See
 * `normalizeDescriptorForPipeline` pathParts.
 */
export const BlockDescriptorImportedPathSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]{1,63}$/).optional(),
  d: z.string().trim().min(1).max(20_000),
});
export type BlockDescriptorImportedPath = z.infer<typeof BlockDescriptorImportedPathSchema>;

export const BlockDescriptorGeometrySchema = z.object({
  widthMm: z.number().finite().positive(),
  depthMm: z.number().finite().positive(),
  heightMm: z.number().finite().positive(),
  seatHeightMm: z.number().finite().positive().optional(),
  weightKg: z.number().finite().positive().optional(),
});
/** Geometry contract (Phase 02 §02-CAT-03). */
export type BlockDescriptorGeometry = z.infer<typeof BlockDescriptorGeometrySchema>;

/** Identity block (Phase 02 §02-CAT-04). */
export const BlockDescriptorIdentitySchema = z.object({
  id: z.string().regex(UUID_V4_REGEX, "id must be a UUID v4 string"),
  slug: z
    .string()
    .regex(BLOCK_DESCRIPTOR_SLUG_REGEX, "slug must match ^[a-z][a-z0-9-]{1,63}$"),
  sku: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .optional(),
  parentProductId: z.string().regex(UUID_V4_REGEX).optional(),
  sourceProvenance: z.enum(["donor", "native", "migrated"]),
  createdBy: z.string().trim().min(1).max(120).optional(),
});
export type BlockDescriptorIdentity = z.infer<typeof BlockDescriptorIdentitySchema>;

export const BlockDescriptorLiveAnnouncementCategorySchema = z.enum([
  "status",
  "error",
  "success",
  "polish",
]);
/** Live-region announcement category (Phase 02 §02-CAT-06). */
export type BlockDescriptorLiveAnnouncementCategory = z.infer<
  typeof BlockDescriptorLiveAnnouncementCategorySchema
>;

const BlockDescriptorRovingFocusEntrySchema = z.object({
  key: z.string().trim().min(1).max(80),
  focusSelector: z.string().trim().min(1).max(200),
  label: z.string().trim().min(1).max(200),
});

/**
 * Theme-token cartography (Phase 02 §02-CAT-07): keys must reference
 * `currentColor` or `--something-kebab`; values must be string CSS-var
 * references and must NOT contain any `#hex` literal. Hardcoded hex would
 * defeat semantic-variable theming.
 */
export const BlockDescriptorThemeTokensSchema = z
  .record(
    z.string().regex(THEME_TOKEN_REF_REGEX, {
      message: "themeTokens keys must be 'currentColor' or '--kebab-case'",
    }),
    z.string().min(1).max(200),
  )
  .superRefine((record, ctx) => {
    for (const [key, value] of Object.entries(record)) {
      if (HEX_LITERAL_REGEX.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `themeTokens value contains a #hex literal; use semantic CSS variables only`,
        });
      }
    }
  });

/** Parametric Maker.js recipe (optional). When set, publish uses maker path + pipelineCore S3. */
export const BlockDescriptorMakerSchema = z.discriminatedUnion("recipe", [
  z.object({
    recipe: z.literal("linear-desk"),
    widthMm: z.number().finite().positive(),
    depthMm: z.number().finite().positive(),
    topThicknessMm: z.number().finite().positive().optional(),
    pedestalWidthMm: z.number().finite().positive().optional(),
    pedestals: z.boolean().optional(),
  }),
  z.object({
    recipe: z.literal("l-desk"),
    widthMm: z.number().finite().positive(),
    depthMm: z.number().finite().positive(),
    returnWidthMm: z.number().finite().positive(),
  }),
  z.object({
    recipe: z.literal("desk-assembly"),
    layout: z.enum(["linear", "u"]),
    workstationCount: z.number().int().min(1).max(24),
    runLengthMm: z.number().finite().positive(),
    returnLengthMm: z.number().finite().positive(),
    deskDepthMm: z.number().finite().positive(),
    aisleMm: z.number().finite().positive(),
    powerRail: z.boolean(),
    cableManagement: z.boolean(),
    modesty: z.boolean(),
    partitions: z.boolean(),
  }),
]);
export type BlockDescriptorMaker = z.infer<typeof BlockDescriptorMakerSchema>;

/** Common base fields shared across the three variant tags. */
const BlockDescriptorCommonBaseSchema = z.object({
  schemaVersion: z.literal(BLOCK_DESCRIPTOR_SCHEMA_VERSION),
  id: BlockDescriptorIdentitySchema.shape.id,
  slug: BlockDescriptorIdentitySchema.shape.slug,
  sku: BlockDescriptorIdentitySchema.shape.sku,
  parentProductId: BlockDescriptorIdentitySchema.shape.parentProductId,
  sourceProvenance: BlockDescriptorIdentitySchema.shape.sourceProvenance,
  createdBy: BlockDescriptorIdentitySchema.shape.createdBy,
  geometry: BlockDescriptorGeometrySchema,
  viewBox: BlockDescriptorViewBoxSchema,
  mounting: z.array(MountPlaneSchema).min(1, "mounting must list at least one plane"),
  mountingPoints: z.array(MountingPointSchema).optional(),
  /** Optional explicit blocks for resolver contract (PLAN-FAIL-0413 / 0406). See BlockDescriptorBlockSchema. Cites BP-02 schema parity + Phase 06 loader. */
  blocks: z.array(BlockDescriptorBlockSchema).optional(),
  /** Optional freeform imported/drawn paths (custom furniture). See BlockDescriptorImportedPathSchema. */
  importedPaths: z.array(BlockDescriptorImportedPathSchema).max(1_000).optional(),
  maker: BlockDescriptorMakerSchema.optional(),
  themeTokens: BlockDescriptorThemeTokensSchema,
  rovingFocus: z.array(BlockDescriptorRovingFocusEntrySchema),
  liveAnnouncementCategories: z
    .array(BlockDescriptorLiveAnnouncementCategorySchema)
    .min(1, "liveAnnouncementCategories must list at least one category"),
  /** Optional in input; parseFresh stamps once; parseExisting freezes. */
  generatedAt: z.number().int().nonnegative().finite().optional(),
  /** Required in input: SHA-256 hex digest over the canonicalized body. */
  checksum: z
    .string()
    .regex(SHA256_HEX_REGEX, "checksum must be a 64-char SHA-256 hex digest"),
  /** Writer-side flag set when the caller wants idempotent comparison. */
  idempotent: z.boolean().optional(),
  /** Optional PNG plan-symbol pointer (Phase 1+; additive, not required on read). */
  planSymbolPngUrl: PlanSymbolPngPointerFieldsSchema.shape.planSymbolPngUrl,
  planSymbolPngChecksum:
    PlanSymbolPngPointerFieldsSchema.shape.planSymbolPngChecksum,
  planSymbolMime: PlanSymbolPngPointerFieldsSchema.shape.planSymbolMime,
});

// ── Variant discriminators (Phase 02 §02-CAT-02) ─────────────────────────

export const BlockDescriptorFixedSchema = BlockDescriptorCommonBaseSchema.extend({
  variant: z.literal("fixed"),
  fixed: z.object({
    sizingType: z.literal("fixed"),
  }),
  assets: z
    .object({
      /** System-generated only (extrude/modular). Designer static GLB rejected. */
      glbUrl: z
        .string()
        .optional()
        .refine(
          (u) => {
            if (u === null || u === undefined || u.trim() === "") {return true;}
            const t = u.trim();
            return t.startsWith("blob:") || t.includes("catalog-assets/generated/");
          },
          {
            message:
              "Designer static GLB not allowed — use generated path (catalog-assets/generated/) or modular/parametric mesh",
          },
        ),
      svgUrl: z.string().optional(),
    })
    .optional(),
});
/** `fixed` variant: dimensions locked, no parametric controls. */
export type BlockDescriptorFixed = z.infer<typeof BlockDescriptorFixedSchema>;

export const BlockDescriptorConfigurableSchema = BlockDescriptorCommonBaseSchema.extend({
  variant: z.literal("configurable"),
  configurable: z.object({
    sizingType: z.enum(["discrete", "parametric"]),
    sizeOptions: z.array(z.string().trim().min(1)).min(1).optional(),
    boundsMm: z
      .object({
        widthMm: z
          .tuple([z.number().finite().positive(), z.number().finite().positive()])
          .optional(),
        depthMm: z
          .tuple([z.number().finite().positive(), z.number().finite().positive()])
          .optional(),
        heightMm: z
          .tuple([z.number().finite().positive(), z.number().finite().positive()])
          .optional(),
      })
      .optional(),
  }),
});
/** `configurable` variant: a discrete set or bounded parametric adjustment. */
export type BlockDescriptorConfigurable = z.infer<typeof BlockDescriptorConfigurableSchema>;

export const BlockDescriptorParametricSchema = BlockDescriptorCommonBaseSchema.extend({
  variant: z.literal("parametric"),
  parametric: z.object({
    sizingType: z.literal("parametric"),
    parameterSchema: z
      .array(
        z.object({
          key: z.string().trim().min(1).max(80),
          label: z.string().trim().min(1).max(200),
          kind: z.enum(["number", "select", "boolean"]),
          bounds: z.tuple([z.number().finite(), z.number().finite()]).optional(),
          options: z.array(z.string()).optional(),
          default: z.union([z.number(), z.string(), z.boolean()]).optional(),
        }),
      )
      .min(1, "parameterSchema must list at least one parameter"),
  }),
  mountingPoints: z
    .array(MountingPointSchema)
    .min(1, "parametric descriptors require at least one mountingPoint"),
});
/** `parametric` variant: full parametric schema with explicit mountingPoints. */
export type BlockDescriptorParametric = z.infer<typeof BlockDescriptorParametricSchema>;

/** Discriminated union of all three variants (§02-CAT-02). */
export const BlockDescriptorSchema = z.discriminatedUnion("variant", [
  BlockDescriptorFixedSchema,
  BlockDescriptorConfigurableSchema,
  BlockDescriptorParametricSchema,
]);

export type BlockDescriptor =
  | BlockDescriptorFixed
  | BlockDescriptorConfigurable
  | BlockDescriptorParametric;

/** All variant tags as const tuple (compile-time union exhaustiveness). */
export const BLOCK_DESCRIPTOR_VARIANTS = ["fixed", "configurable", "parametric"] as const;
export type BlockDescriptorVariant = (typeof BLOCK_DESCRIPTOR_VARIANTS)[number];

// ── Canonicalization + SHA-256 fingerprint (§02-CAT-09) ──────────────────────

/** Recursively sort object keys so JSON.stringify yields a deterministic byte sequence. */
export function canonicalizeBlockDescriptorInput(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalizeBlockDescriptorInput(entry));
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      sorted[key] = canonicalizeBlockDescriptorInput(record[key]);
    }
    return sorted;
  }
  return value;
}

/** Compute SHA-256 hex digest over canonical JSON of the input. */
export function computeBlockDescriptorChecksum(raw: unknown): string {
  // Strip any `checksum` field recursively so the digest depends only on the
  // payload content; otherwise the digest would be self-referential (the
  // digest hashed into itself) and re-parsing the persisted body would
  // diverge from the digest declared alongside it.
  const stripped = stripChecksumDeep(raw);
  const payload = JSON.stringify(canonicalizeBlockDescriptorInput(stripped));
  return sha256Hex(payload);
}

function stripChecksumDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stripChecksumDeep(entry));
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(record)) {
      if (key === "checksum") {continue;}
      out[key] = stripChecksumDeep(record[key]);
    }
    return out;
  }
  return value;
}

// ── PlannerDescriptorError taxonomy (§02-ERR-01 .. §02-ERR-06) ─────────────────

export const PlannerDescriptorErrorKindSchema = z.enum([
  "invalid",
  "notFound",
  "versionMismatch",
  "hashMismatch",
]);
export type PlannerDescriptorErrorKind = z.infer<typeof PlannerDescriptorErrorKindSchema>;

interface PlannerDescriptorErrorBase {
  /** Stable machine-readable error code, e.g. `422.invalid`. */
  code: string;
  /** Zod-style field path joined by `.`. */
  fieldPath: string;
  /** Human-readable explanation. */
  message: string;
}

export interface PlannerDescriptorErrorInvalid extends PlannerDescriptorErrorBase {
  kind: "invalid";
  /** Zod issue paths+messages, exposed for the admin editor UI. */
  issues: ReadonlyArray<{ path: string; message: string }>;
}

export interface PlannerDescriptorErrorNotFound extends PlannerDescriptorErrorBase {
  kind: "notFound";
  /** Slug that was requested. */
  slug: string;
}

export interface PlannerDescriptorErrorVersionMismatch extends PlannerDescriptorErrorBase {
  kind: "versionMismatch";
  /** Schema site pinned version. */
  expected: string;
  /** What the caller supplied / wrote. */
  actual: string;
}

export interface PlannerDescriptorErrorHashMismatch extends PlannerDescriptorErrorBase {
  kind: "hashMismatch";
  /** SHA-256 hex digest the descriptor declared. */
  expected: string;
  /** SHA-256 hex digest re-computed from the canonicalized body. */
  actual: string;
}

/**
 * Discriminated union returned by every parse/load step in Phase 02. Each
 * variant carries the bare minimum the caller (admin/portal/planner loader)
 * needs to render a stable error envelope; the union is closed, so adding a
 * new variant will fail compile at the consumer switch.
 */
export type PlannerDescriptorError =
  | PlannerDescriptorErrorInvalid
  | PlannerDescriptorErrorNotFound
  | PlannerDescriptorErrorVersionMismatch
  | PlannerDescriptorErrorHashMismatch;

export interface PlannerDescriptorErrorHttpShape {
  status: number;
  body: {
    error: string;
    code: string;
    fieldPath: string;
    message: string;
  };
}

/**
 * Phase 02 owns the full `code → HTTP shape` map for the four
 * `PlannerDescriptorError` variants (§02-ERR-02 .. 06). Phase 08 §08-PERS-10
 * cites this map; it is not the source of truth.
 *
 *   invalid          → 422.invalid
 *   versionMismatch  → 422.version_mismatch
 *   hashMismatch     → 409.hash_mismatch
 *   notFound         → 404.not_found
 */
export function toPlannerDescriptorErrorHttp(
  error: PlannerDescriptorError,
): PlannerDescriptorErrorHttpShape {
  switch (error.kind) {
    case "invalid":
      return {
        status: 422,
        body: {
          error: "invalid",
          code: "422.invalid",
          fieldPath: error.fieldPath,
          message: error.message,
        },
      };
    case "versionMismatch":
      return {
        status: 422,
        body: {
          error: "version_mismatch",
          code: "422.version_mismatch",
          fieldPath: error.fieldPath,
          message: error.message,
        },
      };
    case "hashMismatch":
      return {
        status: 409,
        body: {
          error: "hash_mismatch",
          code: "409.hash_mismatch",
          fieldPath: error.fieldPath,
          message: error.message,
        },
      };
    case "notFound":
      return {
        status: 404,
        body: {
          error: "not_found",
          code: "404.not_found",
          fieldPath: error.fieldPath,
          message: error.message,
        },
      };
  }
}

/** Result type at the loader boundary (§02-LOAD-01). */
export type PlannerResult<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const plannerOk = <T, E>(value: T): PlannerResult<T, E> => ({ ok: true, value });
export const plannerErr = <T, E>(error: E): PlannerResult<T, E> => ({ ok: false, error });

// ── Parse entry points (§02-CAT-08 / §02-CAT-11) ────────────────────────────

/**
 * Validate the structure AND checksum of a parsed-JSON `BlockDescriptor` input.
 * Does NOT stamp `generatedAt`; use {@link freezeFreshDescriptor} for first-write.
 */
export function parseBlockDescriptor(
  input: unknown,
): PlannerResult<BlockDescriptor, PlannerDescriptorError> {
  if (!input || typeof input !== "object") {
    return plannerErr<BlockDescriptor, PlannerDescriptorError>({
      kind: "invalid",
      code: "422.invalid",
      fieldPath: "slug:primitive",
      message: "BlockDescriptor input must be a JSON object",
      issues: [{ path: "", message: "expected object" }],
    });
  }
  const shape = input as Record<string, unknown>;

  if (typeof shape.schemaVersion !== "string") {
    return plannerErr<BlockDescriptor, PlannerDescriptorError>({
      kind: "invalid",
      code: "422.invalid",
      fieldPath: "schemaVersion",
      message: "schemaVersion is required",
      issues: [{ path: "schemaVersion", message: "schemaVersion must be a string" }],
    });
  }
  if (shape.schemaVersion !== BLOCK_DESCRIPTOR_SCHEMA_VERSION) {
    return plannerErr<BlockDescriptor, PlannerDescriptorError>({
      kind: "versionMismatch",
      code: "422.version_mismatch",
      fieldPath: "schemaVersion",
      message:
        `BlockDescriptor schemaVersion ${String(shape.schemaVersion)} does not match pinned ${BLOCK_DESCRIPTOR_SCHEMA_VERSION}; re-pin the schema site before retrying.`,
      expected: BLOCK_DESCRIPTOR_SCHEMA_VERSION,
      actual: String(shape.schemaVersion),
    });
  }

  const parsed = BlockDescriptorSchema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return plannerErr<BlockDescriptor, PlannerDescriptorError>({
      kind: "invalid",
      code: "422.invalid",
      fieldPath: issues[0]?.path ?? "",
      message: `BlockDescriptor failed structural validation: ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`,
      issues,
    });
  }

  const checksumRecomputed = computeBlockDescriptorChecksum(parsed.data);
  const declared = typeof shape.checksum === "string" ? shape.checksum.toLowerCase() : "";
  if (declared !== checksumRecomputed) {
    return plannerErr<BlockDescriptor, PlannerDescriptorError>({
      kind: "hashMismatch",
      code: "409.hash_mismatch",
      fieldPath: "checksum",
      message:
        "BlockDescriptor content checksum mismatch; descriptor has been mutated after the original write",
      expected: declared || "<missing>",
      actual: checksumRecomputed,
    });
  }

  return plannerOk<BlockDescriptor, PlannerDescriptorError>(parsed.data);
}

/**
 * Validate input for the FIRST write. If `generatedAt` is absent, stamp it
 * (via the supplied clock to keep tests deterministic). If a `generatedAt` is
 * already present, leave it alone — §02-CAT-08 freezes the stamp on first
 * write, and any later attempt to alter it must be rejected upstream by
 * {@link freezeRewriteDescriptor}.
 */
export function freezeFreshDescriptor(
  input: unknown,
  stampNow: () => number,
): PlannerResult<BlockDescriptor, PlannerDescriptorError> {
  if (!input || typeof input !== "object") {
    return plannerErr<BlockDescriptor, PlannerDescriptorError>({
      kind: "invalid",
      code: "422.invalid",
      fieldPath: "slug:primitive",
      message: "BlockDescriptor input must be a JSON object",
      issues: [{ path: "", message: "expected object" }],
    });
  }
  const shape = input as Record<string, unknown>;
  const next: Record<string, unknown> = { ...shape };
  // Strip the incoming `checksum` (write-time stub) so safeParse does not
  // choke on an empty/non-hex value AND so the canonical hash is computed
  // over content fields only — round-trip closes when we re-attach below.
  delete next.checksum;

  if (typeof shape.generatedAt !== "number") {
    const now = typeof stampNow === "function" ? stampNow() : Date.now();
    next.generatedAt = Math.floor(now);
  }

  const parsed = BlockDescriptorSchema.safeParse({ ...next, checksum: "0".repeat(64) });
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return plannerErr<BlockDescriptor, PlannerDescriptorError>({
      kind: "invalid",
      code: "422.invalid",
      fieldPath: issues[0]?.path ?? "",
      message: `BlockDescriptor failed structural validation: ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`,
      issues,
    });
  }

  const checksumRecomputed = computeBlockDescriptorChecksum(parsed.data);
  const rewritten = { ...parsed.data, checksum: checksumRecomputed };
  return plannerOk<BlockDescriptor, PlannerDescriptorError>(rewritten);
}

/**
 * Validate a rewrite attempt against a previously persisted descriptor.
 * Refuses to mutate `generatedAt` (§02-CAT-08 / §02-CAT-11 annex): any change
 * surfaces {@link PlannerDescriptorErrorHashMismatch} because the recomputed
 * checksum will not match the previously frozen values.
 */
export function freezeRewriteDescriptor(
  previous: BlockDescriptor,
  nextInput: unknown,
): PlannerResult<BlockDescriptor, PlannerDescriptorError> {
  if (!nextInput || typeof nextInput !== "object") {
    return plannerErr<BlockDescriptor, PlannerDescriptorError>({
      kind: "invalid",
      code: "422.invalid",
      fieldPath: "",
      message: "BlockDescriptor input must be a JSON object",
      issues: [{ path: "", message: "expected object" }],
    });
  }
  const candidate = nextInput as Record<string, unknown>;
  if (
    typeof candidate.generatedAt === "number" &&
    candidate.generatedAt !== previous.generatedAt
  ) {
    return plannerErr<BlockDescriptor, PlannerDescriptorError>({
      kind: "hashMismatch",
      code: "409.hash_mismatch",
      fieldPath: "generatedAt",
      message: `BlockDescriptor generatedAt mutation refused (§02-CAT-11 annex); previously frozen at ${previous.generatedAt}`,
      expected: String(previous.generatedAt ?? 0),
      actual: String(candidate.generatedAt),
    });
  }

  const parsed = BlockDescriptorSchema.safeParse(nextInput);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return plannerErr<BlockDescriptor, PlannerDescriptorError>({
      kind: "invalid",
      code: "422.invalid",
      fieldPath: issues[0]?.path ?? "",
      message: `BlockDescriptor failed structural validation: ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`,
      issues,
    });
  }

  const a = computeBlockDescriptorChecksum(previous);
  const b = computeBlockDescriptorChecksum(parsed.data);
  if (a !== b) {
    return plannerErr<BlockDescriptor, PlannerDescriptorError>({
      kind: "hashMismatch",
      code: "409.hash_mismatch",
      fieldPath: "checksum",
      message:
        "BlockDescriptor rewrite fingerprints do not match the previously frozen descriptor; refusing silent overwrite.",
      expected: a,
      actual: b,
    });
  }

  return plannerOk<BlockDescriptor, PlannerDescriptorError>({ ...parsed.data, checksum: a });
}

/** Fingerprint identity across processes — alias for {@link computeBlockDescriptorChecksum}. */
export const blockDescriptorChecksum = computeBlockDescriptorChecksum;
