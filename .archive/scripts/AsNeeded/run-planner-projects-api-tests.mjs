/**
 * Focused vitest for Planner projects API contract tests.
 * Usage (repo root): node scripts/AsNeeded/run-planner-projects-api-tests.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const vitestEntry = path.join(repoRoot, "node_modules", "vitest", "vitest.mjs");

const targets = [
  "tests/unit/app/api/Planner/projects",
  "tests/unit/lib/Planner/plannerApi.test.ts",
];

const result = spawnSync(
  process.execPath,
  [vitestEntry, "run", "--config", "tests/vitest.config.ts", ...targets],
  {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit",
    shell: false,
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status === null ? 1 : result.status);
