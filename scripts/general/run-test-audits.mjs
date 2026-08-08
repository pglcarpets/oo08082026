#!/usr/bin/env node
/**
 * Run hollow / gate-skip / eslint-disable / api-route test audits.
 * Presets match release gates — avoids five separate pnpm scripts in package.json.
 *
 *   node scripts/general/run-test-audits.mjs --preset=release
 *   node scripts/general/run-test-audits.mjs --preset=fast
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** @param {string} rel @param {string[]} args */
function runGeneral(rel, args = []) {
  const script = path.join(ROOT, "scripts/general", rel);
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const preset = process.argv.find((arg) => arg.startsWith("--preset="))?.split("=")[1];

if (preset === "release") {
  runGeneral("audit-hollow-tests.mjs");
  runGeneral("audit-gate-skips.mjs");
  runGeneral("audit-eslint-disable.mjs");
  runGeneral("audit-api-route-safety.mjs");
  process.exit(0);
}

if (preset === "fast") {
  runGeneral("audit-hollow-tests.mjs", ["--exclude-marketing"]);
  runGeneral("audit-eslint-disable.mjs");
  runGeneral("audit-api-route-safety.mjs");
  process.exit(0);
}

console.error("run-test-audits: pass --preset=release or --preset=fast");
process.exit(1);
