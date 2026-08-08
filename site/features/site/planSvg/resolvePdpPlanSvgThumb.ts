/**
 * PDP optional plan-symbol thumb when a published plan symbol exists.
 * Prefers PNG (`planSymbolPngUrl` / `/png-catalog`) then legacy SVG disk / revision API.
 * Does not flip release authority; pure URL resolution + injectable existence check.
 */

import { buildPlanSymbolPngPublicUrl } from "@/lib/catalog/planSymbolPngContract";
import {
  buildSvgCatalogPublicUrl,
  isPublishedPngPlanUrl,
  isPublishedPlanSymbolUrl,
  resolvePlanSvgUrl,
} from "@/lib/catalog/planSvg";

export interface PdpPlanSvgThumbInput {
  /** Marketing / catalog product slug (URL key). */
  readonly productSlug?: string | null;
  /** Optional metadata.sourceSlug or explicit plan slug. */
  readonly sourceSlug?: string | null;
  /** Explicit plan-symbol slug when joined. */
  readonly planSlug?: string | null;
  /** Products DB published_svg_revision_id when known. */
  readonly publishedSvgRevisionId?: string | null;
  /** Explicit PNG pointer from descriptor (Phase 1 field). */
  readonly planSymbolPngUrl?: string | null;
}

export interface PdpPlanSvgThumbResult {
  readonly url: string;
  readonly source: "revision" | "disk" | "png";
  readonly slug?: string;
}

function normalizeSlug(value: string | null | undefined): string | null {
  if (typeof value !== "string") {return null;}
  const trimmed = value.trim();
  if (!trimmed) {return null;}
  if (!/^[a-z0-9][a-z0-9._-]{0,120}$/i.test(trimmed)) {return null;}
  return trimmed;
}

/**
 * Ordered unique slug candidates for disk plan-symbol lookup.
 * Prefer explicit plan slug, then product slug, then source slug.
 */
export function listPdpPlanSvgSlugCandidates(
  input: PdpPlanSvgThumbInput,
): string[] {
  const ordered = [
    normalizeSlug(input.planSlug),
    normalizeSlug(input.productSlug),
    normalizeSlug(input.sourceSlug),
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const slug of ordered) {
    if (!slug) {continue;}
    const key = slug.toLowerCase();
    if (seen.has(key)) {continue;}
    seen.add(key);
    out.push(slug);
  }
  return out;
}

/**
 * Resolve a public plan-symbol thumb URL when a published artifact is available.
 * Prefers PNG pointer / `/png-catalog` disk, then SVG revision / `/svg-catalog`.
 *
 * **Phase 7 Stage A — labelled legacy `/svg-catalog` read fallback.** PNG is the
 * live plan-symbol authority; the SVG branch only serves un-migrated inventory
 * and is never the buyer-visible planner paint path.
 */
export function resolvePdpPlanSvgThumb(
  input: PdpPlanSvgThumbInput,
  options?: {
    readonly diskExists?: (slug: string) => boolean;
    readonly pngDiskExists?: (slug: string) => boolean;
    readonly findLooseDiskSlug?: (candidates: readonly string[]) => string | null;
    readonly findLoosePngDiskSlug?: (
      candidates: readonly string[],
    ) => string | null;
  },
): PdpPlanSvgThumbResult | null {
  const explicitPng = input.planSymbolPngUrl?.trim();
  if (explicitPng && isPublishedPngPlanUrl(explicitPng)) {
    return { url: explicitPng, source: "png" };
  }

  const candidates = listPdpPlanSvgSlugCandidates(input);
  const pngDiskExists = options?.pngDiskExists;
  const findLoosePngDiskSlug = options?.findLoosePngDiskSlug;

  if (pngDiskExists) {
    for (const slug of candidates) {
      if (!pngDiskExists(slug)) {continue;}
      return {
        url: buildPlanSymbolPngPublicUrl(slug),
        source: "png",
        slug,
      };
    }
  }

  if (findLoosePngDiskSlug) {
    const loosePng = findLoosePngDiskSlug(candidates);
    if (loosePng) {
      return {
        url: buildPlanSymbolPngPublicUrl(loosePng),
        source: "png",
        slug: loosePng,
      };
    }
  }

  const revisionId = input.publishedSvgRevisionId?.trim();
  if (revisionId) {
    const url = resolvePlanSvgUrl({ publishedSvgRevisionId: revisionId });
    if (url && isPublishedPlanSymbolUrl(url)) {
      return { url, source: "revision" };
    }
  }

  const diskExists = options?.diskExists;
  const findLooseDiskSlug = options?.findLooseDiskSlug;
  if (!diskExists && !findLooseDiskSlug && !pngDiskExists && !findLoosePngDiskSlug) {
    return null;
  }

  if (diskExists) {
    for (const slug of candidates) {
      if (!diskExists(slug)) {continue;}
      const url = buildSvgCatalogPublicUrl(slug);
      return { url, source: "disk", slug };
    }
  }

  if (findLooseDiskSlug) {
    const loose = findLooseDiskSlug(candidates);
    if (loose) {
      return {
        url: buildSvgCatalogPublicUrl(loose),
        source: "disk",
        slug: loose,
      };
    }
  }

  return null;
}
