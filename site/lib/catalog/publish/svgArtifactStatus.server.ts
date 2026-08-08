import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { resolveSvgCatalogDir } from "@/lib/paths/sitePackageRoot";

export type SvgArtifactState = "published" | "missing" | "invalid";

export type SvgArtifactStatus = {
  readonly state: SvgArtifactState;
  readonly bytes: number;
  readonly updatedAt: number | null;
  readonly hash: string | null;
  /** Public URL path when a file exists (even if invalid). */
  readonly publicUrl: string | null;
  /**
   * Sanitized SVG markup for admin inline preview when `state === "published"`.
   * Null for missing/invalid. Catalog-only (we wrote the file).
   */
  readonly markup: string | null;
};

function svgPathForSlug(slug: string): string {
  return path.join(resolveSvgCatalogDir(), `${slug}.svg`);
}

/**
 * **Phase 7 Stage A — labelled legacy `/svg-catalog` read fallback.** The live
 * plan symbol is PNG (`pngArtifactStatus.server.ts`); this disk-SVG status read
 * survives only so un-migrated inventory still reports a published artifact in
 * the admin list and in `GET /api/planner/catalog/svg-blocks` under disk
 * authority. Retire it with the last SVG-only descriptor.
 */
function publicUrlForSlug(slug: string): string {
  return `/svg-catalog/${slug}.svg`;
}

function hashSvg(contents: string): string {
  return createHash("sha256").update(contents, "utf8").digest("hex");
}

/**
 * Fail-closed markup gate for admin preview.
 * Catalog artifacts are server-authored; still strip script/handlers.
 */
export function sanitizeCatalogSvgMarkup(raw: string): string | null {
  const contents = raw.trim();
  if (!contents.startsWith("<svg") || !/<\/svg>\s*$/i.test(contents)) {
    return null;
  }
  if (/<script[\s>]/i.test(contents) || /\bon[a-z]+\s*=/i.test(contents)) {
    return null;
  }
  if (/javascript:/i.test(contents)) {
    return null;
  }
  return contents;
}

export function readSvgArtifactStatus(slug: string): SvgArtifactStatus {
  const artifactPath = svgPathForSlug(slug);
  const publicUrl = publicUrlForSlug(slug);
  if (!existsSync(artifactPath)) {
    return {
      state: "missing",
      bytes: 0,
      updatedAt: null,
      hash: null,
      publicUrl: null,
      markup: null,
    };
  }

  try {
    const stat = statSync(artifactPath);
    const contents = readFileSync(artifactPath, "utf8");
    const markup = sanitizeCatalogSvgMarkup(contents);
    if (!markup) {
      return {
        state: "invalid",
        bytes: stat.size,
        updatedAt: stat.mtimeMs,
        hash: hashSvg(contents.trim()),
        publicUrl,
        markup: null,
      };
    }
    return {
      state: "published",
      bytes: stat.size,
      updatedAt: stat.mtimeMs,
      hash: hashSvg(markup),
      publicUrl,
      markup,
    };
  } catch {
    return {
      state: "invalid",
      bytes: 0,
      updatedAt: null,
      hash: null,
      publicUrl,
      markup: null,
    };
  }
}

export function readSvgArtifactStatuses(
  slugs: ReadonlyArray<string>,
): Readonly<Record<string, SvgArtifactStatus>> {
  const statuses: Record<string, SvgArtifactStatus> = {};
  for (const slug of slugs) {
    statuses[slug] = readSvgArtifactStatus(slug);
  }
  return statuses;
}
