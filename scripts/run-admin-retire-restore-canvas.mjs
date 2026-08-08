/**
 * Admin retire → restore → Planner canvas proof (no pwsh required).
 * Evidence: results/admin/retire-restore-canvas/run-meta.json
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(siteRoot, "..");
const evidenceDir = path.join(repoRoot, "results", "admin", "retire-restore-canvas");

mkdirSync(evidenceDir, { recursive: true });

const env = {
  ...process.env,
  DEV_AUTH_BYPASS: "1",
};

function run(command, args, cwd = siteRoot) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return result.status ?? 1;
}

console.log("Ensuring side-table-001 lifecycle precondition (live)...");
const pre = run("node", ["scripts/ensure-retire-restore-precondition.mjs"]);
if (pre !== 0) {
  writeRunMeta(pre, "precondition-fail");
  process.exit(pre);
}

console.log("Running admin-svg-retire-restore.spec.ts (DEV_AUTH_BYPASS=1)...");
const testExit = run("pnpm", [
  "exec",
  "playwright",
  "test",
  "-c",
  "config/build/playwright.config.ts",
  "../tests/e2e/admin-svg-retire-restore.spec.ts",
  "--reporter=list",
]);

writeRunMeta(testExit, testExit === 0 ? "pass" : "fail");

if (testExit === 0) {
  console.log("Playwright passed — clearing Failures.md entry (node, no pwsh)...");
  const complete = run("node", [
    "scripts/complete-admin-retire-restore-proof.mjs",
  ]);
  process.exit(complete === 0 ? 0 : complete);
}

process.exit(testExit);

function writeRunMeta(exitCode, status) {
  writeFileSync(
    path.join(evidenceDir, "run-meta.json"),
    `${JSON.stringify(
      {
        command: "pnpm run test:e2e:admin-retire-restore",
        exitCode,
        status,
        devAuthBypass: "1",
        spec: "../tests/e2e/admin-svg-retire-restore.spec.ts",
        at: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}