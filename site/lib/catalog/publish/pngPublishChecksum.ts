/**
 * Residual publish helpers after SVG dual-write retirement (Phase 7 Stage B).
 *
 * Formerly `publishDescriptorWithPipeline.ts`. Live exports:
 * - {@link checksumPngBuffer} — SHA-256 over PNG upload bytes (`publishToStorageAction`)
 * - {@link PublishDescriptorResult} — shared success/failure shape for Product Studio
 * - {@link rasterizePublishedSvgPng} — fail-closed stub (SVG publish retired)
 *
 * The former `publishDescriptorWithPipeline()` dual-write body and
 * `planSvgQualityGate` were deleted after `pushSvgCatalogToDb` retargeted to
 * `upsertBlockDescriptorRelease` and dual-write callers had zero product imports.
 */

import { createHash } from "node:crypto";

import type { BlockDescriptor } from "@/lib/catalog/svg/svgTypes";

/**
 * SVG→PNG rasterization retired (PNG-only Product Studio).
 * Inject real PNG upload bytes via {@link checksumPngBuffer} instead.
 */
export function rasterizePublishedSvgPng(_svgMarkup: string): {
  readonly png: Buffer;
  readonly checksum: string;
} {
  void _svgMarkup;
  throw new Error("SVG publish retired; use PNG");
}

/** Honest SHA-256 for PNG upload bytes (no SVG rasterization). */
export function checksumPngBuffer(png: Buffer): {
  readonly png: Buffer;
  readonly checksum: string;
} {
  if (!Buffer.isBuffer(png) || png.length === 0) {
    throw new Error("PNG publish requires non-empty PNG bytes");
  }
  return {
    png,
    checksum: createHash("sha256").update(png).digest("hex"),
  };
}

export type PublishDescriptorSuccess = {
  readonly success: true;
  readonly descriptor: BlockDescriptor;
  /**
   * True when publish was a no-op because released content already matched
   * (legacy dual-write idempotent path; PNG path may omit this).
   */
  readonly idempotent?: boolean;
};

export type PublishDescriptorFailure = {
  readonly success: false;
  readonly error: string;
};

export type PublishDescriptorResult =
  | PublishDescriptorSuccess
  | PublishDescriptorFailure;
