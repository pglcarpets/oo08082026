#!/usr/bin/env node
/**
 * Fail when marketing routes use inline style attributes (Phase 5e).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptsDir, "..");
const targets = [
  path.join(siteRoot, "app", "(site)"),
  path.join(siteRoot, "components", "home"),
  path.join(siteRoot, "components", "contact"),
  path.join(siteRoot, "components", "career"),
  path.join(siteRoot, "components", "support"),
];

const STYLE_ATTR_RE = /\bstyle=\{\{/;

/** Documented exceptions — dynamic layout or OG image generation. */
const ALLOWLIST = new Set([
  "app/(site)/opengraph-image.tsx",
  "app/(site)/products/[category]/[product]/ProductViewer.tsx",
  "components/home/Hero.tsx",
  "components/home/HomeTrustStrip.tsx",
]);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, files);
    else if (/\.(tsx|jsx)$/.test(entry.name)) files.push(abs);
  }
  return files;
}

const failures = [];
for (const root of targets) {
  for (const file of walk(root)) {
    const rel = path.relative(siteRoot, file).replaceAll("\\", "/");
    const source = fs.readFileSync(file, "utf8");
    if (STYLE_ATTR_RE.test(source) && !ALLOWLIST.has(rel)) {
      failures.push(rel);
    }
  }
}

if (failures.length > 0) {
  process.stderr.write(`check-marketing-inline-style: ${failures.length} file(s) with inline style\n`);
  for (const file of failures) process.stderr.write(`  ${file}\n`);
  process.exit(1);
}

process.stdout.write("check-marketing-inline-style: ok\n");
