// Client-safe asset path utilities
// Note: File system checks are only available server-side

import {
  filterProductCatalogMedia,
  isProductCatalogMediaPath,
} from "@/lib/catalog/site/catalogProductFilters";
import type fsType from "node:fs";
import type pathType from "node:path";

const configuredAssetBaseUrl = (
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  process.env.ASSET_BASE_URL ||
  ""
)
  .trim()
  .replace(/\/+$/, "");

function hasAbsoluteUrl(value: string): boolean {
  return /^(?:https?:)?\/\//i.test(value) || /^[a-z][a-z0-9+.-]*:/i.test(value);
}

/**
 * Shipped under site/public — must stay same-origin (CDN does not mirror these).
 * Full marketing tree is local-authoritative (heroes, clients, UI tiles, logos).
 * Catalog flagship tiles also ship in-repo; bulk catalog may use CDN.
 */
function isLocalOnlyAssetPath(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower.startsWith("/assets/marketing/") ||
    lower.startsWith("/assets/catalog/flagship/") ||
    lower.startsWith("/logo") ||
    lower.startsWith("/icon") ||
    lower === "/favicon.ico"
  );
}

function applyAssetBase(value: string): string {
  if (!configuredAssetBaseUrl) {return value;}
  if (!value.startsWith("/")) {return value;}
  if (isLocalOnlyAssetPath(value)) {return value;}
  return `${configuredAssetBaseUrl}${value}`;
}

function toWebAssetPath(assetPath: string): string {
  const trimmed = String(assetPath || "").trim();
  if (!trimmed) {return "";}
  if (configuredAssetBaseUrl && trimmed.startsWith(configuredAssetBaseUrl)) {
    return trimmed.slice(configuredAssetBaseUrl.length) || "/";
  }
  const absolute = trimmed.match(/^https?:\/\/[^/]+(\/.*)$/i);
  if (absolute) {return absolute[1];}
  return trimmed;
}

/** Catalog objects use `image-N`; normalize stale DB URLs that use bare `N`. */
function normalizeBareCatalogImageName(assetPath: string): string {
  return assetPath.replace(
    /^(https?:\/\/[^/]+)?(\/assets\/catalog\/[^?\s#]*\/)(\d+)(\.(?:webp|png|jpe?g|gif|avif))([?#].*)?$/i,
    (_full, origin: string | undefined, folder: string, index: string, extension: string, suffix: string | undefined) =>
      `${origin ?? ""}${folder}image-${index}${extension}${suffix ?? ""}`,
  );
}

function isServer(): boolean {
  return typeof window === "undefined";
}

// Lazy-loaded Node.js modules (server-only)
let _fs: typeof fsType | null = null;
let _path: typeof pathType | null = null;

/**
 * Server-only FS access via webpack's `__non_webpack_require__`.
 * Do **not** import `node:module` / `createRequire` here — this file is also
 * imported by client components (FilterGrid) and that breaks the browser bundle.
 */
function getFs(): typeof fsType | null {
  if (!isServer()) {return null;}
  if (!_fs) {
    try {
      _fs = __non_webpack_require__("node:fs");
    } catch {
      return null;
    }
  }
  return _fs;
}

function getPath(): typeof pathType | null {
  if (!isServer()) {return null;}
  if (!_path) {
    try {
      _path = __non_webpack_require__("node:path");
    } catch {
      return null;
    }
  }
  return _path;
}

// Declare __non_webpack_require__ for TypeScript (injected by Next/webpack on server)
declare const __non_webpack_require__: NodeRequire;

/** Monorepo root vs `site/` package — static assets live in `site/public`. */
function getPublicDirCandidates(): string[] {
  const pathMod = getPath();
  if (!pathMod) {return [];}

  const cwd = process.cwd();
  const roots = [pathMod.join(cwd, "public")];
  const nested = pathMod.join(cwd, "site", "public");
  if (nested !== roots[0]) {roots.push(nested);}
  return roots;
}

function toPublicFsPaths(assetPath: string): string[] {
  const pathMod = getPath();
  if (!pathMod) {return [];}

  const normalized = assetPath.replace(/^\/+/, "").split("/").join(pathMod.sep);
  return getPublicDirCandidates().map((root) => pathMod.join(root, normalized));
}

function toPublicFsPath(assetPath: string): string | null {
  return toPublicFsPaths(assetPath)[0] ?? null;
}

function localAssetExists(assetPath: string): boolean {
  if (!isServer()) {return false;}
  if (!assetPath.startsWith("/")) {return false;}

  const fsMod = getFs();
  if (!fsMod) {return false;}

  try {
    for (const fsPath of toPublicFsPaths(assetPath)) {
      if (fsMod.existsSync(fsPath)) {return true;}
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Catalog exports often use zero-padded names (`image-01.webp`) while files on disk
 * are unpadded (`image-1.webp` / `image-1.jpg`) — or the reverse. Expand both forms.
 */
function expandImagePathCandidates(assetPath: string): string[] {
  const candidates = [assetPath];
  if (
    /\/assets\/catalog\//i.test(assetPath) &&
    /\/image-/i.test(assetPath) &&
    !/\/gallery\//i.test(assetPath)
  ) {
    const gallery = assetPath.replace(/\/(image-[^/]+)$/i, "/gallery/$1");
    candidates.push(gallery);
    const galleryPadded = gallery.match(/^(.*\/image-)0+(\d+)(\.[a-z0-9]+)$/i);
    if (galleryPadded) {
      candidates.push(
        `${galleryPadded[1]}${Number.parseInt(galleryPadded[2], 10)}${galleryPadded[3]}`,
      );
    }
  }
  const padded = assetPath.match(/^(.*\/image-)0+(\d+)(\.[a-z0-9]+)$/i);
  if (padded) {
    candidates.push(`${padded[1]}${Number.parseInt(padded[2], 10)}${padded[3]}`);
    return candidates;
  }
  // Reverse: catalog unpadded, disk zero-padded (image-1 → image-01).
  const unpadded = assetPath.match(/^(.*\/image-)(\d)(\.[a-z0-9]+)$/i);
  if (unpadded) {
    candidates.push(`${unpadded[1]}0${unpadded[2]}${unpadded[3]}`);
  }
  const bareFromPadded = assetPath.match(/^(.*\/)image-0*(\d+)(\.webp)$/i);
  if (bareFromPadded) {
    candidates.push(`${bareFromPadded[1]}${bareFromPadded[2]}${bareFromPadded[3]}`);
  }
  return candidates;
}

function withAlternateExtensions(assetPath: string): string[] {
  const lower = assetPath.toLowerCase();
  const out = [assetPath];
  if (lower.endsWith(".webp")) {
    out.push(assetPath.replace(/\.webp$/i, ".jpg"));
    out.push(assetPath.replace(/\.webp$/i, ".jpeg"));
    out.push(assetPath.replace(/\.webp$/i, ".png"));
  } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    out.push(assetPath.replace(/\.(jpe?g)$/i, ".webp"));
    out.push(assetPath.replace(/\.(jpe?g)$/i, ".png"));
  } else if (lower.endsWith(".png")) {
    out.push(assetPath.replace(/\.png$/i, ".webp"));
    out.push(assetPath.replace(/\.png$/i, ".jpg"));
  }
  return out;
}

const CATALOG_FAMILIES = [
  "seating",
  "workstations",
  "tables",
  "storage",
  "soft-seating",
  "educational",
  "collaborative",
] as const;

/** Seating subcategory mapping based on material/type. */
const SEATING_LEATHER_SLUGS = new Set([
  "grace",
  "pinnacle",
  "moonlight",
  "rider",
]);

/** DB scrape slug → on-disk / CDN folder when assets live under another SKU. */
const CATALOG_FOLDER_SLUG_ALIASES: Readonly<Record<string, string>> = {
  crox: "oando-seating--crotch",
  "oando-seating--crox": "oando-seating--crotch",
  "cafeteria-seating": "oando-seating--nordic",
  "oando-seating--cafeteria-seating": "oando-seating--nordic",
};

/** Products DB legacy bucket — CDN uses cafe|fabric|leather|mesh only. */
function rewriteLegacyNonLeatherSeatingPath(assetPath: string): string {
  return assetPath.replace(
    /^\/assets\/catalog\/seating\/non-leather\/(oando-seating--[^/]+)/i,
    (_full, sku: string) =>
      `/assets/catalog/seating/${seatingSubcategory(sku)}/${sku}`,
  );
}

function localNonLeatherSeatingFolderExists(sku: string): boolean {
  if (!isServer()) {return false;}
  const fsMod = getFs();
  if (!fsMod) {return false;}
  const dirWeb = `/assets/catalog/seating/non-leather/${sku}`;
  return toPublicFsPaths(dirWeb).some((fsPath) => fsMod.existsSync(fsPath));
}

function seatingSubcategory(skuFolder: string): string {
  const m = skuFolder.match(/^oando-seating--(.+)$/i);
  if (!m) {
    return "mesh"; // default
  }
  const slug = m[1].toLowerCase();
  if (SEATING_LEATHER_SLUGS.has(slug)) return "leather";
  // Cafe chairs
  if (["cafe-sleek", "caneva", "caneva-high", "casca", "fusion", "fynn", "halo", "leaf", "lexus", "lisbo", "nordic", "rio", "smile", "snap", "zilo"].includes(slug)) return "cafe";
  // Fabric chairs
  if (["arvo", "brim", "canaret", "copse", "crotch", "crox", "dive", "ember", "flare", "flip"].includes(slug)) return "fabric";
  // Mesh chairs (default for office chairs)
  return "mesh";
}

/**
 * Nest flat `/assets/catalog/oando-{family}--slug/…` under `/assets/catalog/{family}/…`.
 * Seating nests under subcategories: cafe, fabric, leather, mesh.
 */
function nestOandoCatalogPath(assetPath: string): string {
  // Already nested with subcategory: /assets/catalog/seating/{cafe|fabric|leather|mesh}/oando-…
  if (
    /\/assets\/catalog\/seating\/(cafe|fabric|leather|mesh)\/oando-seating--/i.test(
      assetPath,
    )
  ) {
    return assetPath;
  }

  // Family-nested seating without subcategory: seating/oando-seating--x → seating/{subcategory}/x
  const seatingNested = assetPath.match(
    /^(\/assets\/catalog\/seating\/)(oando-seating--[^/]+)(\/.*)?$/i,
  );
  if (seatingNested) {
    const subcat = seatingSubcategory(seatingNested[2]);
    return `${seatingNested[1]}${subcat}/${seatingNested[2]}${seatingNested[3] ?? ""}`;
  }

  const m = assetPath.match(
    /^(\/assets\/catalog\/)(oando-([a-z0-9-]+)--[^/]+)(\/.*)?$/i,
  );
  if (!m) {
    return assetPath;
  }
  const fam = m[3].toLowerCase();
  if (!(CATALOG_FAMILIES as readonly string[]).includes(fam)) {
    return assetPath;
  }
  // Already nested under family (non-seating): /assets/catalog/tables/oando-tables--x
  if (
    fam !== "seating" &&
    assetPath.toLowerCase().includes(`/catalog/${fam}/oando-`)
  ) {
    return assetPath;
  }
  if (fam === "seating") {
    const subcat = seatingSubcategory(m[2]);
    return `${m[1]}seating/${subcat}/${m[2]}${m[4] ?? ""}`;
  }
  return `${m[1]}${fam}/${m[2]}${m[4] ?? ""}`;
}

/** Catalog photography is CDN-hosted when not present in site/public. */
function shouldPreferCdnFallback(assetPath: string): boolean {
  const lower = assetPath.toLowerCase();
  // Canonical published catalog tree — CDN may have assets not in git.
  return (
    lower.startsWith("/assets/catalog/oando-") ||
    /\/assets\/catalog\/(seating\/(?:cafe|fabric|leather|mesh|non-leather)|workstations|tables|storage|soft-seating|educational|collaborative)\/oando-/i.test(
      lower,
    ) ||
    /\/assets\/catalog\/seating\/oando-/i.test(lower)
  );
}

function resolveCdnBackedImageVariant(assetPath: string): string | null {
  if (!shouldPreferCdnFallback(assetPath)) {
    return null;
  }

  // Keep the canonical web path (webp, SKU-root layout). Worker / local catalog
  // route resolve R2 key aliases — do not force gallery/ or .jpg here.
  return assetPath;
}

/**
 * When image-N is missing but the product folder has other image-* files, pick the
 * nearest lower index (else first). Server-only — needs directory listing.
 */
function resolveNearestSiblingImage(assetPath: string): string | null {
  const fsMod = getFs();
  const pathMod = getPath();
  if (!fsMod || !pathMod) {return null;}

  const match = assetPath.match(/^(.*\/)(image-)0*(\d+)(\.[a-z0-9]+)$/i);
  if (!match) {return null;}

  const dirWeb = match[1].replace(/\/+$/, "");
  const requested = Number.parseInt(match[3], 10);
  if (!Number.isFinite(requested)) {return null;}

  const dirFsCandidates = toPublicFsPaths(dirWeb);
  const dirFs = dirFsCandidates.find((candidate) => fsMod.existsSync(candidate));
  if (!dirFs) {return null;}

  let entries: string[];
  try {
    entries = fsMod.readdirSync(dirFs);
  } catch {
    return null;
  }

  const numbered = entries
    .map((file) => {
      const m = file.match(/^image-0*(\d+)\.[a-z0-9]+$/i);
      if (!m) {return null;}
      return {
        number: Number.parseInt(m[1], 10),
        webPath: `${dirWeb}/${file}`,
      };
    })
    .filter((row): row is { number: number; webPath: string } => row !== null)
    .sort((a, b) => a.number - b.number);

  if (numbered.length === 0) {return null;}

  const exact = numbered.find((row) => row.number === requested);
  if (exact && localAssetExists(exact.webPath)) {return exact.webPath;}

  const lowerOrEqual = [...numbered].reverse().find((row) => row.number <= requested);
  if (lowerOrEqual && localAssetExists(lowerOrEqual.webPath)) {return lowerOrEqual.webPath;}

  const first = numbered[0];
  return first && localAssetExists(first.webPath) ? first.webPath : null;
}

function resolveLocalImageVariant(assetPath: string, probeDisk: boolean): string {
  const numbered = expandImagePathCandidates(assetPath);

  // Client + SSR of client components: deterministic paths only (hydration-safe).
  if (!probeDisk || !isServer()) {
    return stripErroneousCatalogGallery(assetPath);
  }

  for (const base of numbered) {
    for (const candidate of withAlternateExtensions(base)) {
      if (localAssetExists(candidate)) {return candidate;}
    }
  }

  // Same folder, different index (e.g. catalog image-1, disk only image-2.jpg).
  const sibling = resolveNearestSiblingImage(assetPath);
  if (sibling) {return sibling;}

  const cdnCandidate = resolveCdnBackedImageVariant(assetPath);
  if (cdnCandidate) {return cdnCandidate;}

  if (shouldPreferCdnFallback(assetPath)) {
    return assetPath;
  }

  // Raster fallback only — next/image returns 400 for SVG by default (black cards).
  return PRODUCT_IMAGE_FALLBACK;
}

/**
 * next/image-safe placeholder (not SVG). Fallback folder was intentionally
 * removed — use brand mark that ships under marketing/brand/logos.
 */
export const PRODUCT_IMAGE_FALLBACK =
  "/assets/marketing/brand/logos/logo-sharp.png";

/**
 * Canonical marketing remaps after intentional prune (no installs/fallback/
 * montage; heroes live under pages|slides; project heroes use real files).
 */
const MARKETING_PATH_ALIASES: Readonly<Record<string, string>> = {
  // Hero carousel / pages (renamed *-oneandonly + AI enhance)
  "/assets/marketing/hero/slides/hero-1.webp":
    "/assets/marketing/hero/pages/Planner-oneandonly.webp",
  "/assets/marketing/hero/slides/hero-2.webp":
    "/assets/marketing/hero/pages/about-oneandonly.webp",
  "/assets/marketing/hero/slides/hero-3.webp":
    "/assets/marketing/hero/pages/Other3-oneandonly.webp",
  "/assets/marketing/hero/slides/hero-4.webp":
    "/assets/marketing/hero/pages/Other3-oneandonly.webp",
  "/assets/marketing/hero/slides/hero-5.webp":
    "/assets/marketing/hero/pages/Spare/hero-5.webp",
  "/assets/marketing/hero/hero-1.webp":
    "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp",
  "/assets/marketing/hero/hero-2.webp":
    "/assets/marketing/hero/pages/about-oneandonly-bright.webp",
  "/assets/marketing/hero/slides/home-poster.webp":
    "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp",
  "/assets/marketing/hero/admin-entry-poster.webp":
    "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/career-poster.webp":
    "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/service-poster.webp":
    "/assets/marketing/hero/pages/solutions-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/showrooms-poster.webp":
    "/assets/marketing/hero/pages/Other3-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/hero-1.webp":
    "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/hero-2.webp":
    "/assets/marketing/hero/pages/about-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/hero-5.webp":
    "/assets/marketing/hero/pages/Other3-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/about-story.webp":
    "/assets/marketing/hero/pages/about-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/contact-poster.webp":
    "/assets/marketing/hero/pages/contact-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/solutions-poster.webp":
    "/assets/marketing/hero/pages/solutions-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/trusted-by-poster.webp":
    "/assets/marketing/hero/pages/Other3-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/planning-poster.webp":
    "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/downloads-poster.webp":
    "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp",
  "/assets/marketing/hero/slides/downloads-poster.webp":
    "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp",
  // Non-bright page files → bright (slight lift)
  "/assets/marketing/hero/pages/about-oneandonly.webp":
    "/assets/marketing/hero/pages/about-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/contact-oneandonly.webp":
    "/assets/marketing/hero/pages/contact-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/other-oneandonly.webp":
    "/assets/marketing/hero/pages/about-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/other-oneandonly-bright.webp":
    "/assets/marketing/hero/pages/about-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/Other2-oneandonly.webp":
    "/assets/marketing/hero/pages/Other3-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/Other2-oneandonly-bright.webp":
    "/assets/marketing/hero/pages/Other3-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/Other3-oneandonly.webp":
    "/assets/marketing/hero/pages/Other3-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/Planner-oneandonly.webp":
    "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/solutions-oneandonly.webp":
    "/assets/marketing/hero/pages/solutions-oneandonly-bright.webp",
  "/assets/marketing/hero/27-06-2025 Image 03.webp":
    "/assets/marketing/hero/slides/TVS-Oneandonly.webp",
  "/assets/marketing/hero/27-06-2025 Image 06.webp":
    "/assets/marketing/hero/slides/TVS2-Oneandonly.webp",
  "/assets/marketing/hero/slides/27-06-2025 Image 03.webp":
    "/assets/marketing/hero/slides/TVS-Oneandonly.webp",
  "/assets/marketing/hero/slides/27-06-2025 Image 06.webp":
    "/assets/marketing/hero/slides/TVS2-Oneandonly.webp",
  "/assets/marketing/hero/slides/titan-hero.webp":
    "/assets/marketing/hero/slides/Titan-Oneandonly-bright.webp",
  "/assets/marketing/hero/slides/titan-patna-hq.webp":
    "/assets/marketing/hero/slides/Titan-Oneandonly-bright.webp",
  "/assets/marketing/hero/slides/tvs-patna-hq.webp":
    "/assets/marketing/hero/slides/TVS-Oneandonly-bright.webp",
  "/assets/marketing/hero/slides/tvs-patna-enhanced.webp":
    "/assets/marketing/hero/slides/TVS3-Oneandonly-bright.webp",
  "/assets/marketing/hero/slides/trusted-by-poster.webp":
    "/assets/marketing/hero/slides/Usha-Oneandonly-bright.webp",
  "/assets/marketing/hero/slides/dmrc.webp":
    "/assets/marketing/hero/slides/Dmrc-Oneandonly-bright.webp",
  "/assets/marketing/hero/slides/Dmrc-Oneandonly.webp":
    "/assets/marketing/hero/slides/Dmrc-Oneandonly-bright.webp",
  "/assets/marketing/hero/slides/Titan-Oneandonly.webp":
    "/assets/marketing/hero/slides/Titan-Oneandonly-bright.webp",
  "/assets/marketing/hero/slides/Titan2-Oneandonly.webp":
    "/assets/marketing/hero/slides/Titan2-Oneandonly-bright.webp",
  "/assets/marketing/hero/slides/TVS-Oneandonly.webp":
    "/assets/marketing/hero/slides/TVS-Oneandonly-bright.webp",
  "/assets/marketing/hero/slides/TVS2-Oneandonly.webp":
    "/assets/marketing/hero/slides/TVS2-Oneandonly-bright.webp",
  "/assets/marketing/hero/slides/TVS3-Oneandonly.webp":
    "/assets/marketing/hero/slides/TVS3-Oneandonly-bright.webp",
  "/assets/marketing/hero/slides/Usha-Oneandonly.webp":
    "/assets/marketing/hero/slides/Usha-Oneandonly-bright.webp",
  // Installs → slides / project stills (installs/ removed on purpose)
  "/assets/marketing/hero/installs/titan-patna-hero.webp":
    "/assets/marketing/hero/slides/Titan-Oneandonly-bright.webp",
  "/assets/marketing/hero/installs/titan-patna-hq.webp":
    "/assets/marketing/hero/slides/Titan-Oneandonly-bright.webp",
  "/assets/marketing/hero/installs/titan-patna-enhanced.webp":
    "/assets/marketing/hero/slides/Titan-Oneandonly-bright.webp",
  "/assets/marketing/hero/installs/tvs-patna-hero.webp":
    "/assets/marketing/hero/slides/TVS-Oneandonly-bright.webp",
  "/assets/marketing/hero/installs/tvs-patna-enhanced.webp":
    "/assets/marketing/hero/slides/TVS3-Oneandonly-bright.webp",
  "/assets/marketing/hero/installs/tvs-patna-hq.webp":
    "/assets/marketing/hero/slides/TVS-Oneandonly-bright.webp",
  "/assets/marketing/hero/installs/dmrc-hero.webp":
    "/assets/marketing/clients/DMRC/dmrc-1.webp",
  "/assets/marketing/hero/dmrc-hero.webp":
    "/assets/marketing/clients/DMRC/dmrc-1.webp",
  "/assets/marketing/hero/installs/usha-hero.webp":
    "/assets/marketing/clients/Usha/hero.webp",
  "/assets/marketing/hero/installs/franklin-hero.webp":
    "/assets/marketing/clients/FranklinTempleton/franklin-templeton-office.webp",
  // Projects → enhanced clients tree
  "/assets/marketing/projects/DMRC/hero.webp":
    "/assets/marketing/clients/DMRC/dmrc-1.webp",
  "/assets/marketing/projects/DMRC/dmrc-1.webp":
    "/assets/marketing/clients/DMRC/dmrc-1.webp",
  "/assets/marketing/projects/DMRC/dmrc-facility.webp":
    "/assets/marketing/clients/DMRC/dmrc-office-01.webp",
  "/assets/marketing/projects/Titan/hero.jpg":
    "/assets/marketing/clients/Titan/hero.webp",
  "/assets/marketing/projects/Titan/hero.webp":
    "/assets/marketing/clients/Titan/hero.webp",
  "/assets/marketing/projects/TVS/hero.webp":
    "/assets/marketing/clients/TVS/tvs.webp",
  "/assets/marketing/projects/TVS/tvs.png":
    "/assets/marketing/clients/TVS/tvs.webp",
  "/assets/marketing/projects/TVS/tvs.webp":
    "/assets/marketing/clients/TVS/tvs.webp",
  "/assets/marketing/projects/Usha/hero.jpg":
    "/assets/marketing/clients/Usha/hero.webp",
  "/assets/marketing/projects/Usha/hero.webp":
    "/assets/marketing/clients/Usha/hero.webp",
  "/assets/marketing/projects/Usha/DSC_0077_edited.jpg":
    "/assets/marketing/clients/Usha/DSC_0077_edited.webp",
  "/assets/marketing/projects/Usha/DSC_0077_edited.webp":
    "/assets/marketing/clients/Usha/DSC_0077_edited.webp",
  "/assets/marketing/projects/FranklinTempleton/franklin-templeton-office.webp":
    "/assets/marketing/clients/FranklinTempleton/franklin-templeton-office.webp",
  "/assets/marketing/projects/Titan/27-06-2025 Image 05_edited_edited.webp":
    "/assets/marketing/clients/Titan/titan-gallery.webp",
  "/assets/marketing/projects/project-gallery-01.webp":
    "/assets/marketing/clients/DMRC/dmrc-office-01.webp",
  "/assets/marketing/projects/project-gallery-02.webp":
    "/assets/marketing/clients/Titan/project-gallery-02.webp",
  // Brand logos (canonical under brand/logos/)
  "/logo-v2.webp":
    "/assets/marketing/brand/logos/logo-sharp.png",
  "/logo.webp":
    "/assets/marketing/brand/logos/logo-sharp.png",
  "/icon.png":
    "/assets/marketing/brand/logos/logo-sharp.png",
  "/assets/marketing/brand/logo-sharp-white.png":
    "/assets/marketing/brand/logos/logo-sharp-white.png",
  "/assets/marketing/brand/logo-sharp.webp":
    "/assets/marketing/brand/logos/logo-sharp.png",
  "/assets/marketing/brand/logos/logo-sharp.webp":
    "/assets/marketing/brand/logos/logo-sharp.png",
  "/assets/marketing/brand/logos/logo-sharp-white.webp":
    "/assets/marketing/brand/logos/logo-sharp-white.png",
  "/assets/marketing/brand/logos/catalog-logo.webp":
    "/assets/marketing/brand/logos/logo-sharp.png",
  "/assets/marketing/brand/logos/catalog-logo.png":
    "/assets/marketing/brand/logos/logo-sharp.png",
  // Removed fallback tree
  "/assets/marketing/fallback/placeholders/product-placeholder.png":
    PRODUCT_IMAGE_FALLBACK,
  "/assets/marketing/fallback/placeholders/product-placeholder.webp":
    PRODUCT_IMAGE_FALLBACK,
  "/assets/marketing/fallback/product-placeholder.png": PRODUCT_IMAGE_FALLBACK,
  "/assets/marketing/fallback/product-placeholder.webp": PRODUCT_IMAGE_FALLBACK,
  "/assets/marketing/fallback/category.png": PRODUCT_IMAGE_FALLBACK,
  "/assets/marketing/fallback/category.webp": PRODUCT_IMAGE_FALLBACK,
  "/assets/marketing/fallback/category.svg": PRODUCT_IMAGE_FALLBACK,
};

/**
 * Deep folder rearrange (marketing/planner/catalog sub-sub folders).
 * Keeps old short paths resolving after multi-level arrange.
 */
function rewriteDeepAssetFolders(assetPath: string): string {
  let p = assetPath;

  const aliased = MARKETING_PATH_ALIASES[p];
  if (aliased) {
    p = aliased;
  }

  // flagship/seating.webp → flagship/categories/seating.webp
  p = p.replace(
    /^(\/assets\/catalog\/flagship\/)(?!categories\/)([^/]+)$/i,
    "$1categories/$2",
  );

  // fallback/* removed — map any leftover to brand mark
  if (/^\/assets\/marketing\/fallback\//i.test(p)) {
    return PRODUCT_IMAGE_FALLBACK;
  }

  // client-logos: flat files only (no Brand/ subdirs)
  // client-logos/Titan/Titan.png → client-logos/Titan.png
  p = p.replace(
    /^(\/assets\/marketing\/client-logos\/)([^/]+)\/\2\.(webp|png|jpe?g)$/i,
    "$1$2.$3",
  );

  // hero flat file → pages | slides (installs/ removed)
  const heroFlat = p.match(/^\/assets\/marketing\/hero\/([^/]+)$/i);
  if (heroFlat) {
    const name = heroFlat[1];
    const n = name.toLowerCase();
    let sub = "pages";
    if (/^hero[- ]?\d|^hero copy|^home-poster/i.test(n)) sub = "pages";
    else if (
      /titan|tvs|dmrc|usha|franklin|patna|27-06-2025/i.test(n) &&
      !/poster/i.test(n)
    ) {
      sub = "slides";
    }
    p = `/assets/marketing/hero/${sub}/${name}`;
    const afterHero = MARKETING_PATH_ALIASES[p];
    if (afterHero) p = afterHero;
  }

  // hero/installs/* → slides or project stills via alias table (above) or slides/
  p = p.replace(
    /^\/assets\/marketing\/hero\/installs\/([^/]+)$/i,
    "/assets/marketing/hero/slides/$1",
  );
  {
    const afterInstall = MARKETING_PATH_ALIASES[p];
    if (afterInstall) p = afterInstall;
  }

  // brand/logo → brand/logos/logo
  p = p.replace(
    /^(\/assets\/marketing\/brand\/)(?!logos\/)([^/]+)$/i,
    "$1logos/$2",
  );
  p = p.replace(
    /^(\/assets\/marketing\/partners\/)(?!logos\/)([^/]+)$/i,
    "$1logos/$2",
  );
  p = p.replace(
    /^(\/assets\/marketing\/team\/)(?!portraits\/)([^/]+)$/i,
    "$1portraits/$2",
  );
  p = p.replace(
    /^(\/assets\/marketing\/montage\/)(?!items\/)([^/]+)$/i,
    "$1items/$2",
  );

  // SKU root image-N → gallery/image-N only when disk already uses gallery/ (legacy).
  // Clean R2 layout keeps images at SKU root — do not force gallery/ here.

  // planner media flat
  p = p.replace(
    /^(\/assets\/planner\/media\/)(?!video\/|posters\/|landing\/)([^/]+\.mp4)$/i,
    "$1video/$2",
  );
  p = p.replace(
    /^(\/assets\/planner\/media\/)(?!video\/|posters\/|landing\/)([^/]*poster[^/]*)$/i,
    "$1posters/$2",
  );

  return p;
}

/**
 * Clean R2 layout stores image-N at the SKU root — strip erroneous gallery/ (DB leftovers).
 */
function stripErroneousCatalogGallery(assetPath: string): string {
  if (!/\/gallery\//i.test(assetPath)) {
    return assetPath;
  }
  if (!/\/assets\/catalog\//i.test(assetPath)) {
    return assetPath;
  }
  return assetPath.replace(/\/gallery\//gi, "/");
}

/** CDN/R2 clean layout uses SKU-root images — strip gallery/ before publishing URLs. */
function toPublishedCatalogAssetPath(assetPath: string): string {
  if (!shouldPreferCdnFallback(assetPath)) {
    return assetPath;
  }
  return stripErroneousCatalogGallery(assetPath);
}

export type NormalizeAssetPathOptions = {
  /**
   * When true, probe site/public on the server for existing variants/siblings.
   * Default false — safe for client components (SSR + hydration must match).
   * Server-only catalog/API callers pass true when disk truth is required.
   */
  probeDisk?: boolean;
};

export function normalizeAssetPath(
  assetPath: string | null | undefined,
  options?: NormalizeAssetPathOptions,
): string {
  if (!assetPath) {return "";}
  const probeDisk = options?.probeDisk === true;
  const normalized = normalizeBareCatalogImageName(String(assetPath).trim());
  if (!normalized) {return "";}
  if (hasAbsoluteUrl(normalized)) {return normalized;}
  const hasImageExtension = /\.(webp|png|jpe?g|gif|avif|svg)$/i.test(normalized);
  let candidatePath = normalized;
  let candidateLower = candidatePath.toLowerCase();

  // One-shot hard cut: historical `/images/*` and `/media/*` → `/assets/*`.
  // Not a long-lived dual alias — DB leftovers and old fixtures still resolve once.
  if (
    candidateLower.startsWith("/images/") ||
    candidateLower.startsWith("/media/hero/") ||
    candidateLower.startsWith("/media/planner/")
  ) {
    candidatePath = rewriteLegacyPublicImagePath(candidatePath);
    candidateLower = candidatePath.toLowerCase();
  }

  // Multi-level arrange: marketing/catalog/planner sub-sub folders
  if (candidateLower.startsWith("/assets/")) {
    candidatePath = rewriteDeepAssetFolders(candidatePath);
    candidateLower = candidatePath.toLowerCase();
  }

  // Legacy homepage content used `/products/*.webp` while static files are under `/assets/catalog/products/*`.
  if (hasImageExtension && candidateLower.startsWith("/products/")) {
    candidatePath = `/assets/catalog/products/${candidatePath.slice("/products/".length)}`;
    candidateLower = candidatePath.toLowerCase();
  }

  // Legacy scrape tree `/images/chairs/{slug}/` or `/assets/catalog/chairs/{slug}/` → seating folders.
  const legacyChairMatch = candidatePath.match(
    /^\/(?:images\/chairs|assets\/catalog\/chairs)\/([^/]+)\/(image-[^/]+)$/i,
  );
  if (legacyChairMatch) {
    candidatePath = `/assets/catalog/seating/oando-seating--${legacyChairMatch[1]}/${legacyChairMatch[2]}`;
    candidateLower = candidatePath.toLowerCase();
  }

  // Flat oando folders → nested family dirs (phase 03 structure).
  if (candidateLower.startsWith("/assets/catalog/oando-")) {
    candidatePath = nestOandoCatalogPath(candidatePath);
    candidateLower = candidatePath.toLowerCase();
  }

  // After chairs/nest rewrites, apply gallery/ deep paths again.
  if (candidateLower.startsWith("/assets/catalog/")) {
    candidatePath = rewriteDeepAssetFolders(candidatePath);
    candidateLower = candidatePath.toLowerCase();
  }

  const legacyNonLeather = candidatePath.match(
    /^\/assets\/catalog\/seating\/non-leather\/(oando-seating--[^/]+)/i,
  );
  if (legacyNonLeather) {
    const sku = legacyNonLeather[1];
    const keepLegacy =
      probeDisk && isServer() && localNonLeatherSeatingFolderExists(sku);
    if (!keepLegacy) {
      candidatePath = rewriteLegacyNonLeatherSeatingPath(candidatePath);
      candidateLower = candidatePath.toLowerCase();
    }
  }

  // CMS folder slugs (e.g. sleek-workstation) → canonical oando-* catalog dirs on disk.
  // Match both flat and nested: /assets/catalog/{folder}/image-N or /assets/catalog/{fam}/{folder}/image-N
  const catalogFolderMatch = candidatePath.match(
    /^(\/assets\/catalog\/(?:(?:seating|workstations|tables|storage|soft-seating|educational|collaborative)\/)?)([^/]+)(\/image-[^/]+)$/i,
  );
  if (catalogFolderMatch && probeDisk && isServer()) {
    const resolvedFolder = resolveCatalogFolderWebPath(catalogFolderMatch[2]);
    if (resolvedFolder) {
      candidatePath = `${resolvedFolder}${catalogFolderMatch[3]}`;
      candidateLower = candidatePath.toLowerCase();
    }
  }

  // Canonicalize legacy placeholder paths → raster next/image-safe fallback.
  if (
    candidateLower === "/assets/marketing/fallback/category.webp" ||
    candidateLower === "/assets/marketing/fallback/category.svg" ||
    candidateLower === "/assets/marketing/fallback/category.png"
  ) {
    return applyAssetBase(PRODUCT_IMAGE_FALLBACK);
  }

  // Phoenix seating assets are currently repo-backed as JPG files only.
  if (
    /\/assets\/catalog\/(?:seating\/)?oando-seating--phoenix\/(?:gallery\/)?image-/i.test(
      candidateLower,
    ) &&
    candidateLower.endsWith(".webp")
  ) {
    const match = candidateLower.match(/image-0*(\d+)\.webp$/);
    const imageIndex = match ? Number.parseInt(match[1], 10) : Number.NaN;
    if (Number.isNaN(imageIndex) || imageIndex < 1 || imageIndex > 3) {
      return applyAssetBase(PRODUCT_IMAGE_FALLBACK);
    }
    return applyAssetBase(
      toPublishedCatalogAssetPath(
        `/assets/catalog/seating/oando-seating--phoenix/gallery/image-${imageIndex}.jpg`,
      ),
    );
  }

  // Project install photography — repo-backed under site/public (not CDN catalog).
  if (candidateLower.startsWith("/assets/marketing/projects/")) {
    if (isServer()) {
      for (const base of expandImagePathCandidates(candidatePath)) {
        for (const candidate of withAlternateExtensions(base)) {
          if (localAssetExists(candidate)) {
            return applyAssetBase(candidate);
          }
        }
      }
    }
    return applyAssetBase(candidatePath);
  }

  // Resolve to an existing local variant when possible.
  if (candidatePath.startsWith("/assets/") && hasImageExtension) {
    const resolvedVariant = resolveLocalImageVariant(candidatePath, probeDisk);
    if (!resolvedVariant) {return applyAssetBase(PRODUCT_IMAGE_FALLBACK);}
    return applyAssetBase(toPublishedCatalogAssetPath(resolvedVariant));
  }

  return applyAssetBase(toPublishedCatalogAssetPath(candidatePath));
}

/**
 * Map pre-cutover public URLs to the locked `/assets/{marketing|catalog}/…` layout.
 * Input only — callers should persist rewritten paths; do not dual-serve `/images`.
 */
function rewriteLegacyPublicImagePath(assetPath: string): string {
  const lower = assetPath.toLowerCase();
  if (lower.startsWith("/media/hero/")) {
    return `/assets/marketing/hero/${assetPath.slice("/media/hero/".length)}`;
  }
  if (lower.startsWith("/media/planner/")) {
    return `/assets/planner/media/${assetPath.slice("/media/planner/".length)}`;
  }
  if (!lower.startsWith("/images/")) {
    return assetPath;
  }

  const rest = assetPath.slice("/images/".length);
  const slash = rest.indexOf("/");
  const head = (slash === -1 ? rest : rest.slice(0, slash)).toLowerCase();
  const tail = slash === -1 ? "" : rest.slice(slash + 1);

  const marketingHeads = new Set([
    "hero",
    "client-logos",
    "projects",
    "fallback",
    "home",
    "brand",
    "team",
    "partners",
    "montage",
    "clients",
  ]);
  const catalogHeads = new Set([
    "catalog",
    "products",
    "chairs",
    "tables",
    "storage",
    "workstations",
    "educational",
    "soft-seating",
    "collaborative",
  ]);

  // Historical export tree segment "afc" → catalog.
  const legacySegment = String.fromCharCode(97, 102, 99);
  if (head === legacySegment) {
    return tail ? `/assets/catalog/${tail}` : "/assets/catalog";
  }
  if (head === "products") {
    return tail ? `/assets/catalog/products/${tail}` : "/assets/catalog/products";
  }
  if (head === "catalog") {
    return tail ? `/assets/catalog/${tail}` : "/assets/catalog";
  }
  if (head === "clients") {
    return tail ? `/assets/marketing/client-logos/${tail}` : "/assets/marketing/client-logos";
  }
  if (marketingHeads.has(head)) {
    return tail ? `/assets/marketing/${head}/${tail}` : `/assets/marketing/${head}`;
  }
  if (catalogHeads.has(head)) {
    return tail ? `/assets/catalog/${head}/${tail}` : `/assets/catalog/${head}`;
  }
  // Unknown historical prefix — park under marketing so paths are not dual-rooted.
  return tail ? `/assets/marketing/${head}/${tail}` : `/assets/marketing/${head}`;
}

export function normalizeAssetList(
  values: Array<string | null | undefined> | null | undefined,
  options?: NormalizeAssetPathOptions,
): string[] {
  if (!Array.isArray(values)) {return [PRODUCT_IMAGE_FALLBACK];}
  const resolved = values
    .map((value) => normalizeAssetPath(value, options))
    .filter(Boolean) as string[];
  return resolved.length > 0 ? resolved : [PRODUCT_IMAGE_FALLBACK];
}

/** True when path is (or ends as) the raster product placeholder. */
export function isProductImageFallback(assetPath: string | null | undefined): boolean {
  if (!assetPath) {return true;}
  const lower = String(assetPath).toLowerCase();
  return (
    lower.endsWith("/assets/marketing/fallback/product-placeholder.png") ||
    lower.endsWith("/assets/marketing/fallback/product-placeholder.webp") ||
    lower.endsWith("/assets/marketing/fallback/placeholders/product-placeholder.png") ||
    lower.endsWith("/assets/marketing/fallback/placeholders/product-placeholder.webp") ||
    lower === PRODUCT_IMAGE_FALLBACK ||
    lower.endsWith("product-placeholder.png") ||
    lower.endsWith("product-placeholder.webp")
  );
}

function catalogFolderSlugCandidates(slug: string): string[] {
  const trimmed = String(slug || "").trim();
  if (!trimmed) {return [];}

  const candidates = [trimmed];
  const folderAlias = CATALOG_FOLDER_SLUG_ALIASES[trimmed];
  if (folderAlias) {
    candidates.push(folderAlias);
  }
  if (!trimmed.includes("--")) {
    for (const family of CATALOG_FAMILIES) {
      candidates.push(`oando-${family}--${trimmed}`);
    }
  }
  if (trimmed.endsWith("-workstation")) {
    candidates.push(trimmed.replace(/-workstation$/i, ""));
  }
  if (trimmed.endsWith("-chair")) {
    candidates.push(trimmed.replace(/-chair$/i, ""));
  }
  return Array.from(new Set(candidates));
}

/**
 * Resolve on-disk catalog folder for a product slug (server FS).
 * Prefer exact `/assets/catalog/{slug}`; else unique folder ending `--{slug}`.
 */
function resolveCatalogFolderWebPath(slug: string): string | null {
  const fsMod = getFs();
  const pathMod = getPath();
  if (!fsMod || !pathMod) {return null;}

  for (const candidateSlug of catalogFolderSlugCandidates(slug)) {
    const nestedGuess = nestOandoCatalogPath(`/assets/catalog/${candidateSlug}`);
    const seatingSku =
      candidateSlug.startsWith("oando-seating--")
        ? candidateSlug
        : `oando-seating--${candidateSlug}`;
    for (const exactDir of [
      nestedGuess,
      `/assets/catalog/${candidateSlug}`,
      `/assets/catalog/seating/leather/${seatingSku}`,
      `/assets/catalog/seating/non-leather/${seatingSku}`,
      ...CATALOG_FAMILIES.map((fam) => `/assets/catalog/${fam}/${candidateSlug}`),
    ]) {
      for (const exactFs of toPublicFsPaths(exactDir)) {
        if (fsMod.existsSync(exactFs)) {return exactDir;}
      }
    }

    const suffix = `--${candidateSlug}`;
    for (const catalogRoot of getPublicDirCandidates().map((root) =>
      pathMod.join(root, "assets", "catalog"),
    )) {
      if (!fsMod.existsSync(catalogRoot)) {continue;}

      // Seating material buckets (leather | non-leather)
      for (const bucket of ["leather", "non-leather"] as const) {
        const bucketFs = pathMod.join(catalogRoot, "seating", bucket);
        if (!fsMod.existsSync(bucketFs)) {continue;}
        let bucketEntries: string[];
        try {
          bucketEntries = fsMod.readdirSync(bucketFs);
        } catch {
          continue;
        }
        const bucketMatches = bucketEntries.filter(
          (name) => name === candidateSlug || name.endsWith(suffix) || name === seatingSku,
        );
        if (bucketMatches.length === 1) {
          return `/assets/catalog/seating/${bucket}/${bucketMatches[0]}`;
        }
      }

      // Scan family subdirs first (phase 03 nested layout).
      for (const fam of CATALOG_FAMILIES) {
        const famFs = pathMod.join(catalogRoot, fam);
        if (!fsMod.existsSync(famFs)) {continue;}
        let famEntries: string[];
        try {
          famEntries = fsMod.readdirSync(famFs);
        } catch {
          continue;
        }
        const famMatches = famEntries.filter(
          (name) => name === candidateSlug || name.endsWith(suffix),
        );
        if (famMatches.length === 1) {
          return `/assets/catalog/${fam}/${famMatches[0]}`;
        }
      }

      let entries: string[];
      try {
        entries = fsMod.readdirSync(catalogRoot);
      } catch {
        continue;
      }

      const matches = entries.filter((name) => name === candidateSlug || name.endsWith(suffix));
      if (matches.length === 1) {
        return nestOandoCatalogPath(`/assets/catalog/${matches[0]}`);
      }
    }
  }

  return null;
}

/**
 * List numbered image-* files in a product catalog folder (server).
 * Empty on client or when folder missing — callers keep path-normalize fallbacks.
 */
export function listCatalogSlugImages(slug: string | null | undefined): string[] {
  if (!isServer()) {return [];}
  const folder = resolveCatalogFolderWebPath(String(slug || "").trim());
  if (!folder) {return [];}

  const fsMod = getFs();
  const pathMod = getPath();
  const dirFs = toPublicFsPath(folder);
  if (!fsMod || !dirFs || !fsMod.existsSync(dirFs)) {return [];}

  // Prefer gallery/ subfolder (multi-level CDN layout); fall back to SKU root.
  const galleryFs = pathMod ? pathMod.join(dirFs, "gallery") : `${dirFs}/gallery`;
  const scanFs =
    fsMod.existsSync(galleryFs) && fsMod.statSync(galleryFs).isDirectory()
      ? galleryFs
      : dirFs;
  const webBase =
    scanFs === galleryFs ? `${folder.replace(/\/+$/, "")}/gallery` : folder;

  let entries: string[];
  try {
    entries = fsMod.readdirSync(scanFs);
  } catch {
    return [];
  }

  return entries
    .map((file) => {
      const m = file.match(/^image-0*(\d+)\.([a-z0-9]+)$/i);
      if (!m) {return null;}
      return {
        number: Number.parseInt(m[1], 10),
        webPath: `${webBase}/${file}`,
      };
    })
    .filter((row): row is { number: number; webPath: string } => row !== null)
    .sort((a, b) => a.number - b.number)
    .map((row) => row.webPath)
    .filter((webPath) => localAssetExists(webPath));
}

function catalogFolderWebPathCandidates(slug: string): string[] {
  const trimmed = String(slug || "").trim();
  if (!trimmed) {return [];}

  const folders: string[] = [];
  const slugCandidates = catalogFolderSlugCandidates(trimmed);
  const catalogFamilies = [
    "oando-seating",
    "oando-tables",
    "oando-storage",
    "oando-workstations",
    "oando-soft-seating",
    "oando-educational",
    "oando-collaborative",
  ] as const;

  for (const candidateSlug of slugCandidates) {
    const resolved = resolveCatalogFolderWebPath(candidateSlug);
    if (resolved) {
      folders.push(resolved);
      continue;
    }

    if (!candidateSlug.includes("--")) {
      for (const family of catalogFamilies) {
        const flat = `/assets/catalog/${family}--${candidateSlug}`;
        folders.push(nestOandoCatalogPath(flat));
        folders.push(flat);
      }
    } else {
      folders.push(nestOandoCatalogPath(`/assets/catalog/${candidateSlug}`));
      folders.push(`/assets/catalog/${candidateSlug}`);
    }
  }

  return Array.from(new Set(folders));
}

function probeCdnCatalogImage(folderWebPath: string): string | null {
  const imageNames: string[] = [];
  for (let i = 1; i <= 15; i += 1) {
    imageNames.push(`${i}.webp`);
    const padded = String(i).padStart(2, "0");
    imageNames.push(`image-${i}.webp`, `image-${padded}.webp`);
  }
  imageNames.push(
    "image-1.jpg",
    "image-01.jpg",
    "image-1.jpeg",
    "image-01.jpeg",
  );
  for (const imageName of imageNames) {
    const probe = normalizeAssetPath(
      `${folderWebPath.replace(/\/+$/, "")}/${imageName}`,
      { probeDisk: true },
    );
    if (
      probe &&
      !isProductImageFallback(probe) &&
      isProductCatalogMediaPath(probe)
    ) {
      return probe;
    }
  }
  return null;
}

function isLegacyNonLeatherCatalogPath(assetPath: string | null | undefined): boolean {
  return /\/assets\/catalog\/seating\/non-leather\//i.test(String(assetPath || ""));
}

export function resolveProductCatalogAssets(
  slug: string | null | undefined,
  preferredFlagship?: string | null,
  preferredImages?: Array<string | null | undefined> | null,
): { flagship_image: string; images: string[] } {
  const normalizedPreferred = (Array.isArray(preferredImages) ? preferredImages : [])
    .map((value) => normalizeAssetPath(value, { probeDisk: true }))
    .filter((value): value is string => Boolean(value) && !isProductImageFallback(value));

  const publishablePreferred = filterProductCatalogMedia(normalizedPreferred);
  const catalogPreferred = publishablePreferred.filter((path) =>
    /\/assets\/catalog\/oando-/i.test(path),
  );

  let flagship = preferredFlagship ? normalizeAssetPath(preferredFlagship, { probeDisk: true }) : "";
  if (flagship && (isProductImageFallback(flagship) || !isProductCatalogMediaPath(flagship))) {
    flagship = "";
  }
  if (!flagship && catalogPreferred.length > 0) {
    flagship = catalogPreferred[0];
  }

  const catalogListed = listCatalogSlugImages(slug).map((webPath) => applyAssetBase(webPath));
  if (catalogListed.length > 0) {
    const images = Array.from(new Set([...catalogListed, ...catalogPreferred]));
    return {
      flagship_image: images[0] ?? catalogListed[0],
      images: images.length > 0 ? images : catalogListed,
    };
  }

  const probeAnchor = toWebAssetPath(String(preferredFlagship || flagship || ""));
  const preferredFlagshipWeb = toWebAssetPath(String(preferredFlagship || ""));
  const hasAuthoritativePreferred =
    preferredFlagshipWeb &&
    !isLegacyNonLeatherCatalogPath(preferredFlagshipWeb) &&
    !/\/image-0*\d+\.webp$/i.test(preferredFlagshipWeb);
  const needsProbe =
    !hasAuthoritativePreferred &&
    (!flagship ||
      isLegacyNonLeatherCatalogPath(probeAnchor) ||
      (probeAnchor &&
        shouldPreferCdnFallback(probeAnchor) &&
        isServer() &&
        !localAssetExists(probeAnchor)));
  if (needsProbe) {
    for (const folder of catalogFolderWebPathCandidates(String(slug || "").trim())) {
      const probed = probeCdnCatalogImage(folder);
      if (probed) {
        const images = Array.from(new Set([probed, ...catalogPreferred]));
        return {
          flagship_image: probed,
          images: images.length > 0 ? images : [probed],
        };
      }
    }
  }

  if (flagship && publishablePreferred.length > 0) {
    return { flagship_image: flagship, images: publishablePreferred };
  }

  const fallback = applyAssetBase(PRODUCT_IMAGE_FALLBACK);
  return {
    flagship_image: flagship || fallback,
    images: publishablePreferred.length > 0 ? publishablePreferred : [flagship || fallback],
  };
}
