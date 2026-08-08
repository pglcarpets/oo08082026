/**
 * Fail if co-located test files exist under live product source (site/).
 * Policy: tests live under monorepo tests/ only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const monorepoRoot = process.env.MONOREPO_ROOT
  ? path.resolve(process.env.MONOREPO_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
/** Product source trees only — not monorepo-root app/ (missing after flatten). */
const SCAN_ROOTS = [
  "site/app",
  "site/components",
  "site/features",
  "site/lib",
  "site/platform",
  "site/i18n",
];
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "archive",
  "dist",
  "coverage",
  "_archive",
]);
const TEST_FILE = /\.(test|spec)\.(ts|tsx|js|jsx)$/i;

function walk(dir, hits) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, hits);
      continue;
    }
    if (TEST_FILE.test(entry.name)) {
      hits.push(path.relative(monorepoRoot, full).replace(/\\/g, "/"));
    }
  }
}

const violations = [];
for (const root of SCAN_ROOTS) {
  walk(path.join(monorepoRoot, root), violations);
}

if (violations.length) {
  console.error("Co-located tests found under product source (site/):");
  for (const file of violations.sort()) console.error(`  - ${file}`);
  console.error("\nMove to monorepo tests/ — see Testing-handbook.md");
  process.exit(1);
}

console.log(
  "test layout OK — no co-located *.test.* / *.spec.* under site/ source trees",
);
