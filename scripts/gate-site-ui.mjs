#!/usr/bin/env node
/**
 * Site UI CI gate — matrix, static checks, Playwright install, wave 1+2 e2e.
 * Replaces four separate package.json scripts used by .github/workflows/site-ui.yml.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @param {string[]} args */
function run(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

/** @param {string} rel @param {string[]} args */
function runNode(rel, args = []) {
  run(process.execPath, [path.join(ROOT, "scripts", rel), ...args]);
}

runNode("clean-test-artifacts.mjs");
runNode("generate-site-ui-route-matrix.mjs");
runNode("check-site-page-shell.mjs");
runNode("check-i18n-key-parity.mjs");
runNode("check-marketing-copy-source.mjs");
runNode("check-marketing-inline-style.mjs");
runNode("check-homepage-dialect.mjs");
run("pnpm", ["exec", "playwright", "install", "chromium"]);
run("pnpm", [
  "exec",
  "playwright",
  "test",
  "-c",
  "config/build/playwright.config.ts",
  "tests/e2e/site-locale-switch.spec.ts",
  "tests/e2e/site-visual-regression.spec.ts",
]);
