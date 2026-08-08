/**
 * Admin Phase 2 — one versioned released catalog product contract.
 *
 * Shared by Admin publication output and Planner catalog consumption.
 * Builds on PublishedRevisionV1 / SvgArtifactRecord concepts (revision id +
 * checksum + resource URL) without requiring database I/O in this module.
 *
 * Pure functions only. Tests must not mutate canonical catalog files.
 */

import { z } from "zod";

export const RELEASED_CATALOG_PRODUCT_SCHEMA_VERSION = 1 as const;

const SlugSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]{1,63}$/, "slug must match ^[a-z][a-z0-9-]{1,63}$");

const PositiveMmSchema = z.number().finite().positive();

const Sha256Schema = z
  .string()
  .regex(/^[a-f0-9]{64}$/, "checksum must be a 64-char lowercase hex SHA-256");

/** Customer-visible availability on the released record. */
export const ReleasedAvailabilitySchema = z.enum([
  "available",
  "unavailable",
  "retired",
]);

export type ReleasedAvailability = z.infer<typeof ReleasedAvailabilitySchema>;

/**
 * Released product record — Admin publishes this shape; Planner loads it.
 * schemaVersion is the contract pin for both sides.
 */
export const ReleasedCatalogProductV1Schema = z
  .object({
    schemaVersion: z.literal(RELEASED_CATALOG_PRODUCT_SCHEMA_VERSION),
    /** Stable product UUID (never reminted on edit). */
    productId: z.string().uuid(),
    slug: SlugSchema,
    name: z.string().trim().min(1).max(160),
    sku: z.string().trim().min(1).max(120).optional(),
    /** Stable commercial line identity for BOQ grouping. */
    boqIdentity: z.string().trim().min(1).max(160),
    availability: ReleasedAvailabilitySchema,
    dimensionsMm: z
      .object({
        width: PositiveMmSchema,
        depth: PositiveMmSchema,
        height: PositiveMmSchema.optional(),
      })
      .strict(),
    svg: z
      .object({
        revisionId: SlugSchema,
        checksum: Sha256Schema,
        resourceUrl: z.string().trim().min(1).max(500),
      })
      .strict(),
    /** Must match product slug / type identity for the same-product rule. */
    definitionTypeId: SlugSchema,
    definitionVersion: z.number().int().positive(),
    publishedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.definitionTypeId !== value.slug) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["definitionTypeId"],
        message:
          "definitionTypeId must match product slug (same-product contradiction).",
      });
    }
  });

export type ReleasedCatalogProductV1 = z.infer<
  typeof ReleasedCatalogProductV1Schema
>;

export function parseReleasedCatalogProductV1(
  input: unknown,
): ReleasedCatalogProductV1 {
  return ReleasedCatalogProductV1Schema.parse(input);
}

export interface ReleasedCatalogProductParts {
  readonly productId: string;
  readonly slug: string;
  readonly name: string;
  readonly sku?: string;
  readonly boqIdentity: string;
  readonly availability: ReleasedAvailability;
  readonly dimensionsMm: {
    readonly width: number;
    readonly depth: number;
    readonly height?: number;
  };
  readonly svgRevisionId: string;
  readonly svgChecksum: string;
  readonly svgResourceUrl: string;
  readonly definitionTypeId: string;
  readonly definitionVersion: number;
  readonly publishedAt: string;
}

/** Pure builder from Admin/Planner parts — validates before returning. */
export function releasedCatalogProductFromParts(
  parts: ReleasedCatalogProductParts,
): ReleasedCatalogProductV1 {
  return parseReleasedCatalogProductV1({
    schemaVersion: RELEASED_CATALOG_PRODUCT_SCHEMA_VERSION,
    productId: parts.productId,
    slug: parts.slug,
    name: parts.name,
    ...(parts.sku !== undefined ? { sku: parts.sku } : {}),
    boqIdentity: parts.boqIdentity,
    availability: parts.availability,
    dimensionsMm: parts.dimensionsMm,
    svg: {
      revisionId: parts.svgRevisionId,
      checksum: parts.svgChecksum,
      resourceUrl: parts.svgResourceUrl,
    },
    definitionTypeId: parts.definitionTypeId,
    definitionVersion: parts.definitionVersion,
    publishedAt: parts.publishedAt,
  });
}
