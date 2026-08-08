#!/usr/bin/env node
/**
 * One-shot: compare external imports to package.json + resolvability.
 * Usage: node scripts/AsNeeded/_audit-missing-packages.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { builtinModules } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const declared = new Set([
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.optionalDependencies || {}),
]);

// tech-docs workspace package name if present
try {
  const td = JSON.parse(
    fs.readFileSync(path.join(root, "tech-docs-generator/package.json"), "utf8"),
  );
  if (td.name) declared.add(td.name);
  for (const n of Object.keys(td.dependencies || {})) declared.add(n);
  for (const n of Object.keys(td.devDependencies || {})) declared.add(n);
} catch {
  /* optional */
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      [
        "node_modules",
        ".next",
        "public",
        "mcps",
        "results",
        ".git",
        "data",
        "inventory",
      ].includes(ent.name)
    ) {
      continue;
    }
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(ent.name)) out.push(p);
  }
  return out;
}

const files = [
  ...walk(path.join(root, "site")),
  ...walk(path.join(root, "scripts")),
  ...walk(path.join(root, "tests")),
  ...walk(path.join(root, "tech-docs-generator/src")),
  ...walk(path.join(root, "config")),
];

const importRe =
  /(?:from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;

function pkgName(spec) {
  if (
    !spec ||
    spec.startsWith(".") ||
    spec.startsWith("/") ||
    spec.startsWith("@/") ||
    spec.startsWith("@planner/") ||
    spec.startsWith("@studio/") ||
    spec.startsWith("@focss") ||
    spec.startsWith("#") ||
    spec.startsWith("node:") ||
    spec.startsWith("cloudflare:") ||
    spec.startsWith("https:") ||
    spec.startsWith("http:") ||
    spec.startsWith("data:") ||
    spec.startsWith("virtual:")
  ) {
    return null;
  }
  if (spec.startsWith("@")) {
    const parts = spec.split("/");
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0];
  }
  return spec.split("/")[0];
}

const used = new Map();
const usedFrom = new Map();
for (const f of files) {
  let text;
  try {
    text = fs.readFileSync(f, "utf8");
  } catch {
    continue;
  }
  let m;
  const re = new RegExp(importRe.source, "g");
  while ((m = re.exec(text))) {
    const name = pkgName(m[1] || m[2] || m[3]);
    if (!name) continue;
    used.set(name, (used.get(name) || 0) + 1);
    if (!usedFrom.has(name)) usedFrom.set(name, new Set());
    if (usedFrom.get(name).size < 5) {
      usedFrom
        .get(name)
        .add(path.relative(root, f).replaceAll("\\", "/"));
    }
  }
}

const req = createRequire(path.join(root, "package.json"));
const builtin = new Set([
  ...builtinModules,
  ...builtinModules.map((b) => `node:${b}`),
]);

function isResolvable(name) {
  try {
    req.resolve(name);
    return true;
  } catch {
    try {
      req.resolve(`${name}/package.json`);
      return true;
    } catch {
      // some packages only export subpaths
      const nm = path.join(root, "node_modules", name);
      return fs.existsSync(nm);
    }
  }
}

const importedNotDeclared = [];
const importedMissing = [];
const declaredNotInstalled = [];

for (const name of [...used.keys()].sort()) {
  if (builtin.has(name) || name.startsWith("node:")) continue;
  const dec = declared.has(name);
  const inst = isResolvable(name);
  const row = {
    pkg: name,
    count: used.get(name),
    samples: [...(usedFrom.get(name) || [])],
  };
  if (!dec && !inst) importedMissing.push(row);
  else if (!dec && inst) importedNotDeclared.push(row);
  else if (dec && !inst) declaredNotInstalled.push(name);
}

const unreferencedRuntime = Object.keys(pkg.dependencies || {})
  .filter((n) => !used.has(n))
  .sort();

const out = {
  filesScanned: files.length,
  uniqueExternalImports: used.size,
  /** Imported in source, not in package.json, cannot resolve — true missing */
  missingPackages: importedMissing,
  /** Imported, not declared at root, but installed transitively */
  undeclaredButInstalled: importedNotDeclared,
  /** In package.json but not on disk */
  declaredNotInstalled,
  /** In dependencies{} with zero import hits (may still be used dynamically) */
  unreferencedRuntimeDeps: unreferencedRuntime,
};

process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
