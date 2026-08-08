/**
 * Server-only disk existence for PDP plan-symbol thumbs.
 * Prefers `/png-catalog` when present.
 *
 * **Phase 7 Stage A — labelled legacy `/svg-catalog` read fallback.** SVG
 * catalog disk listing remains until cutover; PNG is preferred when present.
 */

import "server-only";

import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  resolvePngCatalogDir,
  resolveSvgCatalogDir,
} from "@/lib/paths/sitePackageRoot.server";
import {
  resolvePdpPlanSvgThumb,
  type PdpPlanSvgThumbInput,
  type PdpPlanSvgThumbResult,
} from "./resolvePdpPlanSvgThumb";

let cachedPlanSlugs: string[] | null = null;
let cachedPngPlanSlugs: string[] | null = null;

function listPublishedPlanSlugs(): readonly string[] {
  if (cachedPlanSlugs) {
    return cachedPlanSlugs;
  }
  const dir = resolveSvgCatalogDir();
  if (!existsSync(dir)) {
    cachedPlanSlugs = [];
    return cachedPlanSlugs;
  }
  cachedPlanSlugs = readdirSync(dir)
    .filter((name) => name.toLowerCase().endsWith(".svg"))
    .map((name) => name.slice(0, -4));
  return cachedPlanSlugs;
}

function listPublishedPngPlanSlugs(): readonly string[] {
  if (cachedPngPlanSlugs) {
    return cachedPngPlanSlugs;
  }
  const dir = resolvePngCatalogDir();
  if (!existsSync(dir)) {
    cachedPngPlanSlugs = [];
    return cachedPngPlanSlugs;
  }
  cachedPngPlanSlugs = readdirSync(dir)
    .filter((name) => name.toLowerCase().endsWith(".png"))
    .map((name) => name.slice(0, -4));
  return cachedPngPlanSlugs;
}

export function diskPlanSvgExists(slug: string): boolean {
  const safe = slug.trim();
  if (!safe || safe.includes("..") || safe.includes("/") || safe.includes("\\")) {
    return false;
  }
  const svgPath = path.join(resolveSvgCatalogDir(), `${safe}.svg`);
  return existsSync(svgPath);
}

export function diskPlanPngExists(slug: string): boolean {
  const safe = slug.trim();
  if (!safe || safe.includes("..") || safe.includes("/") || safe.includes("\\")) {
    return false;
  }
  const pngPath = path.join(resolvePngCatalogDir(), `${safe}.png`);
  return existsSync(pngPath);
}

/**
 * Map short marketing product slugs onto published plan files.
 * Prefer exact `oando-{stem}` then first `oando-{stem}-*` match.
 */
export function findLooseDiskPlanSvgSlug(
  candidates: readonly string[],
): string | null {
  const published = listPublishedPlanSlugs();
  if (published.length === 0) {
    return null;
  }

  for (const candidate of candidates) {
    const stem = candidate.trim().toLowerCase();
    if (!stem || stem.includes("..") || stem.includes("/") || stem.includes("\\")) {
      continue;
    }

    const exactOando = published.find((slug) => slug.toLowerCase() === `oando-${stem}`);
    if (exactOando) {
      return exactOando;
    }

    const prefixed = published.find((slug) =>
      slug.toLowerCase().startsWith(`oando-${stem}-`),
    );
    if (prefixed) {
      return prefixed;
    }
  }

  return null;
}

export function findLooseDiskPlanPngSlug(
  candidates: readonly string[],
): string | null {
  const published = listPublishedPngPlanSlugs();
  if (published.length === 0) {
    return null;
  }

  for (const candidate of candidates) {
    const stem = candidate.trim().toLowerCase();
    if (!stem || stem.includes("..") || stem.includes("/") || stem.includes("\\")) {
      continue;
    }

    const exact = published.find((slug) => slug.toLowerCase() === stem);
    if (exact) {
      return exact;
    }

    const exactOando = published.find((slug) => slug.toLowerCase() === `oando-${stem}`);
    if (exactOando) {
      return exactOando;
    }

    const prefixed = published.find((slug) =>
      slug.toLowerCase().startsWith(`oando-${stem}-`),
    );
    if (prefixed) {
      return prefixed;
    }
  }

  return null;
}

/** Resolve PDP plan thumb using on-disk published symbols (PNG preferred, SVG legacy). */
export function resolvePdpPlanSvgThumbFromDisk(
  input: PdpPlanSvgThumbInput,
): PdpPlanSvgThumbResult | null {
  return resolvePdpPlanSvgThumb(input, {
    diskExists: diskPlanSvgExists,
    pngDiskExists: diskPlanPngExists,
    findLooseDiskSlug: findLooseDiskPlanSvgSlug,
    findLoosePngDiskSlug: findLooseDiskPlanPngSlug,
  });
}
