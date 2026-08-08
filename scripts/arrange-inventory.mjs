import { createHash } from "node:crypto";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";

const WORK = process.cwd();
const SOURCES = [
  { id: "work-assets", root: path.join(WORK, "site/public/assets"), kind: "target-tree" },
  { id: "r2-images", root: "E:/Websites/OandO-backups/r2-oando-asset-cdn-20260805/images", kind: "r2-download" },
  { id: "zip-images", root: "E:/Websites/OandO-backups/r2-oando-asset-cdn-20260805/backups/repo/oofplweb-20260711052627-unzipped/site/public/images", kind: "repo-zip" },
  { id: "e-oandoweb", root: "E:/Websites/OandOWeb/site/public/images", kind: "e-mirror" },
  { id: "e-final", root: "E:/Websites/Final_oando_0504-0704/public/images", kind: "e-mirror" },
];

const IMAGE_EXT = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".avif"]);

async function walk(dir, acc = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) await walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function hashFile(file) {
  return new Promise((resolve, reject) => {
    const h = createHash("sha1");
    const s = createReadStream(file);
    s.on("data", (c) => h.update(c));
    s.on("error", reject);
    s.on("end", () => resolve(h.digest("hex")));
  });
}

/** Propose target key under assets/ domains */
function proposeKey(sourceId, relPosix) {
  const lower = relPosix.toLowerCase();
  // already domain tree
  if (lower.startsWith("marketing/") || lower.startsWith("catalog/") || lower.startsWith("planner/") || lower.startsWith("studio/")) {
    return relPosix;
  }
  // r2 download uses images/...
  let rel = relPosix.replace(/^images\//i, "");
  if (rel.startsWith("catalog/") || rel.includes("/oando-")) {
    return `catalog/${rel.replace(/^catalog\//, "")}`;
  }
  if (rel.startsWith("products/")) return `catalog/products/${rel.slice("products/".length)}`;
  const marketing = ["hero", "client-logos", "projects", "home", "brand", "fallback", "montage", "partners", "team"];
  for (const m of marketing) {
    if (rel === m || rel.startsWith(m + "/")) return `marketing/${rel}`;
  }
  const legacy = ["chairs", "tables", "workstations", "storage", "soft-seating", "educational", "collaborative"];
  for (const l of legacy) {
    if (rel === l || rel.startsWith(l + "/")) return `catalog/legacy-categories/${rel}`;
  }
  // default: park under catalog/recovered/<source>/
  return `catalog/recovered/${sourceId}/${rel}`;
}

async function main() {
  const report = { generatedAt: new Date().toISOString(), sources: [], byTarget: {} };
  for (const src of SOURCES) {
    const exists = await fs.stat(src.root).then(() => true).catch(() => false);
    const entry = { ...src, exists, files: 0, imageFiles: 0, bytes: 0, sample: [] };
    if (!exists) {
      report.sources.push(entry);
      continue;
    }
    const files = await walk(src.root);
    entry.files = files.length;
    for (const file of files) {
      const st = await fs.stat(file);
      entry.bytes += st.size;
      const ext = path.extname(file).toLowerCase();
      if (!IMAGE_EXT.has(ext)) continue;
      entry.imageFiles++;
      const rel = path.relative(src.root, file).split(path.sep).join("/");
      const target = proposeKey(src.id, rel);
      if (!report.byTarget[target]) report.byTarget[target] = [];
      // hash only for smaller files or first N - full hash is slow; hash files < 5MB or sample
      let sha1 = null;
      if (st.size <= 5 * 1024 * 1024 && entry.imageFiles <= 3000) {
        try { sha1 = await hashFile(file); } catch { sha1 = null; }
      }
      report.byTarget[target].push({
        source: src.id,
        path: file,
        rel,
        bytes: st.size,
        sha1,
      });
      if (entry.sample.length < 5) entry.sample.push(rel);
    }
    entry.mb = Math.round((entry.bytes / (1024 * 1024)) * 10) / 10;
    report.sources.push(entry);
    console.log(src.id, "images", entry.imageFiles, "mb", entry.mb);
  }

  // summary: targets with multiple sources, only-in-one-source
  let multi = 0, single = 0;
  const conflicts = [];
  for (const [target, list] of Object.entries(report.byTarget)) {
    if (list.length > 1) {
      multi++;
      const hashes = [...new Set(list.map((x) => x.sha1).filter(Boolean))];
      if (hashes.length > 1) conflicts.push({ target, sources: list.map((x) => x.source), hashes });
    } else single++;
  }
  report.stats = {
    targets: Object.keys(report.byTarget).length,
    multiSourceTargets: multi,
    singleSourceTargets: single,
    hashConflicts: conflicts.length,
  };
  report.conflictSample = conflicts.slice(0, 50);

  const outDir = path.join(WORK, "results/asset-cutover");
  await fs.mkdir(outDir, { recursive: true });
  // byTarget is huge — write compact sources + stats + conflicts; full map as separate lighter file
  const fullMap = Object.fromEntries(
    Object.entries(report.byTarget).map(([k, v]) => [
      k,
      v.map(({ source, rel, bytes, sha1 }) => ({ source, rel, bytes, sha1 })),
    ]),
  );
  await fs.writeFile(path.join(outDir, "arrange-map.json"), JSON.stringify(fullMap));
  const summary = {
    generatedAt: report.generatedAt,
    sources: report.sources,
    stats: report.stats,
    conflictSample: report.conflictSample,
    note: "NO upload. Arrange-only. Resolve conflicts then build final assets tree before R2 upload.",
  };
  await fs.writeFile(path.join(outDir, "arrange-sources.json"), JSON.stringify(summary, null, 2));

  const md = [
    "# Arrange inventory (no upload)",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Sources",
    "",
    "| id | exists | images | MB | root |",
    "|----|--------|--------|-----|------|",
    ...report.sources.map(
      (s) =>
        `| ${s.id} | ${s.exists} | ${s.imageFiles} | ${s.mb ?? 0} | \`${s.root}\` |`,
    ),
    "",
    "## Stats",
    "",
    `- Targets (proposed keys): **${report.stats.targets}**`,
    `- Multi-source targets: **${report.stats.multiSourceTargets}**`,
    `- Hash conflicts (sampleable): **${report.stats.hashConflicts}**`,
    "",
    "Full map: `arrange-map.json` (large).",
    "",
    "## Rule",
    "",
    "Do **not** upload to R2 until conflicts are resolved and a final arranged tree is written.",
    "",
  ].join("\n");
  await fs.writeFile(path.join(outDir, "arrange-summary.md"), md);
  console.log("WROTE results/asset-cutover/arrange-*.json/md", report.stats);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
