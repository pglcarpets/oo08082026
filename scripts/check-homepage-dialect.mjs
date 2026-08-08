#!/usr/bin/env node
/**
 * Homepage dialect check — scheme-page marketing wrapper debt (Phase 5e).
 * Mode: error (default) | warn via SITE_UI_DIALECT_MODE=warn
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptsDir, "..");
const siteApp = path.join(siteRoot, "app", "(site)");
const mode = process.env.SITE_UI_DIALECT_MODE === "warn" ? "warn" : "error";

const LEGACY_WRAPPER_RE = /scheme-page flex min-h-screen flex-col items-center/;
const LEGACY_SECTION_TITLE_RE = /<h2[^>]*className="[^"]*typ-section/;

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, files);
    else if (/\.(tsx|jsx)$/.test(entry.name)) files.push(abs);
  }
  return files;
}

const hits = [];
for (const file of walk(siteApp)) {
  const rel = path.relative(siteRoot, file).replaceAll("\\", "/");
  const source = fs.readFileSync(file, "utf8");
  if (LEGACY_WRAPPER_RE.test(source)) {
    hits.push({ file: rel, rule: "legacy-scheme-page-wrapper" });
  }
  if (LEGACY_SECTION_TITLE_RE.test(source)) {
    hits.push({ file: rel, rule: "typ-section-h2" });
  }
}

if (hits.length > 0) {
  const header = `check-homepage-dialect (${mode}): ${hits.length} issue(s)\n`;
  if (mode === "error") process.stderr.write(header);
  else process.stdout.write(header);
  for (const hit of hits) {
    const line = `  ${hit.file} — ${hit.rule}\n`;
    if (mode === "error") process.stderr.write(line);
    else process.stdout.write(line);
  }
  if (mode === "error") process.exit(1);
}

process.stdout.write(`check-homepage-dialect: ok (${mode})\n`);
