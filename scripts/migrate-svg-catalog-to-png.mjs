/**
 * Phase 7 Stage A — migrate legacy `site/public/assets/others/legacy/svg-catalog/{slug}.svg` plan
 * symbols to contract-sized PNGs via the same Product Studio publish path
 * (`publishToStorageAction` + quality gate + release record).
 *
 * Operator tool only. Never imported by product tests as a side-effect publisher.
 * Does not retire portal routes or rename svg-editor (Stage B).
 *
 * Usage (repo root):
 *   node scripts/migrate-svg-catalog-to-png.mjs --dry-run --slug=missing-geom-fallback-001
 *   node scripts/migrate-svg-catalog-to-png.mjs --dry-run --all
 *   node scripts/migrate-svg-catalog-to-png.mjs --apply --slug=missing-geom-fallback-001
 *
 * Safety:
 *   - Requires explicit `--dry-run` or `--apply` (no implicit apply).
 *   - Requires `--slug=` or `--all`.
 *   - Idempotent: re-apply re-runs the same upsert publish path.
 *
 * Apply hook:
 *   Rasterizes with sharp → stages base64 on form state → calls
 *   `publishToStorageAction` (same quality gate + checksum + storage + release
 *   record as the UI). Intermediate PNGs land under
 *   `results/migrate-svg-catalog-to-png/` for operator inspection.
 *   Full apply needs env (storage + release authority) just like Product Studio.
 */

import { createRequire } from "node:module";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Module from "node:module";

const require = createRequire(import.meta.url);

/** Locked contract — mirror of `planSymbolPngContract.ts` (L5 / L6). */
export const PLAN_SYMBOL_PX_PER_MM = 2;
export const PLAN_SYMBOL_PAD_MM = 40;

/**
 * Full raster box: core at 2 px/mm + 40 mm pad each side.
 * Example: 1000×600 mm → 2160×1360 px.
 *
 * @param {number} widthMm
 * @param {number} depthMm
 * @param {number} [padMm]
 */
export function planSymbolRasterBox(
  widthMm,
  depthMm,
  padMm = PLAN_SYMBOL_PAD_MM,
) {
  const coreWidthPx = Math.round(widthMm * PLAN_SYMBOL_PX_PER_MM);
  const coreHeightPx = Math.round(depthMm * PLAN_SYMBOL_PX_PER_MM);
  const padPx = Math.round(padMm * PLAN_SYMBOL_PX_PER_MM);
  return {
    widthMm,
    depthMm,
    coreWidthPx,
    coreHeightPx,
    rasterWidthPx: coreWidthPx + padPx * 2,
    rasterHeightPx: coreHeightPx + padPx * 2,
    padMm,
    padPx,
    pxPerMm: PLAN_SYMBOL_PX_PER_MM,
  };
}

/**
 * Live descriptor filenames only (exclude version snapshots, latest pointers, `_` seeds).
 * Matches `scripts/pushSvgCatalogToDb.ts` selection rules.
 *
 * @param {string} name
 */
export function isLiveDescriptorFilename(name) {
  return (
    name.endsWith(".json") &&
    !name.includes(".latest.") &&
    !name.startsWith("_") &&
    !/\.\d+\.json$/.test(name)
  );
}

/**
 * @param {readonly string[]} filenames
 * @returns {string[]}
 */
export function listLiveDescriptorSlugs(filenames) {
  return filenames
    .filter(isLiveDescriptorFilename)
    .map((name) => name.replace(/\.json$/, ""))
    .sort((a, b) => a.localeCompare(b));
}

/**
 * @param {unknown} descriptor
 * @returns {{ ok: true; widthMm: number; depthMm: number } | { ok: false; error: string }}
 */
export function extractGeometryMm(descriptor) {
  if (!descriptor || typeof descriptor !== "object") {
    return { ok: false, error: "descriptor_not_object" };
  }
  const geometry = /** @type {{ geometry?: unknown }} */ (descriptor).geometry;
  if (!geometry || typeof geometry !== "object") {
    return { ok: false, error: "geometry_missing" };
  }
  const widthMm = /** @type {{ widthMm?: unknown }} */ (geometry).widthMm;
  const depthMm = /** @type {{ depthMm?: unknown }} */ (geometry).depthMm;
  if (typeof widthMm !== "number" || !Number.isFinite(widthMm) || widthMm <= 0) {
    return { ok: false, error: "widthMm_invalid" };
  }
  if (typeof depthMm !== "number" || !Number.isFinite(depthMm) || depthMm <= 0) {
    return { ok: false, error: "depthMm_invalid" };
  }
  return { ok: true, widthMm, depthMm };
}

/**
 * CLI flags. No default mode — accidental full apply is hard.
 *
 * @param {readonly string[]} argv
 * @returns
 *   | { ok: true; mode: "dry-run" | "apply"; all: boolean; slug: string | null }
 *   | { ok: false; error: string }
 */
export function parseMigrateArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const apply = argv.includes("--apply");
  const all = argv.includes("--all");
  const slugFlag = argv.find((a) => a.startsWith("--slug="));
  const slug = slugFlag?.slice("--slug=".length).trim() || "";

  if (dryRun && apply) {
    return { ok: false, error: "Use only one of --dry-run or --apply" };
  }
  if (!dryRun && !apply) {
    return {
      ok: false,
      error: "Require --dry-run or --apply (no implicit apply)",
    };
  }
  if (all && slug) {
    return { ok: false, error: "Use only one of --slug=<slug> or --all" };
  }
  if (!all && !slug) {
    return { ok: false, error: "Provide --slug=<slug> or --all" };
  }

  return {
    ok: true,
    mode: dryRun ? "dry-run" : "apply",
    all,
    slug: all ? null : slug,
  };
}

/**
 * Resolve which slugs to process from flags + available live list.
 * Explicit `--slug=` is always accepted (plan entry reports missing descriptor).
 *
 * @param {{ all: boolean; slug: string | null; available: readonly string[] }} args
 * @returns {{ ok: true; slugs: string[] } | { ok: false; error: string }}
 */
export function resolveSlugSelection({ all, slug, available }) {
  if (all) {
    return { ok: true, slugs: [...available] };
  }
  if (!slug) {
    return { ok: false, error: "Provide --slug=<slug> or --all" };
  }
  return { ok: true, slugs: [slug] };
}

/**
 * Build one dry-run / plan row for a slug.
 *
 * @param {{
 *   slug: string;
 *   descriptor: unknown | null;
 *   descriptorPath: string;
 *   svgPath: string;
 *   svgPresent: boolean;
 *   descriptorLoadError?: string;
 * }} input
 */
export function buildMigrationPlanEntry(input) {
  const {
    slug,
    descriptor,
    descriptorPath,
    svgPath,
    svgPresent,
    descriptorLoadError,
  } = input;

  if (descriptorLoadError || !descriptor) {
    return {
      slug,
      descriptorPath,
      svgPath,
      svgPresent,
      widthMm: null,
      depthMm: null,
      rasterWidthPx: null,
      rasterHeightPx: null,
      alreadyHasPngPointer: false,
      planSymbolPngUrl: null,
      action: "skip-bad-descriptor",
      error: descriptorLoadError ?? "descriptor_missing",
    };
  }

  const geom = extractGeometryMm(descriptor);
  if (!geom.ok) {
    return {
      slug,
      descriptorPath,
      svgPath,
      svgPresent,
      widthMm: null,
      depthMm: null,
      rasterWidthPx: null,
      rasterHeightPx: null,
      alreadyHasPngPointer: Boolean(
        /** @type {{ planSymbolPngUrl?: unknown }} */ (descriptor).planSymbolPngUrl,
      ),
      planSymbolPngUrl:
        typeof /** @type {{ planSymbolPngUrl?: unknown }} */ (descriptor)
          .planSymbolPngUrl === "string"
          ? /** @type {{ planSymbolPngUrl: string }} */ (descriptor)
              .planSymbolPngUrl
          : null,
      action: "skip-bad-geometry",
      error: geom.error,
    };
  }

  const box = planSymbolRasterBox(geom.widthMm, geom.depthMm);
  const planSymbolPngUrl =
    typeof /** @type {{ planSymbolPngUrl?: unknown }} */ (descriptor)
      .planSymbolPngUrl === "string" &&
    /** @type {{ planSymbolPngUrl: string }} */ (descriptor).planSymbolPngUrl
      .trim().length > 0
      ? /** @type {{ planSymbolPngUrl: string }} */ (descriptor).planSymbolPngUrl
          .trim()
      : null;
  const alreadyHasPngPointer = planSymbolPngUrl !== null;

  if (!svgPresent) {
    return {
      slug,
      descriptorPath,
      svgPath,
      svgPresent: false,
      widthMm: geom.widthMm,
      depthMm: geom.depthMm,
      rasterWidthPx: box.rasterWidthPx,
      rasterHeightPx: box.rasterHeightPx,
      alreadyHasPngPointer,
      planSymbolPngUrl,
      action: "skip-missing-svg",
      error: "svg_catalog_missing",
    };
  }

  return {
    slug,
    descriptorPath,
    svgPath,
    svgPresent: true,
    widthMm: geom.widthMm,
    depthMm: geom.depthMm,
    rasterWidthPx: box.rasterWidthPx,
    rasterHeightPx: box.rasterHeightPx,
    alreadyHasPngPointer,
    planSymbolPngUrl,
    // Idempotent: re-publish is allowed (same upsert path as UI).
    action: alreadyHasPngPointer ? "re-publish" : "migrate",
    error: null,
  };
}

/**
 * Human-readable one-line plan summary.
 *
 * @param {ReturnType<typeof buildMigrationPlanEntry>} entry
 */
export function formatPlanLine(entry) {
  if (entry.error) {
    return `${entry.action} ${entry.slug}: ${entry.error} (svg=${entry.svgPresent ? "yes" : "no"})`;
  }
  return (
    `${entry.action} ${entry.slug}: ` +
    `${entry.widthMm}×${entry.depthMm} mm → ${entry.rasterWidthPx}×${entry.rasterHeightPx} px` +
    ` · svg=${entry.svgPath}` +
    (entry.alreadyHasPngPointer ? " · has planSymbolPngUrl" : "")
  );
}

/**
 * @param {string} repoRoot
 */
export function descriptorDir(repoRoot) {
  const fromSite = path.join(repoRoot, "site", "inventory", "descriptors");
  if (existsSync(fromSite)) {
    return fromSite;
  }
  return path.join(repoRoot, "inventory", "descriptors");
}

/**
 * @param {string} repoRoot
 * @param {string} slug
 */
export function svgCatalogPath(repoRoot, slug) {
  return path.join(repoRoot, "site", "public", "assets", "others", "legacy", "svg-catalog", `${slug}.svg`);
}

/**
 * @param {string} repoRoot
 * @param {string} slug
 */
export function loadDescriptorJson(repoRoot, slug) {
  const file = path.join(descriptorDir(repoRoot), `${slug}.json`);
  if (!existsSync(file)) {
    return { path: file, error: `descriptor missing: ${file}` };
  }
  try {
    return {
      path: file,
      descriptor: JSON.parse(readFileSync(file, "utf8")),
    };
  } catch (error) {
    return {
      path: file,
      error: `descriptor parse: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Rasterize a catalog SVG to the contract-sized PNG Buffer (sharp, same sizing
 * path as Product Studio shape-draft render).
 *
 * @param {string} svgMarkup
 * @param {number} widthMm
 * @param {number} depthMm
 * @param {typeof import("sharp") | null} [sharpFactory]
 */
export async function rasterizeSvgToPlanSymbolPng(
  svgMarkup,
  widthMm,
  depthMm,
  sharpFactory = null,
) {
  const box = planSymbolRasterBox(widthMm, depthMm);
  const sharp =
    sharpFactory ?? (await import("sharp")).default;
  const png = await sharp(Buffer.from(svgMarkup, "utf8"), {
    density: 72,
  })
    .resize(box.rasterWidthPx, box.rasterHeightPx, {
      fit: "fill",
      kernel: "nearest",
    })
    .ensureAlpha()
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toBuffer();

  const meta = await sharp(png).metadata();
  if (
    meta.width !== box.rasterWidthPx ||
    meta.height !== box.rasterHeightPx
  ) {
    return {
      ok: false,
      error: `raster_dims: got ${meta.width}x${meta.height}, expected ${box.rasterWidthPx}x${box.rasterHeightPx}`,
    };
  }

  return {
    ok: true,
    png,
    widthPx: box.rasterWidthPx,
    heightPx: box.rasterHeightPx,
  };
}

/**
 * Build plan entries for the selected slugs (pure given filesystem callbacks).
 *
 * @param {{
 *   slugs: readonly string[];
 *   repoRoot: string;
 *   loadDescriptor?: typeof loadDescriptorJson;
 *   svgExists?: (p: string) => boolean;
 * }} args
 */
export function buildMigrationPlan({
  slugs,
  repoRoot,
  loadDescriptor = loadDescriptorJson,
  svgExists = existsSync,
}) {
  return slugs.map((slug) => {
    const loaded = loadDescriptor(repoRoot, slug);
    const svgPath = svgCatalogPath(repoRoot, slug);
    if ("error" in loaded && loaded.error) {
      return buildMigrationPlanEntry({
        slug,
        descriptor: null,
        descriptorPath: loaded.path,
        svgPath,
        svgPresent: svgExists(svgPath),
        descriptorLoadError: loaded.error,
      });
    }
    return buildMigrationPlanEntry({
      slug,
      descriptor: loaded.descriptor,
      descriptorPath: loaded.path,
      svgPath,
      svgPresent: svgExists(svgPath),
    });
  });
}

function stubServerOnly() {
  const originalLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === "server-only") {
      return {};
    }
    return originalLoad(request, parent, isMain);
  };
}

/**
 * Apply path: rasterize → optional intermediate file → publishToStorageAction.
 * Uses tsx path resolution so `@/` imports in site code resolve.
 *
 * @param {{
 *   entry: ReturnType<typeof buildMigrationPlanEntry>;
 *   repoRoot: string;
 *   publish?: (slug: string, form: unknown) => Promise<{ success: boolean; error?: string; pngUrl?: string }>;
 *   writeIntermediate?: boolean;
 * }} args
 */
export async function applyMigrationEntry({
  entry,
  repoRoot,
  publish = null,
  writeIntermediate = true,
}) {
  if (
    entry.action !== "migrate" &&
    entry.action !== "re-publish"
  ) {
    return {
      ok: false,
      skipped: true,
      slug: entry.slug,
      error: entry.error ?? entry.action,
    };
  }

  if (
    entry.widthMm === null ||
    entry.widthMm === undefined ||
    entry.depthMm === null ||
    entry.depthMm === undefined ||
    !entry.svgPresent
  ) {
    return {
      ok: false,
      skipped: true,
      slug: entry.slug,
      error: entry.error ?? "not_migratable",
    };
  }

  const svgMarkup = readFileSync(entry.svgPath, "utf8");
  const raster = await rasterizeSvgToPlanSymbolPng(
    svgMarkup,
    entry.widthMm,
    entry.depthMm,
  );
  if (!raster.ok) {
    return { ok: false, skipped: false, slug: entry.slug, error: raster.error };
  }

  let intermediatePath = null;
  if (writeIntermediate) {
    const outDir = path.join(repoRoot, "results", "migrate-svg-catalog-to-png");
    mkdirSync(outDir, { recursive: true });
    intermediatePath = path.join(outDir, `${entry.slug}.png`);
    writeFileSync(intermediatePath, raster.png);
  }

  const publishFn = publish ?? (await loadDefaultPublisher(repoRoot));
  const form = await buildPublishForm(repoRoot, entry.slug, raster.png);
  const result = await publishFn(entry.slug, form);

  if (!result || result.success !== true) {
    return {
      ok: false,
      skipped: false,
      slug: entry.slug,
      error: result?.error ?? "publish_failed",
      intermediatePath,
    };
  }

  return {
    ok: true,
    skipped: false,
    slug: entry.slug,
    pngUrl: result.pngUrl,
    intermediatePath,
    bytes: raster.png.length,
    widthPx: raster.widthPx,
    heightPx: raster.heightPx,
  };
}

/**
 * Site TS modules under `site/` — relative from this script. Requires the
 * process to be started with `node --import tsx` (CLI re-execs for `--apply`).
 * Do **not** use `tsx/esm/api` `tsImport` + file:// URLs: on Windows nested
 * `@/` imports break with `?namespace=` query mangling (ERR_MODULE_NOT_FOUND).
 *
 * @param {string} relativeUnderSite e.g. features/admin/...
 */
async function importSiteTsModule(relativeUnderSite) {
  const specifier = new URL(
    `../site/${relativeUnderSite.replace(/\\/g, "/")}`,
    import.meta.url,
  ).href;
  return import(specifier);
}

/**
 * @param {string} repoRoot
 * @param {string} slug
 * @param {Buffer} png
 */
async function buildPublishForm(repoRoot, slug, png) {
  const { descriptorToFormState } = await importSiteTsModule(
    "features/admin/product-studio/form/svgEditorFormAdapters.ts",
  );
  const loaded = loadDescriptorJson(repoRoot, slug);
  if ("error" in loaded && loaded.error) {
    throw new Error(loaded.error);
  }
  const form = descriptorToFormState(loaded.descriptor);
  return {
    ...form,
    slug,
    planSymbolPngBase64: png.toString("base64"),
    planSymbolPngByteLength: png.length,
    planSymbolPngFileName: `${slug}.png`,
  };
}

/**
 * @param {string} _repoRoot
 */
async function loadDefaultPublisher(_repoRoot) {
  stubServerOnly();
  require("./general/loadEnvLocal.cjs").loadEnvLocal();
  const mod = await importSiteTsModule(
    "features/admin/product-studio/publish/publishToStorageAction.ts",
  );
  return mod.publishToStorageAction;
}

/**
 * CLI `--apply` must load site TypeScript. Re-exec once with `node --import tsx`
 * (same loader that works for `pushSvgCatalogToDb` / Product Studio modules).
 * Dry-run stays plain `node` (no TS imports).
 *
 * @returns {boolean} true if this process should exit (child already ran)
 */
function reexecApplyWithTsxIfNeeded() {
  if (process.env.MIGRATE_SVG_CATALOG_TSX === "1") {
    return false;
  }
  const argv = process.argv.slice(2);
  if (!argv.includes("--apply")) {
    return false;
  }
  const { spawnSync } = require("node:child_process");
  const scriptPath = fileURLToPath(import.meta.url);
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", scriptPath, ...argv],
    {
      stdio: "inherit",
      env: { ...process.env, MIGRATE_SVG_CATALOG_TSX: "1" },
      cwd: path.resolve(path.dirname(scriptPath), ".."),
    },
  );
  process.exit(result.status ?? 1);
  return true;
}

function printUsage() {
  console.error(`Usage:
  node scripts/migrate-svg-catalog-to-png.mjs --dry-run --slug=<slug>
  node scripts/migrate-svg-catalog-to-png.mjs --dry-run --all
  node scripts/migrate-svg-catalog-to-png.mjs --apply --slug=<slug>
  node scripts/migrate-svg-catalog-to-png.mjs --apply --all

Requires explicit --dry-run or --apply (no implicit apply).
Raster box = planSymbolRasterBox(widthMm, depthMm) from descriptor geometry
(2 px/mm, 40 mm pad). Source SVG: site/public/assets/others/legacy/svg-catalog/{slug}.svg.
Apply calls publishToStorageAction (same path as Product Studio UI).
Apply auto re-execs with \`node --import tsx\` so site TS modules resolve.`);
}

/**
 * @param {{
 *   argv?: string[];
 *   repoRoot?: string;
 *   publish?: Parameters<typeof applyMigrationEntry>[0]["publish"];
 *   writeIntermediate?: boolean;
 * }} [options]
 */
export async function runMigrateSvgCatalogToPng(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const repoRoot =
    options.repoRoot ??
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

  const parsed = parseMigrateArgs(argv);
  if (!parsed.ok) {
    printUsage();
    return { ok: false, code: 2, error: parsed.error };
  }

  const dir = descriptorDir(repoRoot);
  if (!existsSync(dir)) {
    return {
      ok: false,
      code: 2,
      error: `descriptor_dir_missing: ${dir}`,
    };
  }

  const available = listLiveDescriptorSlugs(readdirSync(dir));
  const selection = resolveSlugSelection({
    all: parsed.all,
    slug: parsed.slug,
    available,
  });
  if (!selection.ok) {
    return { ok: false, code: 2, error: selection.error };
  }

  const plan = buildMigrationPlan({
    slugs: selection.slugs,
    repoRoot,
  });

  console.log(
    `migrate-svg-catalog-to-png mode=${parsed.mode} slugs=${plan.length}`,
  );
  for (const entry of plan) {
    console.log(`  ${formatPlanLine(entry)}`);
  }

  if (parsed.mode === "dry-run") {
    const migratable = plan.filter(
      (e) => e.action === "migrate" || e.action === "re-publish",
    ).length;
    const skipped = plan.length - migratable;
    console.log(
      `dry-run complete: planned=${migratable} skipped=${skipped} (no writes, no publish)`,
    );
    return {
      ok: true,
      code: 0,
      mode: "dry-run",
      plan,
      migratable,
      skipped,
    };
  }

  // --apply
  let okCount = 0;
  let failCount = 0;
  let skipCount = 0;
  /** @type {Array<{ slug: string; error: string }>} */
  const failures = [];

  for (const entry of plan) {
    const result = await applyMigrationEntry({
      entry,
      repoRoot,
      publish: options.publish ?? null,
      writeIntermediate: options.writeIntermediate ?? true,
    });

    if (result.skipped) {
      skipCount += 1;
      console.log(`SKIP ${entry.slug}: ${result.error}`);
      continue;
    }
    if (!result.ok) {
      failCount += 1;
      failures.push({ slug: entry.slug, error: result.error ?? "unknown" });
      console.error(`FAIL ${entry.slug}: ${result.error}`);
      // Batch discipline (plan): stop on first mismatch / failure.
      break;
    }
    okCount += 1;
    console.log(
      `OK ${entry.slug}: ${result.widthPx}x${result.heightPx} px bytes=${result.bytes}` +
        (result.pngUrl ? ` url=${result.pngUrl}` : "") +
        (result.intermediatePath ? ` intermediate=${result.intermediatePath}` : ""),
    );
  }

  console.log(
    `apply complete: ok=${okCount} fail=${failCount} skip=${skipCount}`,
  );

  if (failCount > 0) {
    return {
      ok: false,
      code: 1,
      mode: "apply",
      plan,
      okCount,
      failCount,
      skipCount,
      failures,
    };
  }

  return {
    ok: true,
    code: 0,
    mode: "apply",
    plan,
    okCount,
    failCount,
    skipCount,
    failures,
  };
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  reexecApplyWithTsxIfNeeded();
  runMigrateSvgCatalogToPng()
    .then((result) => {
      if (!result.ok) {
        if (result.error) {
          console.error(`migrate-svg-catalog-to-png: ${result.error}`);
        }
        process.exit(result.code ?? 1);
      }
    })
    .catch((error) => {
      console.error(error);
      process.exit(2);
    });
}
