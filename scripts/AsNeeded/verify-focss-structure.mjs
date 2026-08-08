#!/usr/bin/env node
/**
 * Enforce the canonical FOCSS tree, base-first import contract, and token
 * ownership. This is intentionally independent of the compiler so structural
 * regressions fail before they become browser-specific styling defects.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(
  process.env.FOCSS_STRUCTURE_ROOT ?? path.dirname(fileURLToPath(import.meta.url)),
  process.env.FOCSS_STRUCTURE_ROOT ? "." : "../..",
);
const importPattern = /@import\s+(?:url\(\s*)?(?:["']([^"']+)["']|([^\s;)]+))\s*\)?/g;
const rawColorPattern = /#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\s*\(/gi;
const maxStylesheetLines = 800;

const externalImportsByFile = new Map([
  ["base/scan.css", new Set(["tailwindcss"])],
  ["base/runtime.css", new Set(["tw-animate-css"])],
  ["planner/entry.css", new Set(["tailwindcss"])],
]);

const forbiddenPaths = [
  "package.json",
  "entries",
  "zones",
  "chrome",
  "modules",
  "tech-stack",
  "product",
  "site/base",
  "site/index.css",
  "base/product.css",
  "base/shadcn-theme.css",
];

const forbiddenFlatBaseSheets = [
  "base/palette.css",
  "base/semantic.css",
  "base/layout.css",
  "base/typography.css",
  "base/type.css",
  "base/colors.css",
  "base/schemes.css",
  "base/buttons.css",
  "base/badges.css",
];

const baseIndexImports = [
  "./tokens/palette.css",
  "./tokens/semantic.css",
  "./type/typography.css",
  "./tokens/layout.css",
  "./type/type.css",
  "./animations.css",
  "./containers.css",
];

const layoutEntryImports = new Map([
  ["base/root.css", ["./scan.css", "./index.css"]],
  [
    "site/entry.css",
    [
      "../base/scan.css",
      "../base/runtime.css",
      "../base/document.css",
      "../base/index.css",
      "./type-marketing.css",
      "./heading-document.css",
      "./components/index.css",
    ],
  ],
  [
    "admin/entry.css",
    [
      "../base/scan.css",
      "../base/runtime.css",
      "../base/index.css",
      "../base/document.css",
      "./base/tokens.css",
      "./base/shell.css",
      "./base/type.css",
      "./base/buttons.css",
      "./base/primitives.css",
      "./components/pages.css",
      "./components/entry-hero.css",
      "./components/hub.css",
      "./components/catalog.css",
      "./components/crm.css",
    ],
  ],
  // Planner: palette + own chrome only (no marketing base stack).
  [
    "planner/entry.css",
    [
      "tailwindcss",
      "../base/tokens/palette.css",
      "./base/palette.css",
      "./base/semantic.css",
      "./base/layout.css",
      "./base/document.css",
      "./chrome.css",
      "./controls.css",
      "./polish.css",
      "./workspace-shell.css",
      "./workspace.css",
      "./dock.css",
    ],
  ],
  // Studio: product base + zone base barrel.
  [
    "studio/entry.css",
    [
      "../base/scan.css",
      "../base/runtime.css",
      "../base/index.css",
      "../base/document.css",
      "./base/index.css",
      "./chrome.css",
      "./controls.css",
      "./polish.css",
      "./workspace-shell.css",
      "./workspace.css",
      "./dock.css",
    ],
  ],
]);

const requiredBaseTokens = new Map([
  ["base/tokens/palette.css", ["--color-ecru-100", "--color-dark-midnight-blue-500", "--color-white-200"]],
  ["base/tokens/semantic.css", ["--surface-page", "--surface-panel", "--text-body", "--border-soft", "--color-focus", "--shadow-sm"]],
  ["base/tokens/layout.css", ["--space-4", "--container-max", "--radius-md", "--motion-base"]],
]);



function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function walkCss(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkCss(absolutePath, files);
    } else if (entry.name.endsWith(".css")) {
      files.push(absolutePath);
    }
  }
  return files;
}

function readImports(css) {
  return [...stripComments(css).matchAll(importPattern)].map((match) => match[1] ?? match[2]);
}

function resolveRelativeImport(fromFile, specifier) {
  const direct = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [direct, `${direct}.css`, path.join(direct, "index.css")];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function importsExactly(entries, key, expected) {
  const actual = entries.get(key) ?? [];
  return actual.length === expected.length && actual.every((specifier, index) => specifier === expected[index]);
}

function requireImportSequence(errors, entries, key, expected) {
  if (!importsExactly(entries, key, expected)) {
    errors.push(`${key} must import exactly: ${expected.join(" -> ")}`);
  }
}

function reachable(graph, entry, target) {
  const seen = new Set();
  const queue = [...(graph.get(entry) ?? [])];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    if (current === target) return true;
    seen.add(current);
    queue.push(...(graph.get(current) ?? []));
  }
  return false;
}

function reachablePrefix(graph, entry, prefix) {
  const seen = new Set();
  const queue = [...(graph.get(entry) ?? [])];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    if (current.startsWith(prefix)) return current;
    queue.push(...(graph.get(current) ?? []));
  }
  return null;
}

function findCycles(graph) {
  const visited = new Set();
  const visiting = new Set();
  const stack = [];
  const cycles = [];

  function visit(node) {
    if (visited.has(node)) return;
    if (visiting.has(node)) {
      const start = stack.indexOf(node);
      cycles.push([...stack.slice(start), node].join(" -> "));
      return;
    }
    visiting.add(node);
    stack.push(node);
    for (const dependency of graph.get(node) ?? []) visit(dependency);
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  }

  for (const node of [...graph.keys()].sort()) visit(node);
  return cycles;
}

function verifyAdminTokenScope(errors, cssByKey) {
  const adminTokens = cssByKey.get("admin/base/tokens.css") ?? "";
  if (!adminTokens) {
    errors.push("required Admin token scope is missing: admin/base/tokens.css");
  } else {
    if (!/\.shell-admin-layout\s*(?:,|\{)/.test(adminTokens)) {
      errors.push("admin/base/tokens.css must scope Admin overrides to .shell-admin-layout");
    }
    if (/(?:^|[}\s])body(?:\s|:|\[|\.)/m.test(adminTokens)) {
      errors.push("admin/base/tokens.css must not override document-level body tokens");
    }
  }

  // Phase 13: shadcn pack must not exist under focss.
  if (cssByKey.has("features/shadcn/theme.css") || cssByKey.has("features/shadcn/tailwind.css")) {
    errors.push("features/shadcn/* must not exist (shadcn pack retired)");
  }
}

function verifyFoundation(errors, graph, entries, cssByKey) {
  requireImportSequence(errors, entries, "base/index.css", baseIndexImports);
  for (const [entry, imports] of layoutEntryImports) {
    requireImportSequence(errors, entries, entry, imports);
  }

  for (const [file, tokens] of requiredBaseTokens) {
    const css = cssByKey.get(file) ?? "";
    for (const token of tokens) {
      if (!css.includes(`${token}:`)) {
        errors.push(`${file} must define the base token ${token}`);
      }
    }
  }

  for (const entry of ["base/root.css", "site/entry.css", "admin/entry.css", "studio/entry.css"]) {
    for (const foundationFile of ["base/tokens/palette.css", "base/tokens/semantic.css", "base/tokens/layout.css"]) {
      if (!reachable(graph, entry, foundationFile)) {
        errors.push(`${entry} must reach ${foundationFile} through base/index.css`);
      }
    }
  }

  // Planner only needs raw palette; own semantic/layout replace global ones.
  if (!reachable(graph, "planner/entry.css", "base/tokens/palette.css")) {
    errors.push("planner/entry.css must reach base/tokens/palette.css");
  }
  if (reachable(graph, "planner/entry.css", "base/tokens/semantic.css")) {
    errors.push("planner/entry.css must not load base/tokens/semantic.css (uses planner/base/semantic.css)");
  }
  if (reachable(graph, "planner/entry.css", "base/type/type.css")) {
    errors.push("planner/entry.css must not load marketing base type utilities");
  }

  if (reachable(graph, "base/root.css", "base/document.css")) {
    errors.push("base/root.css must not reach base/document.css");
  }

  // Site must not load admin / retired product packs.
  for (const forbiddenPrefix of ["features/product/", "features/shadcn/", "admin/"]) {
    const reached = reachablePrefix(graph, "site/entry.css", forbiddenPrefix);
    if (reached) errors.push(`site/entry.css must not reach ${reached}`);
  }

  for (const forkEntry of ["studio/entry.css", "admin/entry.css"]) {
    if (!reachable(graph, forkEntry, "base/index.css")) {
      errors.push(`${forkEntry} must reach base/index.css`);
    }
    if (!reachable(graph, forkEntry, "base/document.css")) {
      errors.push(`${forkEntry} must reach base/document.css`);
    }
  }

  if (!reachable(graph, "planner/entry.css", "planner/base/document.css")) {
    errors.push("planner/entry.css must reach planner/base/document.css");
  }

  if (reachablePrefix(graph, "admin/entry.css", "features/shadcn/")) {
    errors.push("admin/entry.css must not reach features/shadcn/");
  }

  if (cssByKey.has("features/product/foundation.css") || cssByKey.has("features/product/entry.css")) {
    errors.push("features/product/* must not exist — base is inlined in zone entries");
  }

  verifyAdminTokenScope(errors, cssByKey);
}

function verifySiteComponentsLayout(errors, focssRoot) {
  const componentsRoot = path.join(focssRoot, "site", "components");
  if (!fs.existsSync(componentsRoot)) return;

  for (const entry of fs.readdirSync(componentsRoot, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".css") || entry.name === "index.css") continue;
    errors.push(`site/components/${entry.name} must live under site/components/shared/`);
  }
}

function verifyFlatBaseSheets(errors, focssRoot) {
  for (const relativePath of forbiddenFlatBaseSheets) {
    if (fs.existsSync(path.join(focssRoot, relativePath))) {
      errors.push(`forbidden flat base sheet: ${relativePath}`);
    }
  }
}

export function verifyFocssStructure(root = repoRoot) {
  const focssRoot = path.join(root, "site", "focss");
  const errors = [];
  if (!fs.existsSync(focssRoot)) {
    return { ok: false, errors: ["site/focss/ is missing"], cycles: [], cssFileCount: 0 };
  }

  for (const relativePath of forbiddenPaths) {
    if (fs.existsSync(path.join(focssRoot, relativePath))) {
      errors.push(`forbidden FOCSS path exists: site/focss/${relativePath}`);
    }
  }

  verifyFlatBaseSheets(errors, focssRoot);
  verifySiteComponentsLayout(errors, focssRoot);

  const graph = new Map();
  const entries = new Map();
  const cssByKey = new Map();
  const cssFiles = walkCss(focssRoot);

  for (const file of cssFiles) {
    const key = path.relative(focssRoot, file).replaceAll("\\", "/");
    const css = fs.readFileSync(file, "utf8");
    const uncommentedCss = stripComments(css);
    cssByKey.set(key, uncommentedCss);

    const lineCount = css.split(/\r?\n/).length;
    if (lineCount > maxStylesheetLines) {
      errors.push(`${key} exceeds the ${maxStylesheetLines}-line FOCSS maximum (${lineCount} lines)`);
    }

    if (key !== "base/scan.css" && /@source\b/.test(uncommentedCss)) {
      errors.push(`${key} uses @source; only base/scan.css may configure Tailwind sources`);
    }

    if (!key.startsWith("base/")) {
      for (const match of uncommentedCss.matchAll(rawColorPattern)) {
        errors.push(`${key} contains raw color literal ${match[0]}; define it in base/ and use its token`);
      }
    }

    const specifiers = readImports(css);
    entries.set(key, specifiers);
    const dependencies = [];
    for (const specifier of specifiers) {
      if (!specifier.startsWith(".")) {
        if (!externalImportsByFile.get(key)?.has(specifier)) {
          errors.push(`${key} imports unsupported external stylesheet ${specifier}`);
        }
        continue;
      }

      const resolved = resolveRelativeImport(file, specifier);
      if (!resolved) {
        errors.push(`${key} cannot resolve ${specifier}`);
        continue;
      }
      const resolvedKey = path.relative(focssRoot, resolved).replaceAll("\\", "/");
      if (resolvedKey.startsWith("..")) {
        errors.push(`${key} imports outside site/focss/: ${specifier}`);
        continue;
      }
      dependencies.push(resolvedKey);
    }
    graph.set(key, dependencies);
  }

  for (const entry of layoutEntryImports.keys()) {
    if (!graph.has(entry)) errors.push(`required FOCSS entry is missing: ${entry}`);
  }

  verifyFoundation(errors, graph, entries, cssByKey);

  const cycles = findCycles(graph);
  for (const cycle of cycles) errors.push(`FOCSS import cycle: ${cycle}`);

  return {
    ok: errors.length === 0,
    errors: [...new Set(errors)].sort(),
    cycles,
    cssFileCount: cssFiles.length,
  };
}

const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isCli) {
  const result = verifyFocssStructure();
  if (!result.ok) {
    console.error(`verify-focss-structure: failed\n${result.errors.map((error) => `  - ${error}`).join("\n")}`);
    process.exit(1);
  }
  console.log(`verify-focss-structure: ok (${result.cssFileCount} stylesheets)`);
}
