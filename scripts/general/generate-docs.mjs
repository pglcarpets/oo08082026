/**
 * One generator — one pass. No separate "check" that regenerates again.
 *
 * pnpm run docs:sync              test inventory + JSON (fast; after test changes)
 * pnpm run docs:sync:all          above + API route inventory
 * pnpm run docs:sync:coverage     sync + vitest coverage summary
 * pnpm run docs:check             sync + fail if tracked JSON/INVENTORY stale
 * pnpm run docs:check:coverage    coverage sync + fail if stale
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REPO_ROOT } from "../lib/repoRoot.mjs";

const protectedDir = path.dirname(fileURLToPath(import.meta.url));
const scriptsDir = path.resolve(protectedDir, "..");
const argv = process.argv.slice(2);
const withAll = argv.includes("--all");
const withCoverage = argv.includes("--coverage");
const withCheck = argv.includes("--check");

const TRACKED = ["tests/INVENTORY.md"];

/** Relative to scripts/ (siblings in general/ stay gate-critical; coverage stays at scripts/). */
const steps = [
  ...(withAll ? ["general/generate-route-index.mjs"] : []),
  "general/generate-test-inventory.mjs",
  ...(withCoverage
    ? ["generate-coverage-summary.mjs", "analyze-coverage-report.mjs"]
    : []),
];

for (const name of steps) {
  const result = spawnSync(process.execPath, [path.join(scriptsDir, name)], {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!withCheck) {
  process.exit(0);
}

const stale = [];
for (const rel of TRACKED) {
  const diff = spawnSync("git", ["diff", "--exit-code", "--", rel], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  if (diff.status !== 0) {
    stale.push(rel);
  }
}

if (stale.length) {
  console.error(
    "Generated artifacts are stale — run `pnpm run docs:sync` and commit:",
  );
  for (const f of stale) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("Generated artifacts are up to date.");
