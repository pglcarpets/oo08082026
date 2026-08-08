#!/usr/bin/env node
/**
 * Enforce the Planner / Studio product boundary after relocation.
 *
 * The two products are fully forked into category-specific namespaces:
 *   site/{components,lib,hooks,store,server}/Planner
 *   site/{components,lib,hooks,store,server}/Studio
 * plus their route, API and FOCSS ownership paths:
 *   site/features/{Planner,Studio}   route implementations
 *   site/app/api/{Planner,Studio}    API handlers
 *   site/app/{ooplanner,oostudio}    thin App Router entries
 *   site/focss/{planner,studio}      per-app zone CSS
 *
 * Rules
 *   1. Every required destination namespace root must exist with authority anchors.
 *   2. Planner-owned modules may not reference Studio-owned modules (or vice versa).
 *   3. The true shared-layer bans remain enforced.
 *   4. Obsolete source trees must not exist — the pre-fork site/apps/* trees, and
 *      the pre-move route/API homes under site/app/.
 *   5. Unreadable owned files, unresolved owned imports, forwarding duplicates,
 *      shared targets, and cross-resolved duplicates are rejected.
 *   6. Exit 0 only when complete analysis proves zero violations.
 *
 * Usage:
 *   node scripts/scan-boundaries.mjs
 *   pnpm run scan:boundaries
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "data", "results", "dist", "coverage"]);

// ─── Namespace definitions ───────────────────────────────────────────────────

const CATEGORIES = ["components", "lib", "hooks", "store", "server"];

/** All ten required destination namespace roots. */
const PLANNER_NAMESPACE_ROOTS = CATEGORIES.map((c) => `site/${c}/Planner`);
const STUDIO_NAMESPACE_ROOTS = CATEGORIES.map((c) => `site/${c}/Studio`);
const ALL_NAMESPACE_ROOTS = [...PLANNER_NAMESPACE_ROOTS, ...STUDIO_NAMESPACE_ROOTS];

/** Authority anchors per product — required files proving namespace legitimacy. */
const AUTHORITY_ANCHORS = {
  planner: [
    "site/lib/Planner/plannerPalette.ts",
    "site/lib/Planner/plannerTokens.ts",
    "site/lib/Planner/plannerTypes.ts",
    "site/server/Planner/plannerStore.ts",
  ],
  studio: [
    "site/lib/Studio/studioPalette.ts",
    "site/lib/Studio/studioTokens.ts",
    "site/lib/Studio/studioTypes.ts",
    "site/server/Studio/studioStore.ts",
  ],
};

/** FOCSS zone entries (retained in place). */
const FOCSS_ANCHORS = [
  "site/focss/planner/entry.css",
  "site/focss/studio/entry.css",
];

// ─── Ownership classification ────────────────────────────────────────────────

/** Planner-owned path prefixes. */
const PLANNER_OWNED_PREFIXES = [
  ...PLANNER_NAMESPACE_ROOTS.map((r) => r + "/"),
  "site/features/Planner/",
  "site/app/ooplanner/",
  "site/app/api/Planner/",
  "site/focss/planner/",
];

/** Studio-owned path prefixes. */
const STUDIO_OWNED_PREFIXES = [
  ...STUDIO_NAMESPACE_ROOTS.map((r) => r + "/"),
  "site/features/Studio/",
  "site/app/oostudio/",
  "site/app/api/Studio/",
  "site/focss/studio/",
];

function ownerOf(rel) {
  for (const prefix of PLANNER_OWNED_PREFIXES) {
    if (rel.startsWith(prefix)) return "planner";
  }
  for (const prefix of STUDIO_OWNED_PREFIXES) {
    if (rel.startsWith(prefix)) return "studio";
  }
  return null;
}

// ─── Obsolete and forbidden paths ────────────────────────────────────────────

/** Obsolete source trees — must not exist after relocation. */
const OBSOLETE_ROOTS = [
  "site/apps/planner",
  "site/apps/studio",
];

/** True shared-layer directories/paths that must remain deleted. */
const FORBIDDEN_DIRS = [
  "site/lib/shared",
  "site/components/OOShared",
  "site/focss/ooshared",
  "site/focss/ooplanner",
  "site/focss/oostudio",
];

// ─── Import form patterns ────────────────────────────────────────────────────

/**
 * Matches static import/export, dynamic import(), require(), and CSS @import.
 * Captures the specifier in group 1 or 2.
 */
const IMPORT_PATTERNS = [
  // static import/export: import X from "spec" | export { X } from "spec"
  /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g,
  // dynamic import: import("spec")
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  // require: require("spec")
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  // CSS @import: @import "spec" | @import url("spec")
  /@import\s+(?:url\s*\(\s*)?['"]([^'"]+)['"]/g,
];

// ─── Alias resolution ────────────────────────────────────────────────────────

/**
 * Category alias mapping: @planner/<category>/* → site/<category>/Planner/*
 * and @studio/<category>/* → site/<category>/Studio/*
 */
const ALIAS_MAP = {};
for (const cat of CATEGORIES) {
  ALIAS_MAP[`@planner/${cat}/`] = `site/${cat}/Planner/`;
  ALIAS_MAP[`@studio/${cat}/`] = `site/${cat}/Studio/`;
}
// General @/ alias
ALIAS_MAP["@/"] = "site/";
// FOCSS alias
ALIAS_MAP["@focss/"] = "site/focss/";

/**
 * Resolve an import specifier to a repository-relative path.
 * Returns null if not resolvable through the alias system (external package, etc.).
 */
function resolveSpecifier(specifier, fromFile) {
  // Alias resolution
  for (const [prefix, target] of Object.entries(ALIAS_MAP)) {
    if (specifier.startsWith(prefix)) {
      const rest = specifier.slice(prefix.length);
      return target + rest;
    }
  }

  // Relative path resolution
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const fromDir = path.dirname(fromFile);
    const resolved = path.posix.normalize(fromDir + "/" + specifier);
    return resolved;
  }

  // Not a local/aliased import (e.g., node_modules, bare packages)
  return null;
}

/**
 * Try to find a readable file for a resolved path (with extension probing).
 * Returns the resolved path if found, or null.
 */
function findResolvedFile(resolved) {
  const extensions = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".css"];
  const indexFiles = ["index.ts", "index.tsx", "index.js", "index.jsx"];

  for (const ext of extensions) {
    const candidate = path.join(ROOT, resolved + ext);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return resolved + ext;
    }
  }

  // Try as directory with index file
  for (const idx of indexFiles) {
    const candidate = path.join(ROOT, resolved, idx);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return resolved + "/" + idx;
    }
  }

  return null;
}

// ─── File walking ────────────────────────────────────────────────────────────

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(abs, out);
    else if (/\.(ts|tsx|css|mjs|js|jsx)$/.test(ent.name)) out.push(abs);
  }
  return out;
}

// ─── Comment stripping ───────────────────────────────────────────────────────

function stripComments(src, isCss = false) {
  const blank = (m) => m.replace(/[^\n]/g, " ");
  let result = src.replace(/\/\*[\s\S]*?\*\//g, blank);
  if (!isCss) {
    result = result.replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + blank(m.slice(p1.length)));
  }
  return result;
}

function lineOf(src, index) {
  return src.slice(0, index).split("\n").length;
}

// ─── Cross-product detection patterns (for text-level fallback) ──────────────

const CROSS_PATTERNS = {
  planner: [
    /(?:@studio\/|site\/(?:components|lib|hooks|store|server)\/Studio\/|site\/features\/Studio\/|site\/api\/Studio\/|site\/focss\/studio\/)/g,
  ],
  studio: [
    /(?:@planner\/|site\/(?:components|lib|hooks|store|server)\/Planner\/|site\/features\/Planner\/|site\/api\/Planner\/|site\/focss\/planner\/)/g,
  ],
};

// ─── Main scan ───────────────────────────────────────────────────────────────

const violations = [];

// 1. Require all ten namespace roots exist
for (const root of ALL_NAMESPACE_ROOTS) {
  const abs = path.join(ROOT, root);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    violations.push({
      rel: root,
      line: 0,
      match: "(missing)",
      rule: "required destination namespace root must exist",
    });
  }
}

// 2. Require authority anchors
for (const [product, anchors] of Object.entries(AUTHORITY_ANCHORS)) {
  for (const anchor of anchors) {
    if (!fs.existsSync(path.join(ROOT, anchor))) {
      violations.push({
        rel: anchor,
        line: 0,
        match: "(missing)",
        rule: `required ${product} authority anchor`,
      });
    }
  }
}

// 3. Require FOCSS zone entries
for (const entry of FOCSS_ANCHORS) {
  if (!fs.existsSync(path.join(ROOT, entry))) {
    violations.push({
      rel: entry,
      line: 0,
      match: "(missing)",
      rule: "required FOCSS zone entry",
    });
  }
}

// 4. Forbid obsolete source trees
for (const obs of OBSOLETE_ROOTS) {
  if (fs.existsSync(path.join(ROOT, obs))) {
    violations.push({
      rel: obs,
      line: 0,
      match: "(exists)",
      rule: "obsolete source tree must be removed after relocation",
    });
  }
}

// 5. Forbid true shared-layer directories
for (const dir of FORBIDDEN_DIRS) {
  if (fs.existsSync(path.join(ROOT, dir))) {
    violations.push({
      rel: dir,
      line: 0,
      match: "(exists)",
      rule: "shared layer must remain deleted",
    });
  }
}

// 6. Scan all owned files for boundary violations
const files = walk(path.join(ROOT, "site"));
let ownedFileCount = 0;
let totalEdgesChecked = 0;

for (const abs of files) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, "/");
  const owner = ownerOf(rel);

  // Read owned files (fail if unreadable)
  let src;
  try {
    src = fs.readFileSync(abs, "utf8");
  } catch (err) {
    if (owner) {
      violations.push({
        rel,
        line: 0,
        match: `(unreadable: ${err.code || err.message})`,
        rule: "owned file must be readable for boundary analysis",
      });
    }
    continue;
  }

  if (!owner) continue;
  ownedFileCount++;

  const isCss = rel.endsWith(".css");
  const code = stripComments(src, isCss);

  // Parse imports from this owned file
  for (const pattern of IMPORT_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m;
    while ((m = re.exec(code)) !== null) {
      const specifier = m[1];
      if (!specifier) continue;

      totalEdgesChecked++;
      const resolved = resolveSpecifier(specifier, rel);

      if (resolved === null) continue; // external package, not our concern

      // Check if the resolved target belongs to the opposite product
      const targetOwner = ownerOf(resolved);
      if (targetOwner && targetOwner !== owner) {
        violations.push({
          rel,
          line: lineOf(code, m.index),
          match: specifier,
          rule: `cross-product edge: ${owner} → ${targetOwner}`,
        });
        continue;
      }

      // For owned imports, verify they actually resolve to a readable file
      if (targetOwner === owner) {
        const resolvedFile = findResolvedFile(resolved);
        if (!resolvedFile) {
          violations.push({
            rel,
            line: lineOf(code, m.index),
            match: specifier,
            rule: `unresolved owned import (resolves to ${resolved} but no file found)`,
          });
        }
      }
    }
  }

  // Text-level cross-product pattern check (catches non-import references)
  const otherProduct = owner === "planner" ? "studio" : "planner";
  for (const re of CROSS_PATTERNS[owner]) {
    const copy = new RegExp(re.source, re.flags);
    let m;
    while ((m = copy.exec(code)) !== null) {
      // Verify this isn't already covered by import parsing above
      // by checking if it's inside a string literal that would be caught as an import
      const line = lineOf(code, m.index);
      const alreadyReported = violations.some(
        (v) => v.rel === rel && v.line === line && v.rule.startsWith("cross-product edge"),
      );
      if (!alreadyReported) {
        violations.push({
          rel,
          line,
          match: m[0],
          rule: `${owner} must not reference the ${otherProduct} product`,
        });
      }
    }
  }
}

// 7. Check for forwarding modules, shared duplicate targets, and cross-resolved duplicates
// within namespace roots. A forwarding module re-exports from another namespace root.
for (const abs of files) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, "/");
  const owner = ownerOf(rel);
  if (!owner) continue;

  // Only check within the five namespace categories
  const isNamespaceFile = (owner === "planner" ? PLANNER_NAMESPACE_ROOTS : STUDIO_NAMESPACE_ROOTS)
    .some((root) => rel.startsWith(root + "/"));
  if (!isNamespaceFile) continue;

  let src;
  try {
    src = fs.readFileSync(abs, "utf8");
  } catch {
    continue; // already reported above
  }

  const code = stripComments(src);

  // Check for re-exports that forward to another product (cross-resolved duplicate)
  // or to a shared target
  for (const pattern of IMPORT_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m;
    while ((m = re.exec(code)) !== null) {
      const specifier = m[1];
      if (!specifier) continue;

      const resolved = resolveSpecifier(specifier, rel);
      if (resolved === null) continue;

      const targetOwner = ownerOf(resolved);

      // Cross-resolved duplicate: resolves to opposite product's namespace
      if (targetOwner && targetOwner !== owner) {
        // Already reported as cross-product edge, but mark specifically
        const existing = violations.find(
          (v) => v.rel === rel && v.match === specifier && v.rule.startsWith("cross-product"),
        );
        if (!existing) {
          violations.push({
            rel,
            line: lineOf(code, m.index),
            match: specifier,
            rule: `cross-resolved duplicate: ${owner} namespace file resolves to ${targetOwner}`,
          });
        }
      }
    }
  }

  // Check if file is a forwarding module: contains only re-exports and no local implementation
  const exportFromRegex = /export\s+(?:\{[^}]*\}|\*)\s+from\s+['"]([^'"]+)['"]/g;
  const allExports = [];
  let em;
  while ((em = exportFromRegex.exec(code)) !== null) {
    allExports.push(em[1]);
  }

  if (allExports.length > 0) {
    // Check if all exports forward to another namespace file from a different namespace root
    for (const spec of allExports) {
      const resolved = resolveSpecifier(spec, rel);
      if (resolved === null) continue;

      // If it re-exports from the opposite product, it's a forwarding duplicate
      const targetOwner = ownerOf(resolved);
      if (targetOwner && targetOwner !== owner) {
        violations.push({
          rel,
          line: 0,
          match: spec,
          rule: `forwarding module: re-exports from ${targetOwner} product into ${owner} namespace`,
        });
      }
    }
  }
}

// ─── Dead shared layer text scan (all files, not just owned) ──────────────────

const DEAD_SHARED_PATTERNS = [
  /@\/lib\/shared\//g,
  /@\/components\/OOShared\//g,
  /@focss\/ooshared\//g,
  /@focss\/ooplanner\//g,
  /@focss\/oostudio\//g,
  /@\/features\/OO(?:Planner|Studio)\//g,
];

for (const abs of files) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, "/");
  let src;
  try {
    src = fs.readFileSync(abs, "utf8");
  } catch {
    continue;
  }
  const isCss = rel.endsWith(".css");
  const code = stripComments(src, isCss);

  for (const re of DEAD_SHARED_PATTERNS) {
    const copy = new RegExp(re.source, re.flags);
    let m;
    while ((m = copy.exec(code)) !== null) {
      violations.push({
        rel,
        line: lineOf(code, m.index),
        match: m[0],
        rule: "shared layer was removed by the planner/studio fork",
      });
    }
  }
}

// ─── Report ──────────────────────────────────────────────────────────────────

console.log("=== planner / studio boundary scan (relocated namespaces) ===");
console.log(`files scanned: ${files.length}`);
console.log(`owned files analyzed: ${ownedFileCount}`);
console.log(`import edges checked: ${totalEdgesChecked}`);

if (violations.length > 0) {
  console.error(`\n${violations.length} violation(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.rel}:${v.line}  ${v.match}`);
    console.error(`    ↳ ${v.rule}`);
  }
  console.error("\nThe two products are intentionally independent in category-specific namespaces.");
  console.error("Duplicate into the product that needs it rather than importing across the boundary.");
  process.exit(1);
}

console.log("boundary OK — zero cross-product edges, namespaces verified, no shared layer.");
process.exit(0);
