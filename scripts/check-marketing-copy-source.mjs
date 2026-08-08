#!/usr/bin/env node
/**
 * Fail when Phase 4 i18n consumer routes still import marketing copy from routeCopy.ts.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptsDir, "..", "site");
const manifestFile = path.join(siteRoot, "i18n", "marketing-parity-manifest.json");

const ROUTE_COPY_IMPORT_RE = /from\s+["']@\/lib\/site-data\/routeCopy["']/;
const I18N_IMPORT_RE =
  /from\s+["']next-intl(?:\/server)?["']|getTranslations|useTranslations/;

function loadManifest() {
  if (!fs.existsSync(manifestFile)) {
    throw new Error(`Missing manifest: ${manifestFile}`);
  }
  return JSON.parse(fs.readFileSync(manifestFile, "utf8"));
}

const manifest = loadManifest();
const consumerPaths = manifest.i18nConsumerPaths ?? [];
const failures = [];

for (const relPath of consumerPaths) {
  const abs = path.join(siteRoot, relPath.replaceAll("/", path.sep));
  if (!fs.existsSync(abs)) {
    failures.push({ file: relPath, issue: "missing consumer file" });
    continue;
  }

  const source = fs.readFileSync(abs, "utf8");
  if (ROUTE_COPY_IMPORT_RE.test(source)) {
    failures.push({ file: relPath, issue: "imports routeCopy.ts" });
  }
  if (!I18N_IMPORT_RE.test(source)) {
    failures.push({ file: relPath, issue: "missing getTranslations/useTranslations" });
  }
}

if (failures.length > 0) {
  process.stderr.write(`check-marketing-copy-source: ${failures.length} issue(s)\n`);
  for (const failure of failures) {
    process.stderr.write(`  ${failure.file} — ${failure.issue}\n`);
  }
  process.exit(1);
}

process.stdout.write(
  `check-marketing-copy-source: ok (${consumerPaths.length} consumer file(s))\n`,
);
