#!/usr/bin/env node
/**
 * Run oxlint one folder at a time (site → tests → tech-docs-generator → scripts → config).
 * Keeps full coverage without one giant multi-root invocation.
 *
 *   node scripts/general/run-oxlint.mjs
 *   node scripts/general/run-oxlint.mjs --fix
 *   node scripts/general/run-oxlint.mjs --type-aware
 *   node scripts/general/run-oxlint.mjs site          # single folder
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DEFAULT_FOLDERS = ["site", "tests", "tech-docs-generator", "scripts", "config"];

const args = process.argv.slice(2);
const flags = [];
const folders = [];

for (const arg of args) {
  if (arg.startsWith("-")) {
    flags.push(arg);
  } else {
    folders.push(arg);
  }
}

const targets = folders.length > 0 ? folders : DEFAULT_FOLDERS;
const oxlintBin = path.join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "oxlint.CMD" : "oxlint",
);

let failed = 0;
for (const folder of targets) {
  console.log(`\n=== oxlint ${folder} ===`);
  const result = spawnSync(
    oxlintBin,
    ["-c", ".oxlintrc.json", ...flags, folder],
    { cwd: root, stdio: "inherit", shell: process.platform === "win32" },
  );
  if (result.error) {
    console.error(result.error);
    failed = 1;
    break;
  }
  if (result.status !== 0) {
    failed = result.status === null ? 1 : result.status;
    break;
  }
}

process.exit(failed);
