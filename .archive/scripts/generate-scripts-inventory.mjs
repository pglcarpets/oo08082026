#!/usr/bin/env node
/**
 * Inventory scripts/ and mark which entries are wired in package.json.
 * Output: results/scripts-inventory.csv
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const WORKSPACE_ROOT = path.resolve(ROOT, "..");
const SCRIPTS_DIR = path.join(ROOT, "scripts");
const OUT = path.join(WORKSPACE_ROOT, "results", "scripts-inventory.csv");

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const wired = new Set();

for (const cmd of Object.values(pkg.scripts)) {
  for (const m of String(cmd).matchAll(/scripts[\\/][^\s'"]+/g)) {
    wired.add(m[0].replace(/\\/g, "/"));
  }
}

/** @param {string} dir @param {string[]} acc */
function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "lib" || entry.name === "node_modules") continue;
      walk(abs, acc);
      continue;
    }
    if (!/\.(ts|mjs|js|py|ps1|sh)$/.test(entry.name)) continue;
    acc.push(path.relative(ROOT, abs).replace(/\\/g, "/"));
  }
  return acc;
}

function escapeCsv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

const files = walk(SCRIPTS_DIR).sort();
const rows = [
  ["script", "extension", "wired_in_package_json", "category"].join(","),
];

for (const rel of files) {
  const ext = path.extname(rel).slice(1);
  const isWired = Array.from(wired).some((ref) => rel === ref || rel.endsWith(ref.replace("scripts/", "")));
  let category = "utility";
  const base = path.basename(rel);
  if (base.startsWith("debug-")) category = "debug";
  else if (base.startsWith("audit")) category = "audit";
  else if (base.startsWith("db_") || rel.includes("supabase") || rel.includes("drizzle")) category = "database";
  else if (rel.includes("catalog") || rel.includes("Cdn") || rel.includes("cdn") || rel.includes("r2")) category = "assets";
  else if (base.startsWith("generate-") || base.startsWith("format-")) category = "report";
  else if (base.startsWith("test-") || base.includes("clean-test")) category = "test-tooling";

  rows.push(
    [escapeCsv(rel), escapeCsv(ext), escapeCsv(isWired ? "yes" : "no"), escapeCsv(category)].join(","),
  );
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${rows.join("\n")}\n`, "utf8");
console.log(`Wrote ${OUT} (${files.length} scripts, ${files.filter((f) => wired.has(f) || Array.from(wired).some((w) => f.endsWith(w.replace("scripts/", "")))).length} wired)`);
