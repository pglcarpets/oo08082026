/**
 * Reverse path rewrite: new → old for rollback of string rewrites.
 *
 * Does NOT move bytes on disk. Undoes code/DB path strings after a cutover
 * if you need to roll back references (not files).
 *
 * Map sources (first match wins):
 *   1. results/asset-cutover/path-map-reverse.generated.json
 *   2. Invert results/asset-cutover/path-map.generated.json
 *
 * Prerequisites:
 *   pnpm exec node scripts/asset-path-map.mjs
 *
 * Usage:
 *   pnpm exec node scripts/reverse-asset-paths.mjs --code --dry
 *   pnpm exec node scripts/reverse-asset-paths.mjs --code --apply
 *   pnpm exec node scripts/reverse-asset-paths.mjs --db --dry
 *   pnpm exec node scripts/reverse-asset-paths.mjs --all --apply
 *
 * Flags: same as fix-asset-paths.mjs (--dry default, --apply, --code, --db, --all)
 *
 * Report: results/asset-cutover/path-fix-reverse-report.json
 */
import { join, relative } from "node:path";
import {
  CODE_ROOTS,
  OUT_DIR,
  REPO_ROOT,
  REVERSE_MAP_PATH,
  applyPathMap,
  loadReverseMap,
  orderMapEntries,
  parseRewriteFlags,
  rewriteCodePaths,
  rewriteDbProductPaths,
  writeReport,
} from "./lib/assetPathMapTools.mjs";

const REPORT_PATH = join(OUT_DIR, "path-fix-reverse-report.json");

function printHelp() {
  console.log(`reverse-asset-paths.mjs — new → old path rewrite (rollback strings only)

Usage:
  pnpm exec node scripts/reverse-asset-paths.mjs [--code|--db|--all] [--dry|--apply]

Defaults: --dry, and --code if no target flag is set.

Requires forward map (or reverse map):
  pnpm exec node scripts/asset-path-map.mjs
   → results/asset-cutover/path-map.generated.json

Code roots: ${CODE_ROOTS.join(", ")}
Report: ${relative(REPO_ROOT, REPORT_PATH)}

Note: does not move files on disk; only rewrites string references.
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
        direction: "reverse",
        mode: flags.apply ? "apply" : "dry",
        code: flags.code,
        db: flags.db,
      },
      null,
      2,
    ),
  );

  let loaded;
  try {
    loaded = await loadReverseMap({ write: true });
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }

  const ordered = orderMapEntries(loaded.map);
  console.log(
    `map entries: ${ordered.length} (source: ${typeof loaded.source === "string" && loaded.source.includes("inverted") ? loaded.source : relative(REPO_ROOT, REVERSE_MAP_PATH)})`,
  );
  if (loaded.conflicts?.length) {
    console.warn(
      `reverse collisions: ${loaded.conflicts.length} (kept longest old path per new path)`,
    );
  }

  /** @type {object} */
  const report = {
    direction: "reverse",
    generatedAt: new Date().toISOString(),
    mode: {
      dry: flags.dry,
      apply: flags.apply,
      code: flags.code,
      db: flags.db,
    },
    mapSource: loaded.source,
    mapPath: relative(REPO_ROOT, REVERSE_MAP_PATH).split("\\").join("/"),
    mapEntries: ordered.length,
    reverseConflicts: loaded.conflicts?.length ?? 0,
    reverseConflictSamples: (loaded.conflicts || []).slice(0, 20),
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
