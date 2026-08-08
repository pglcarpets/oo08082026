/**
 * Forward path rewrite: old → new using results/asset-cutover/path-map.generated.json
 *
 * Does NOT move bytes on disk. Rewrites path strings in code and/or Products DB.
 *
 * Prerequisites:
 *   pnpm exec node scripts/asset-path-map.mjs
 *   (creates results/asset-cutover/path-map.generated.json; this script can also build it)
 *
 * Usage:
 *   pnpm exec node scripts/fix-asset-paths.mjs --code --dry
 *   pnpm exec node scripts/fix-asset-paths.mjs --code --apply
 *   pnpm exec node scripts/fix-asset-paths.mjs --db --dry
 *   pnpm exec node scripts/fix-asset-paths.mjs --all --apply
 *
 * Flags:
 *   --dry     (default) report only, no writes
 *   --apply   write files / DB rows
 *   --code    rewrite site/features, site/i18n/messages, site/components, tests
 *   --db      rewrite products.images, flagship_image, scene_images (Products Supabase)
 *   --all     --code + --db
 *
 * Report: results/asset-cutover/path-fix-forward-report.json
 */
import { relative } from "node:path";
import {
  CODE_ROOTS,
  FORWARD_MAP_PATH,
  OUT_DIR,
  REPO_ROOT,
  applyPathMap,
  loadForwardMap,
  orderMapEntries,
  parseRewriteFlags,
  rewriteCodePaths,
  rewriteDbProductPaths,
  writeReport,
} from "./lib/assetPathMapTools.mjs";
import { join } from "node:path";

const REPORT_PATH = join(OUT_DIR, "path-fix-forward-report.json");

function printHelp() {
  console.log(`fix-asset-paths.mjs — old → new path rewrite (local map only)

Usage:
  pnpm exec node scripts/fix-asset-paths.mjs [--code|--db|--all] [--dry|--apply]

Defaults: --dry, and --code if no target flag is set.

Requires: results/asset-cutover/path-map.generated.json
  Build with: pnpm exec node scripts/asset-path-map.mjs

Code roots: ${CODE_ROOTS.join(", ")}
Report: ${relative(REPO_ROOT, REPORT_PATH)}
`);
}

async function main() {
  const flags = parseRewriteFlags(process.argv.slice(2));
  if (flags.help) {
    printHelp();
    process.exit(0);
  }

  console.log(
    JSON.stringify(
      {
        direction: "forward",
        mode: flags.apply ? "apply" : "dry",
        code: flags.code,
        db: flags.db,
      },
      null,
      2,
    ),
  );

  let map;
  try {
    map = await loadForwardMap();
  } catch (e) {
    console.error(
      "Failed to load path map. Run: pnpm exec node scripts/asset-path-map.mjs",
    );
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }

  const ordered = orderMapEntries(map);
  console.log(`map entries: ${ordered.length} (${relative(REPO_ROOT, FORWARD_MAP_PATH)})`);

  /** @type {object} */
  const report = {
    direction: "forward",
    generatedAt: new Date().toISOString(),
    mode: {
      dry: flags.dry,
      apply: flags.apply,
      code: flags.code,
      db: flags.db,
    },
    mapPath: relative(REPO_ROOT, FORWARD_MAP_PATH).split("\\").join("/"),
    mapEntries: ordered.length,
    code: null,
    db: null,
  };

  if (flags.code) {
    console.log("scanning code…");
    report.code = rewriteCodePaths(ordered, { apply: flags.apply });
    console.log(
      `code: scanned=${report.code.filesScanned} wouldChange=${report.code.filesWouldChange} hits=${report.code.replacementHits}${flags.apply ? ` wrote=${report.code.filesChanged}` : " (dry)"}`,
    );
  }

  if (flags.db) {
    console.log("scanning products DB…");
    try {
      report.db = await rewriteDbProductPaths(ordered, { apply: flags.apply });
      if (report.db.skipped) {
        console.warn(`db skipped: ${report.db.reason}`);
      } else {
        console.log(
          `db: rows=${report.db.rowsScanned} wouldChange=${report.db.rowsWouldChange} hits=${report.db.replacementHits}${flags.apply ? ` wrote=${report.db.rowsChanged}` : " (dry)"}`,
        );
        if (report.db.errors?.length) {
          console.warn(`db errors: ${report.db.errors.length}`);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      report.db = { skipped: true, reason: msg, errors: [msg] };
      console.error("db failed:", msg);
      if (flags.apply) {
        writeReport(REPORT_PATH, report);
        process.exit(1);
      }
    }
  }

  // Tiny self-check sample (not written)
  if (ordered.length > 0) {
    const [from, to] = ordered[0];
    const probe = applyPathMap(`prefix ${from} suffix`, [[from, to]]);
    report.selfCheck = {
      longestKey: from,
      probeHits: probe.hits,
      ok: probe.text.includes(to) && !probe.text.includes(from),
    };
  }

  writeReport(REPORT_PATH, report);
  console.log(`report: ${relative(REPO_ROOT, REPORT_PATH)}`);

  if (flags.db && report.db?.skipped && flags.apply) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
