#!/usr/bin/env node
/**
 * Fail on hollow Vitest cases (release-gate Phase 04b).
 * Usage: node scripts/general/audit-hollow-tests.mjs [--exclude-marketing]
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findHollowPatternViolations } from "./hollow-test-patterns.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, "../..");
const testsRoot = path.join(siteRoot, "tests");

const excludeMarketing = process.argv.includes("--exclude-marketing");
const MARKETING_SEGMENT = `${path.sep}tests${path.sep}unit${path.sep}app${path.sep}(site)${path.sep}`;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

const failures = [];

for (const file of walk(testsRoot)) {
  if (excludeMarketing && file.includes(MARKETING_SEGMENT)) continue;

  const rel = path.relative(siteRoot, file).replaceAll("\\", "/");
  const source = readFileSync(file, "utf8");
  failures.push(...findHollowPatternViolations(source, { file: rel }));
}

if (failures.length > 0) {
  process.stderr.write(`audit-hollow-tests: ${failures.length} issue(s)\n`);
  for (const f of failures) {
    process.stderr.write(`  ${f.file} — ${f.reason}\n`);
  }
  process.exit(1);
}

process.stdout.write("audit-hollow-tests: ok\n");
