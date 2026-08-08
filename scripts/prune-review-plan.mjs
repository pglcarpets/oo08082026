/**
 * prune-review-plan.mjs  (READ-ONLY — deletes nothing)
 * Re-scans the live tree, groups exact SHA-1 duplicates, and writes a
 * reviewable plan listing EVERY group with both/all sides so the owner can
 * decide which to keep before any prune.
 *
 * Output: results/asset-cutover/prune-review-plan.md  (+ .json with full data)
 */
import { createHash } from "node:crypto";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve("site/public/assets");
const OUT = path.resolve("results/asset-cutover/prune-review-plan.json");
const OUT_MD = path.resolve("results/asset-cutover/prune-review-plan.md");
const IMAGE_EXT = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif", ".avif"]);

function hashFile(file) {
  return new Promise((resolve, reject) => {
    const h = createHash("sha1");
    createReadStream(file)
      .on("data", (c) => h.update(c))
      .on("end", () => resolve(h.digest("hex")))
      .on("error", reject);
  });
}

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

const files = (await walk(ROOT)).filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()));
const byHash = new Map();
for (const file of files) {
  const st = await fs.stat(file);
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  let sha1;
  try {
    sha1 = await hashFile(file);
  } catch {
    continue;
  }
  if (!byHash.has(sha1)) byHash.set(sha1, []);
  byHash.get(sha1).push({ rel, bytes: st.size });
}

const groups = [];
for (const [sha1, list] of byHash) {
  if (list.length < 2) continue;
  list.sort((a, b) => a.rel.localeCompare(b.rel));
  const waste = list.slice(1).reduce((s, r) => s + r.bytes, 0);
  groups.push({ sha1, count: list.length, wasteBytes: waste, paths: list.map((r) => r.rel) });
}
groups.sort((a, b) => b.wasteBytes - a.wasteBytes);

const totalWaste = groups.reduce((s, g) => s + g.wasteBytes, 0);

const lines = [
  `# Prune review plan (READ-ONLY — nothing deleted)`,
  ``,
  `**Generated:** ${new Date().toISOString()}`,
  `**Root:** \`${ROOT}\``,
  `**Groups:** ${groups.length} · **Waste if one kept per group:** ${(totalWaste / 1048576).toFixed(1)} MB`,
  ``,
  `> Decision column left blank for owner review. Keep ONE side per group;`,
  `> the others are byte-identical (same SHA-1) and can be removed after approval.`,
  ``,
  `| # | Waste (KB) | Group members (keep one) |`,
  `|---|-----------:|--------------------------|`,
];
groups.forEach((g, i) => {
  const members = g.paths.map((p) => `\`${p}\``).join("  \n     ");
  lines.push(`| ${i + 1} | ${(g.wasteBytes / 1024).toFixed(0)} | ${members} |`);
});
lines.push("", `Total waste reclaimable: **${(totalWaste / 1048576).toFixed(1)} MB**`);

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), groups, totalWasteMB: +(totalWaste / 1048576).toFixed(1) }, null, 2), "utf8");
await fs.writeFile(OUT_MD, lines.join("\n"), "utf8");

console.log(`Wrote ${groups.length} groups to ${OUT_MD}`);
console.log(`Total waste reclaimable: ${(totalWaste / 1048576).toFixed(1)} MB`);