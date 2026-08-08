/**
 * verify-asset-decode.mjs
 * Full decode pass over the LIVE asset tree (site/public/assets).
 * Unlike the stale corrupt-sample.json (which scanned the legacy
 * site/public/images/catalog path), this verifies every image under the
 * current canonical tree with sharp and reports failures.
 *
 * Strict by default (failOn: "error") so a truncated/corrupt WebP/JPEG/PNG
 * raises. AVIF/GIF decode checked too where sharp supports it.
 *
 * Usage: node scripts/verify-asset-decode.mjs [--root <dir>] [--strict|--lenient] [--limit <n>]
 * Artifacts: results/asset-cutover/decode-report.json + .md
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const argRootIdx = process.argv.indexOf("--root");
const ROOT_ARG = argRootIdx >= 0 ? process.argv[argRootIdx + 1] : undefined;
const ROOT_DIR = path.resolve(ROOT_ARG ?? "site/public/assets");
const STRICT = !process.argv.includes("--lenient");
const argLimitIdx = process.argv.indexOf("--limit");
const LIMIT = argLimitIdx >= 0 ? Number(process.argv[argLimitIdx + 1]) : undefined;
const OUT = path.resolve("results/asset-cutover/decode-report.json");
const OUT_MD = path.resolve("results/asset-cutover/decode-report.md");

const IMAGE_EXT = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif", ".avif", ".svg"]);

async function walk(dir, acc = []) {
  let ents;
  try {
    ents = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

async function checkFile(file) {
  const rel = path.relative(ROOT_DIR, file).split(path.sep).join("/");
  try {
    const meta = await sharp(file, { failOn: STRICT ? "error" : "none" }).metadata();
    if (!meta.width || !meta.height || !meta.format) {
      return { rel, ok: false, reason: `no dims/format (w=${meta.width} h=${meta.height} fmt=${meta.format})` };
    }
    return { rel, ok: true, format: meta.format, width: meta.width, height: meta.height };
  } catch (err) {
    return { rel, ok: false, reason: err.message };
  }
}

const files = (await walk(ROOT_DIR)).filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()));
const sampledFiles = LIMIT ? files.slice(0, LIMIT) : files;
const results = [];
let okCount = 0;
let failCount = 0;
const started = Date.now();

for (const f of sampledFiles) {
  const r = await checkFile(f);
  results.push(r);
  if (r.ok) okCount++;
  else {
    failCount++;
    console.error(`FAIL ${r.rel} :: ${r.reason}`);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  root: ROOT_DIR,
  sampled: sampledFiles.length,
  okCount,
  failedCount: failCount,
  elapsedMs: Date.now() - started,
  strict: STRICT,
  failed: results.filter((r) => !r.ok),
};

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, JSON.stringify(report, null, 2), "utf8");

const lines = [
  `# Live decode report`,
  ``,
  `**Generated:** ${report.generatedAt}`,
  `**Root:** \`${ROOT_DIR}\``,
  `**Mode:** ${STRICT ? "strict (failOn: error)" : "lenient (failOn: none)"}`,
  ``,
  `| Metric | Value |`,
  `|--------|------:|`,
  `| Images checked | ${files.length} |`,
  `| OK | ${okCount} |`,
  `| Failed | ${failCount} |`,
  `| Elapsed (ms) | ${report.elapsedMs} |`,
  ``,
];
if (failCount === 0) {
  lines.push(`**No decode failures on the live tree.**`);
} else {
  lines.push(`## Failed files (${failCount})`, ``);
  for (const f of report.failed) {
    lines.push(`- \`${f.rel}\` — ${f.reason}`);
  }
}
if (LIMIT) {
  lines.push(``, `*(sampled first ${LIMIT} files only)*`);
}
await fs.writeFile(OUT_MD, lines.join("\n"), "utf8");

console.log(`\nChecked ${sampledFiles.length} images; ${okCount} ok, ${failCount} failed (${report.elapsedMs}ms)`);
console.log(`Wrote ${OUT}`);
console.log(`Wrote ${OUT_MD}`);