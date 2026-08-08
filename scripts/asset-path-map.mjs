/**
 * Build local-only asset path rewrite maps from on-disk tree (source of truth).
 *
 * Scans: site/public/assets/
 *
 * Outputs (longest-key-first ordered for apply scripts):
 *   results/asset-cutover/path-map.generated.json         (OLD → NEW)
 *   results/asset-cutover/path-map-reverse.generated.json (NEW → primary OLD)
 *   results/asset-cutover/path-map-report.json            (counts, samples, notes)
 *
 * Mapping rules:
 *   - /images/... → /assets/... (prefix family)
 *   - Flat /assets/catalog/oando-{family}--{slug} → nested under family
 *     (seating also leather | non-leather; leather slugs: grace, pinnacle, moonlight, rider)
 *   - /assets/catalog/{family}/oando-.../image-N without gallery → add /gallery/ when present
 *   - Marketing aliases for deleted installs/fallback → kept files (target must exist)
 *   - products/imported/{slug} → matching oando-*--{slug}/gallery if gallery exists
 *
 * Usage (repo root):
 *   pnpm exec node scripts/asset-path-map.mjs
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve, sep } from "node:path";

const ROOT = resolve(process.cwd());
const PUBLIC = resolve(ROOT, "site/public");
const ASSETS = resolve(PUBLIC, "assets");
const OUT_DIR = resolve(ROOT, "results/asset-cutover");

const SEATING_LEATHER = new Set([
  "grace",
  "pinnacle",
  "moonlight",
  "rider",
]);

/** Prefer this family order when multiple SKUs share a slug (imported match). */
const FAMILY_PREF = [
  "seating",
  "soft-seating",
  "workstations",
  "tables",
  "storage",
  "educational",
  "collaborative",
];

/** Static marketing aliases (deleted / wrong path → kept file). Only if target exists. */
const MARKETING_STATIC = {
  "/assets/marketing/hero/slides/hero-1.webp":
    "/assets/marketing/hero/pages/hero-1.webp",
  "/assets/marketing/hero/slides/hero-2.webp":
    "/assets/marketing/hero/pages/hero-2.webp",
  "/assets/marketing/hero/slides/hero-3.webp":
    "/assets/marketing/hero/pages/hero-5.webp",
  "/assets/marketing/hero/slides/hero-4.webp":
    "/assets/marketing/hero/pages/hero-5.webp",
  "/assets/marketing/hero/slides/hero-5.webp":
    "/assets/marketing/hero/pages/hero-5.webp",
  "/assets/marketing/hero/hero-1.webp":
    "/assets/marketing/hero/pages/hero-1.webp",
  "/assets/marketing/hero/hero-2.webp":
    "/assets/marketing/hero/pages/hero-2.webp",
  "/assets/marketing/hero/slides/home-poster.webp":
    "/assets/marketing/hero/pages/hero-1.webp",
  "/assets/marketing/hero/installs/titan-patna-hero.webp":
    "/assets/marketing/hero/slides/titan-hero.jpg",
  "/assets/marketing/hero/installs/titan-patna-hq.webp":
    "/assets/marketing/hero/slides/titan-patna-hq.webp",
  "/assets/marketing/hero/installs/titan-patna-enhanced.webp":
    "/assets/marketing/hero/slides/titan-patna-hq.webp",
  "/assets/marketing/hero/installs/tvs-patna-hero.webp":
    "/assets/marketing/hero/slides/tvs-patna-hq.webp",
  "/assets/marketing/hero/installs/tvs-patna-enhanced.webp":
    "/assets/marketing/hero/slides/tvs-patna-enhanced.webp",
  "/assets/marketing/hero/installs/tvs-patna-hq.webp":
    "/assets/marketing/hero/slides/tvs-patna-hq.webp",
  "/assets/marketing/hero/installs/dmrc-hero.webp":
    "/assets/marketing/projects/DMRC/dmrc-1.webp",
  "/assets/marketing/hero/dmrc-hero.webp":
    "/assets/marketing/projects/DMRC/dmrc-1.webp",
  "/assets/marketing/hero/installs/usha-hero.webp":
    "/assets/marketing/projects/Usha/hero.jpg",
  "/assets/marketing/hero/installs/franklin-hero.webp":
    "/assets/marketing/projects/FranklinTempleton/franklin-templeton-office.webp",
  "/assets/marketing/hero/pages/career-poster.webp":
    "/assets/marketing/hero/pages/planning-poster.webp",
  "/assets/marketing/hero/pages/service-poster.webp":
    "/assets/marketing/hero/pages/solutions-poster.webp",
  "/assets/marketing/hero/pages/showrooms-poster.webp":
    "/assets/marketing/hero/pages/trusted-by-poster.webp",
  "/assets/marketing/hero/pages/downloads-poster.webp":
    "/assets/marketing/hero/slides/downloads-poster.webp",
  "/assets/marketing/projects/DMRC/hero.webp":
    "/assets/marketing/projects/DMRC/dmrc-1.webp",
  "/assets/marketing/projects/Titan/hero.webp":
    "/assets/marketing/projects/Titan/hero.jpg",
  "/assets/marketing/projects/TVS/hero.webp":
    "/assets/marketing/projects/TVS/tvs.png",
  "/assets/marketing/projects/Usha/hero.webp":
    "/assets/marketing/projects/Usha/hero.jpg",
  "/assets/marketing/projects/project-gallery-01.webp":
    "/assets/marketing/projects/DMRC/dmrc-office-01.webp",
  "/assets/marketing/projects/project-gallery-02.webp":
    "/assets/marketing/projects/Titan/project-gallery-02.webp",
  "/assets/marketing/brand/logo-sharp-white.png":
    "/assets/marketing/brand/logos/logo-sharp-white.png",
  "/assets/marketing/brand/logo-sharp.webp":
    "/assets/marketing/brand/logos/logo-sharp.png",
  "/assets/marketing/brand/logos/logo-sharp.webp":
    "/assets/marketing/brand/logos/logo-sharp.png",
  "/assets/marketing/brand/logos/logo-sharp-white.webp":
    "/assets/marketing/brand/logos/logo-sharp-white.png",
  "/assets/marketing/brand/logos/catalog-logo.webp":
    "/assets/marketing/brand/logos/catalog-logo.png",
  "/assets/marketing/fallback/placeholders/product-placeholder.png":
    "/assets/marketing/brand/logos/catalog-logo.png",
  "/assets/marketing/fallback/placeholders/product-placeholder.webp":
    "/assets/marketing/brand/logos/catalog-logo.png",
  "/assets/marketing/fallback/product-placeholder.png":
    "/assets/marketing/brand/logos/catalog-logo.png",
  "/assets/marketing/fallback/product-placeholder.webp":
    "/assets/marketing/brand/logos/catalog-logo.png",
  "/assets/marketing/fallback/category.png":
    "/assets/marketing/brand/logos/catalog-logo.png",
  "/assets/marketing/fallback/category.webp":
    "/assets/marketing/brand/logos/catalog-logo.png",
  "/assets/marketing/fallback/category.svg":
    "/assets/marketing/brand/logos/catalog-logo.png",
};

/** Slug aliases seen in products/imported dumps. */
const IMPORTED_ALIASES = {
  breez: "breeze",
  xmesh: "x-mesh",
  eclipse: "eclips",
};

function webFromFs(abs) {
  return `/${relative(PUBLIC, abs).split(sep).join("/")}`;
}

function existsWeb(webPath) {
  if (!webPath?.startsWith("/")) return false;
  return existsSync(join(PUBLIC, webPath.slice(1)));
}

function walkDirs(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const p = join(dir, ent.name);
    acc.push(p);
    walkDirs(p, acc);
  }
  return acc;
}

/**
 * Discover oando-* SKU dirs under catalog/. Paths include leather|non-leather for seating.
 * @returns {Map<string, { webDir: string, family: string, slug: string, sku: string, material: string|null }>}
 */
function findOandoSkus() {
  const bySku = new Map();
  const catalog = join(ASSETS, "catalog");
  for (const dir of walkDirs(catalog)) {
    const name = dir.split(sep).pop() || "";
    if (!name.startsWith("oando-")) continue;
    const m = name.match(/^oando-([a-z0-9-]+)--(.+)$/i);
    if (!m) continue;
    const family = m[1].toLowerCase();
    const slug = m[2].toLowerCase();
    const webDir = webFromFs(dir);
    let material = null;
    if (family === "seating") {
      if (webDir.includes("/leather/")) material = "leather";
      else if (webDir.includes("/non-leather/")) material = "non-leather";
      else material = SEATING_LEATHER.has(slug) ? "leather" : "non-leather";
    }
    bySku.set(name.toLowerCase(), {
      webDir,
      family,
      slug,
      sku: name,
      material,
    });
  }
  return bySku;
}

/** @param {Iterable<{ family: string, slug: string, webDir: string }>} skus */
function pickSkuBySlug(skus, slug) {
  const hits = [...skus].filter((s) => s.slug === slug);
  if (hits.length === 0) return null;
  hits.sort((a, b) => {
    const ia = FAMILY_PREF.indexOf(a.family);
    const ib = FAMILY_PREF.indexOf(b.family);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  return hits[0];
}

function sortLongestFirst(map) {
  return Object.fromEntries(
    Object.entries(map).sort((a, b) => b[0].length - a[0].length || a[0].localeCompare(b[0])),
  );
}

/**
 * Prefer primary old path for reverse map:
 * flat /assets/catalog/oando-... over /images, imported, or intermediate nests.
 * @param {string[]} froms
 */
function preferPrimaryOld(froms) {
  const score = (f) => {
    let s = 0;
    if (f.startsWith("/assets/")) s += 100;
    if (f.startsWith("/images/")) s += 40;
    if (f.includes("/products/imported/")) s -= 50;
    if (f.includes("/fallback/")) s -= 10;
    // Prefer flat SKU roots: /assets/catalog/oando-x--y
    if (/^\/assets\/catalog\/oando-[^/]+$/.test(f)) s += 30;
    // Prefer flat file under flat SKU
    if (/^\/assets\/catalog\/oando-[^/]+\/[^/]+$/.test(f)) s += 20;
    // Prefer without leather|non-leather intermediate as "old"
    if (f.includes("/leather/") || f.includes("/non-leather/")) s -= 5;
    // Prefer shorter old path among equals
    s -= f.length * 0.001;
    return s;
  };
  return [...froms].sort((a, b) => score(b) - score(a))[0];
}

function isGalleryImageName(name) {
  if (name === ".gitkeep") return false;
  // Prefer image-N* (rule); also allow any raster in gallery folder
  return (
    /^image[-_]?\d/i.test(name) ||
    /\.(webp|jpe?g|png|gif|avif)$/i.test(name)
  );
}

/**
 * @returns {{
 *   forward: Record<string, string>,
 *   reverse: Record<string, string>,
 *   notes: object[],
 *   skuCount: number,
 *   stats: Record<string, number>
 * }}
 */
export function buildPathMap() {
  /** @type {Record<string, string>} */
  const forward = {};
  /** @type {object[]} */
  const notes = [];
  const stats = {
    prefixRules: 0,
    skuRootMaps: 0,
    galleryMaps: 0,
    importedMaps: 0,
    marketingMaps: 0,
    marketingSkipped: 0,
  };

  // --- Prefix rewrites (longest-key-first consumers will pick longer catalog keys first) ---
  const prefixes = {
    "/images/catalog/": "/assets/catalog/",
    "/images/hero/": "/assets/marketing/hero/",
    "/images/client-logos/": "/assets/marketing/client-logos/",
    "/images/projects/": "/assets/marketing/projects/",
    "/images/fallback/": "/assets/marketing/brand/logos/",
    "/images/": "/assets/",
  };
  for (const [from, to] of Object.entries(prefixes)) {
    forward[from] = to;
    stats.prefixRules += 1;
  }

  const skus = findOandoSkus();

  for (const [, info] of skus) {
    const { webDir, family, sku, material } = info;

    // Flat catalog → nested family (+ seating material from disk)
    forward[`/assets/catalog/${sku}`] = webDir;
    forward[`/images/catalog/${sku}`] = webDir;
    stats.skuRootMaps += 2;

    // Seating: paths missing leather|non-leather bucket
    if (family === "seating") {
      forward[`/assets/catalog/seating/${sku}`] = webDir;
      forward[`/images/catalog/seating/${sku}`] = webDir;
      stats.skuRootMaps += 2;
      // Wrong material bucket → correct on-disk path
      if (material === "leather") {
        forward[`/assets/catalog/seating/non-leather/${sku}`] = webDir;
      } else if (material === "non-leather") {
        forward[`/assets/catalog/seating/leather/${sku}`] = webDir;
      }
    }

    const galFs = join(PUBLIC, webDir.slice(1), "gallery");
    const hasGallery = existsSync(galFs);

    if (hasGallery) {
      for (const f of readdirSync(galFs)) {
        if (!isGalleryImageName(f)) continue;
        const dest = `${webDir}/gallery/${f}`;

        // Nested path missing /gallery/
        forward[`${webDir}/${f}`] = dest;
        // Flat SKU root
        forward[`/assets/catalog/${sku}/${f}`] = dest;
        forward[`/assets/catalog/${sku}/gallery/${f}`] = dest;
        forward[`/images/catalog/${sku}/${f}`] = dest;
        forward[`/images/catalog/${sku}/gallery/${f}`] = dest;
        stats.galleryMaps += 5;

        // Family path without material (seating) or intermediate
        if (family === "seating") {
          forward[`/assets/catalog/seating/${sku}/${f}`] = dest;
          forward[`/assets/catalog/seating/${sku}/gallery/${f}`] = dest;
          forward[`/images/catalog/seating/${sku}/${f}`] = dest;
          forward[`/images/catalog/seating/${sku}/gallery/${f}`] = dest;
          stats.galleryMaps += 4;
          // Wrong material bucket files
          if (material === "leather") {
            forward[`/assets/catalog/seating/non-leather/${sku}/${f}`] = dest;
            forward[`/assets/catalog/seating/non-leather/${sku}/gallery/${f}`] =
              dest;
          } else if (material === "non-leather") {
            forward[`/assets/catalog/seating/leather/${sku}/${f}`] = dest;
            forward[`/assets/catalog/seating/leather/${sku}/gallery/${f}`] =
              dest;
          }
        } else {
          // Non-seating family intermediate (already equals webDir usually)
          const famRoot = `/assets/catalog/${family}/${sku}`;
          if (famRoot !== webDir) {
            forward[`${famRoot}/${f}`] = dest;
            forward[`${famRoot}/gallery/${f}`] = dest;
            stats.galleryMaps += 2;
          }
        }
      }

      // products/imported/{slug} → gallery (only when gallery exists)
      const galWeb = `${webDir}/gallery`;
      // Defer write until after loop so FAMILY_PREF wins for shared slugs
      void galWeb;
    }
  }

  // products/imported — one primary SKU per slug (family preference), gallery must exist
  const slugsSeen = new Set([...skus.values()].map((s) => s.slug));
  for (const slug of slugsSeen) {
    const hit = pickSkuBySlug(skus.values(), slug);
    if (!hit) continue;
    const galWeb = `${hit.webDir}/gallery`;
    if (!existsWeb(galWeb) && !existsSync(join(PUBLIC, galWeb.slice(1)))) {
      notes.push({
        skip: `products/imported/${slug}`,
        reason: "gallery-missing",
        candidate: hit.webDir,
      });
      continue;
    }
    forward[`/assets/catalog/products/imported/${slug}`] = galWeb;
    forward[`/images/products/imported/${slug}`] = galWeb;
    forward[`/assets/products/imported/${slug}`] = galWeb;
    stats.importedMaps += 3;
  }

  for (const [alias, slug] of Object.entries(IMPORTED_ALIASES)) {
    const hit = pickSkuBySlug(skus.values(), slug);
    if (!hit) continue;
    const galWeb = `${hit.webDir}/gallery`;
    if (!existsSync(join(PUBLIC, galWeb.slice(1)))) continue;
    forward[`/assets/catalog/products/imported/${alias}`] = galWeb;
    forward[`/images/products/imported/${alias}`] = galWeb;
    stats.importedMaps += 2;
  }

  // Marketing static aliases (target must exist on disk)
  for (const [from, to] of Object.entries(MARKETING_STATIC)) {
    if (existsWeb(to)) {
      forward[from] = to;
      stats.marketingMaps += 1;
    } else {
      notes.push({ skip: from, to, reason: "target-missing" });
      stats.marketingSkipped += 1;
    }
  }

  // Reverse: NEW → primary OLD
  /** @type {Record<string, string[]>} */
  const reverseBuckets = {};
  for (const [from, to] of Object.entries(forward)) {
    // Skip pure prefix rules in reverse (not 1:1 file mappings)
    if (from.endsWith("/") && to.endsWith("/")) continue;
    if (!reverseBuckets[to]) reverseBuckets[to] = [];
    reverseBuckets[to].push(from);
  }
  /** @type {Record<string, string>} */
  const reverse = {};
  for (const [to, froms] of Object.entries(reverseBuckets)) {
    reverse[to] = preferPrimaryOld(froms);
  }

  return {
    forward: sortLongestFirst(forward),
    reverse: sortLongestFirst(reverse),
    notes,
    skuCount: skus.size,
    stats,
  };
}

function main() {
  if (!existsSync(ASSETS)) {
    console.error("Missing site/public/assets — run from repo root");
    process.exit(1);
  }

  const { forward, reverse, notes, skuCount, stats } = buildPathMap();
  mkdirSync(OUT_DIR, { recursive: true });

  const fwdPath = join(OUT_DIR, "path-map.generated.json");
  const revPath = join(OUT_DIR, "path-map-reverse.generated.json");
  const reportPath = join(OUT_DIR, "path-map-report.json");

  writeFileSync(fwdPath, JSON.stringify(forward, null, 2) + "\n");
  writeFileSync(revPath, JSON.stringify(reverse, null, 2) + "\n");

  const forwardEntries = Object.keys(forward).length;
  const reverseEntries = Object.keys(reverse).length;
  const forwardSample = Object.entries(forward).slice(0, 20);
  const reverseSample = Object.entries(reverse).slice(0, 20);

  // Representative rule samples (not only longest keys)
  const ruleSamples = {
    imagesPrefix: {
      "/images/": forward["/images/"],
      "/images/catalog/": forward["/images/catalog/"],
    },
    seatingLeather: {
      "/assets/catalog/oando-seating--grace":
        forward["/assets/catalog/oando-seating--grace"],
      "/assets/catalog/seating/oando-seating--grace":
        forward["/assets/catalog/seating/oando-seating--grace"],
    },
    seatingNonLeather: {
      "/assets/catalog/oando-seating--breeze":
        forward["/assets/catalog/oando-seating--breeze"],
    },
    galleryInsert: {
      "/assets/catalog/tables/oando-tables--apex/image-1.webp":
        forward["/assets/catalog/tables/oando-tables--apex/image-1.webp"],
      "/assets/catalog/seating/leather/oando-seating--grace/image-01.webp":
        forward[
          "/assets/catalog/seating/leather/oando-seating--grace/image-01.webp"
        ],
    },
    productsImported: {
      "/assets/catalog/products/imported/breeze":
        forward["/assets/catalog/products/imported/breeze"],
      "/assets/catalog/products/imported/grace":
        forward["/assets/catalog/products/imported/grace"],
    },
    marketing: {
      "/assets/marketing/fallback/product-placeholder.webp":
        forward["/assets/marketing/fallback/product-placeholder.webp"],
      "/assets/marketing/hero/installs/dmrc-hero.webp":
        forward["/assets/marketing/hero/installs/dmrc-hero.webp"],
    },
  };

  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceOfTruth: "site/public/assets/",
        forwardEntries,
        reverseEntries,
        skuCount,
        stats,
        skipped: notes,
        notes: [
          "Keys sorted longest-first for apply scripts.",
          "Seating leather slugs: grace, pinnacle, moonlight, rider.",
          "products/imported prefers seating when slug collides across families.",
          "Marketing aliases only included when target exists on disk.",
          "Reverse map excludes pure prefix rules (/images/ → /assets/).",
        ],
        ruleSamples,
        forwardSample,
        reverseSample,
      },
      null,
      2,
    ) + "\n",
  );

  console.log(
    JSON.stringify(
      {
        forward: fwdPath,
        reverse: revPath,
        report: reportPath,
        forwardEntries,
        reverseEntries,
        skuCount,
        stats,
        skipped: notes.length,
      },
      null,
      2,
    ),
  );
}

main();
