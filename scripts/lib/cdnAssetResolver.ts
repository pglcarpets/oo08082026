import fs from "fs";
import path from "path";

import { SITE_PACKAGE_ROOT } from "./repoRoot";

const PUBLIC_DIR = path.resolve(SITE_PACKAGE_ROOT, "public");

export type AssetResolution =
  | { kind: "exists" }
  | { kind: "copy"; sourceWebPath: string }
  | { kind: "rewrite"; canonicalWebPath: string }
  | { kind: "unresolved" };

export function localAssetExists(relPath: string): boolean {
  const abs = path.join(PUBLIC_DIR, relPath.replace(/^\//, "").replace(/\//g, path.sep));
  return fs.existsSync(abs) && fs.statSync(abs).size > 0;
}

export function buildBasenameIndex(rootRel = ""): Map<string, string[]> {
  const byBaseName = new Map<string, string[]>();
  const rootAbs = path.join(PUBLIC_DIR, rootRel.replace(/^\//, ""));

  if (!fs.existsSync(rootAbs)) {
    return byBaseName;
  }

  function walk(dirAbs: string, rel: string) {
    for (const entry of fs.readdirSync(dirAbs, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const abs = path.join(dirAbs, entry.name);
      const relPath = path.posix.join(rel, entry.name);
      if (entry.isDirectory()) {
        walk(abs, relPath);
        continue;
      }
      const webPath = `/${path.posix.join(rootRel.replace(/^\//, ""), relPath).replace(/^\/+/, "")}`;
      const list = byBaseName.get(entry.name) ?? [];
      list.push(webPath.startsWith("/") ? webPath : `/${webPath}`);
      byBaseName.set(entry.name, list);
    }
  }

  walk(rootAbs, "");
  return byBaseName;
}

function resolveLegacyChairPath(relPath: string): string | null {
  const match = relPath.match(/^\/images\/chairs\/([^/]+)\/(image-[^/]+)$/i);
  if (!match) return null;

  const [, slug, fileName] = match;
  const catalogDirAbs = path.join(PUBLIC_DIR, "images", "catalog", `oando-seating--${slug}`);
  if (!fs.existsSync(catalogDirAbs)) return null;

  const files = fs.readdirSync(catalogDirAbs);
  const exact = files.find((file) => file.toLowerCase() === fileName.toLowerCase());
  if (exact) {
    return `/assets/catalog/oando-seating--${slug}/${exact}`;
  }

  const numberMatch = fileName.match(/image-0*(\d+)/i);
  if (!numberMatch) return null;
  const imageNumber = numberMatch[1];
  const byNumber = files.find((file) => {
    const fileNumber = file.match(/image-0*(\d+)/i)?.[1];
    return fileNumber === imageNumber;
  });
  if (!byNumber) return null;

  return `/assets/catalog/oando-seating--${slug}/${byNumber}`;
}

function resolveCatalogBasename(relPath: string, basenameIndex: Map<string, string[]>): string | null {
  const fileName = path.posix.basename(relPath);
  const candidates = (basenameIndex.get(fileName) ?? []).filter((candidate) => candidate !== relPath);
  const catalogCandidate = candidates.find((candidate) => candidate.includes("/assets/catalog/"));
  return catalogCandidate ?? candidates[0] ?? null;
}

function extractProductSlug(fileName: string): string | null {
  const stem = fileName.replace(/\.[^.]+$/, "");
  const parts = stem.split("_");
  if (parts.length < 2) return null;

  const lastPart = parts[parts.length - 1] ?? "";
  const slug = /^\d+[a-z]?$/i.test(lastPart)
    ? (parts[parts.length - 2] ?? "")
    : lastPart.replace(/_?\d+[a-z]?$/i, "");
  return slug.trim() || null;
}

function resolveProductSlugFallback(relPath: string, basenameIndex: Map<string, string[]>): string | null {
  const fileName = path.posix.basename(relPath);
  const slug = extractProductSlug(fileName);
  if (!slug) return null;

  const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const slugPattern = new RegExp(`_${escapedSlug}(?:[._-]|\\.)`, "i");

  for (const [candidateName, webPaths] of basenameIndex.entries()) {
    if (!slugPattern.test(candidateName) && !candidateName.includes(`_${slug}.`)) continue;
    const catalogPath = webPaths.find((webPath) => webPath.includes("/assets/catalog/"));
    if (catalogPath) return catalogPath;
    if (webPaths[0]) return webPaths[0];
  }

  return null;
}

function resolveVariantFallback(relPath: string, basenameIndex: Map<string, string[]>): string | null {
  const fileName = path.posix.basename(relPath);
  const variantNames = new Set<string>();

  const secondaryMatch = fileName.match(/^(.+?)_2[a-z]?(\.[^.]+)$/i);
  if (secondaryMatch) {
    const [, stem, ext] = secondaryMatch;
    variantNames.add(`${stem}_1${ext}`);
    variantNames.add(`${stem}${ext}`);
    variantNames.add(`${stem}_2a${ext}`);
  }

  if (/image-\d{2,}(\.[^.]+)$/i.test(fileName)) {
    const singleDigit = fileName.replace(/image-0(\d)(\d+)(\.[^.]+)$/i, "image-$1$2");
    if (singleDigit !== fileName) variantNames.add(singleDigit);
  }

  for (const variantName of variantNames) {
    const candidates = (basenameIndex.get(variantName) ?? []).filter((candidate) => candidate !== relPath);
    const catalogCandidate = candidates.find((candidate) => candidate.includes("/assets/catalog/"));
    if (catalogCandidate) return catalogCandidate;
    if (candidates[0]) return candidates[0];
  }

  return null;
}

export function resolveMissingAssetPath(
  relPath: string,
  basenameIndex: Map<string, string[]>,
): AssetResolution {
  if (localAssetExists(relPath)) {
    return { kind: "exists" };
  }

  const legacyChair = resolveLegacyChairPath(relPath);
  if (legacyChair && localAssetExists(legacyChair)) {
    return { kind: "copy", sourceWebPath: legacyChair };
  }

  const alternate = resolveCatalogBasename(relPath, basenameIndex);
  if (alternate && localAssetExists(alternate)) {
    return { kind: "copy", sourceWebPath: alternate };
  }

  const variantFallback = resolveVariantFallback(relPath, basenameIndex);
  if (variantFallback && localAssetExists(variantFallback)) {
    return { kind: "copy", sourceWebPath: variantFallback };
  }

  const slugFallback = resolveProductSlugFallback(relPath, basenameIndex);
  if (slugFallback && localAssetExists(slugFallback)) {
    return { kind: "copy", sourceWebPath: slugFallback };
  }

  return { kind: "unresolved" };
}

export function copyWebAsset(sourceWebPath: string, destWebPath: string): void {
  const sourceAbs = path.join(PUBLIC_DIR, sourceWebPath.replace(/^\//, "").replace(/\//g, path.sep));
  const destAbs = path.join(PUBLIC_DIR, destWebPath.replace(/^\//, "").replace(/\//g, path.sep));
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  fs.copyFileSync(sourceAbs, destAbs);
}