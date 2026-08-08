#!/usr/bin/env node
/**
 * Classify package.json deps: used in site/scripts, tests-only, or orphaned.
 * Usage: node scripts/AsNeeded/_audit-package-usage.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "public",
  "mcps",
  "results",
  ".git",
  "data",
  "inventory",
  "generated-documents",
]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs|css|json|md)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function zoneOf(rel) {
  const n = rel.replaceAll("\\", "/");
  if (n.startsWith("tests/")) return "tests";
  if (n.startsWith("scripts/")) return "scripts";
  if (n.startsWith("site/")) return "site";
  if (n.startsWith("config/")) return "config";
  if (n.startsWith("tech-docs-generator/")) return "tech-docs";
  return "other";
}

/** Match package name as import/require or package.json script token. */
function mentions(text, name) {
  // bare and subpath imports
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`from\\s+['"]${esc}(?:/[^'"]*)?['"]`),
    new RegExp(`import\\s*\\(\\s*['"]${esc}(?:/[^'"]*)?['"]`),
    new RegExp(`require\\s*\\(\\s*['"]${esc}(?:/[^'"]*)?['"]`),
    new RegExp(`['"]${esc}(?:/[^'"]*)?['"]`),
  ];
  return patterns.some((re) => re.test(text));
}

const files = [
  ...walk(path.join(root, "site")),
  ...walk(path.join(root, "scripts")),
  ...walk(path.join(root, "tests")),
  ...walk(path.join(root, "config")),
].map((f) => ({
  abs: f,
  rel: path.relative(root, f),
  zone: zoneOf(path.relative(root, f)),
  text: fs.readFileSync(f, "utf8"),
}));

// also scan package.json scripts for CLI usage (playwright, vitest, tsx, etc.)
const scriptsBlob = JSON.stringify(pkg.scripts || {});

const allDeps = {
  ...(pkg.dependencies || {}),
  ...(pkg.devDependencies || {}),
};

// Known indirect / config-only packages that won't appear as JS imports
const KNOWN_TOOLING = new Set([
  "typescript",
  "tsx",
  "vite",
  "vitest",
  "@vitest/coverage-v8",
  "@vitest/ui",
  "playwright",
  "@playwright/test",
  "@axe-core/playwright",
  "postcss",
  "tailwindcss",
  "@tailwindcss/postcss",
  "esbuild",
  "jiti",
  "cross-env",
  "dotenv",
  "oxlint",
  "oxlint-tsgolint",
  "secretlint",
  "@secretlint/secretlint-rule-preset-recommend",
  "drizzle-kit",
  "shadcn",
  "tw-animate-css", // often CSS @import
  "server-only", // side-effect import string
  "enhanced-resolve",
  "ts-morph",
  "exceljs",
  "fast-check",
  "happy-dom",
  "react-router-dom", // may be tech-docs / tests
]);

const result = [];

for (const [name, version] of Object.entries(allDeps)) {
  const section = pkg.dependencies?.[name]
    ? "dependencies"
    : "devDependencies";
  const hits = { site: 0, scripts: 0, tests: 0, config: 0, other: 0, scriptsJson: 0 };
  const samples = [];

  if (scriptsBlob.includes(name) || scriptsBlob.includes(name.split("/").pop())) {
    hits.scriptsJson = 1;
  }

  for (const f of files) {
    if (!mentions(f.text, name)) continue;
    hits[f.zone] = (hits[f.zone] || 0) + 1;
    if (samples.length < 4) samples.push(f.rel.replaceAll("\\", "/"));
  }

  // CSS packages: scan for @import "name" already covered by mentions

  const appHits = hits.site + hits.scripts + hits.config;
  const testHits = hits.tests;
  const toolHit = hits.scriptsJson > 0 || KNOWN_TOOLING.has(name);

  let classification;
  if (appHits === 0 && testHits === 0 && !toolHit) {
    classification = "orphaned";
  } else if (appHits === 0 && testHits > 0 && !toolHit) {
    classification = "tests-only";
  } else if (appHits === 0 && toolHit && testHits === 0) {
    classification = "tooling-only";
  } else if (appHits === 0 && toolHit && testHits > 0) {
    classification = "tooling+tests";
  } else if (appHits > 0 && testHits > 0) {
    classification = "app+tests";
  } else {
    classification = "app";
  }

  result.push({
    name,
    version,
    section,
    classification,
    hits: {
      site: hits.site,
      scripts: hits.scripts,
      tests: hits.tests,
      config: hits.config,
      packageScripts: hits.scriptsJson,
    },
    samples,
  });
}

const groups = {
  orphaned: [],
  "tests-only": [],
  "tooling-only": [],
  "tooling+tests": [],
  app: [],
  "app+tests": [],
};
for (const r of result) groups[r.classification].push(r);

for (const k of Object.keys(groups)) {
  groups[k].sort((a, b) => a.name.localeCompare(b.name));
}

console.log(
  JSON.stringify(
    {
      summary: Object.fromEntries(
        Object.entries(groups).map(([k, v]) => [k, v.length]),
      ),
      orphaned: groups.orphaned,
      testsOnly: groups["tests-only"],
      toolingOnly: groups["tooling-only"],
      toolingAndTests: groups["tooling+tests"],
    },
    null,
    2,
  ),
);
