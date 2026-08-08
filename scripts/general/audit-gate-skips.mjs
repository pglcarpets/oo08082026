#!/usr/bin/env node
/**
 * Fail on test.skip / describe.skip in gate Playwright specs.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../..");
const configPath = path.join(
  monorepoRoot,
  "config",
  "build",
  "playwright-gate-specs.json",
);

if (!existsSync(configPath)) {
  process.stderr.write(`Missing ${configPath}\n`);
  process.exit(1);
}

const { specs = [] } = JSON.parse(readFileSync(configPath, "utf8"));
const skipRe = /\b(test|describe)\s*\.\s*skip\s*\(/;
const failures = [];

for (const spec of specs) {
  const filePath = path.join(monorepoRoot, spec);
  if (!existsSync(filePath)) {
    failures.push({ spec, reason: "missing-file" });
    continue;
  }
  const source = readFileSync(filePath, "utf8");
  if (skipRe.test(source)) {
    failures.push({ spec, reason: "contains-skip" });
  }
}

if (failures.length > 0) {
  process.stderr.write(`audit-gate-skips: ${failures.length} issue(s)\n`);
  for (const f of failures) {
    process.stderr.write(`  ${f.spec} — ${f.reason}\n`);
  }
  process.exit(1);
}

process.stdout.write("audit-gate-skips: ok\n");
