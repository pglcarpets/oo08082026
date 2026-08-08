/**
 * Fail if forbidden layout paths exist, or required workspace paths are missing.
 * Exit 0 = clean. Exit 1 = violations.
 *
 * Install model:
 *   - Product package: root package.json (app under site/)
 *   - Workspace member: tech-docs-generator/package.json
 *   - Install only from repo root (`pnpm install`)
 *   - Canonical lock: root pnpm-lock.yaml only
 *   - tech-docs-generator/node_modules is allowed (pnpm workspace links)
 *
 * Forbidden under site: node_modules, npm/yarn locks, results dumps
 * Required: workspace root files + results/ + docs/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GENERATED_ROOT_DIR,
  LEGACY_GENERATED_ROOTS,
  LEGACY_SOURCE_PACKAGE_DIR,
  SOURCE_PACKAGE_DIR,
} from "../../tech-docs-generator/scripts/output-contract.mjs";
import { findRootSurfaceViolations } from "./root-surface-purity.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Directories that must never exist (nested installs / dumps / legacy names). */
const FORBIDDEN_DIRS = [
  "site/results",
  "site/test-results",
  "site/.cursor",
  "site/.firecrawl",
  "site/node_modules",
  // Claude Code local config — not part of this repo
  ".claude",
  "site/.claude",
  // tech-docs-generator/node_modules is a normal pnpm workspace link — not forbidden
  `site/${GENERATED_ROOT_DIR}`,
  LEGACY_SOURCE_PACKAGE_DIR,
  ...LEGACY_GENERATED_ROOTS,
];

/**
 * Files that must never exist.
 * npm/yarn locks are regeneratable noise — only root pnpm-lock.yaml is canonical.
 */
const FORBIDDEN_FILES = [
  "package-lock.json",
  "yarn.lock",
  "npm-shrinkwrap.json",
  "site/package-lock.json",
  "site/yarn.lock",
  "site/npm-shrinkwrap.json",
  `${SOURCE_PACKAGE_DIR}/package-lock.json`,
  `${SOURCE_PACKAGE_DIR}/yarn.lock`,
  `${SOURCE_PACKAGE_DIR}/npm-shrinkwrap.json`,
  `${LEGACY_SOURCE_PACKAGE_DIR}/package-lock.json`,
  // Claude agent stubs — AGENTS.md is the only agent front door
  "CLAUDE.md",
  "site/CLAUDE.md",
];

/**
 * Forbidden file-name patterns under `scripts/`. Sprawl guard for `tmp-`,
 * `_tmp-`, and `repush-*` helpers. Added 2026-08-07 per `testing-plan.md` scripts appendix.
 */
const FORBIDDEN_SCRIPT_PATTERNS = [/^tmp-/, /^_tmp-/, /^repush-/];

function findScriptSprawl(root) {
  const out = [];
  const scriptsRoot = path.join(root, "scripts");
  if (!fs.existsSync(scriptsRoot)) return out;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
      } else if (FORBIDDEN_SCRIPT_PATTERNS.some((re) => re.test(e.name))) {
        out.push(path.relative(root, full).replace(/\\/g, "/"));
      }
    }
  };
  walk(scriptsRoot);
  return out;
}

/** Directories that must exist at repo root. */
const REQUIRED_DIRS = [
  "site",
  "scripts",
  "results",
  "docs",
  "Agents",
  SOURCE_PACKAGE_DIR,
];

/** Files that must exist for a valid pnpm workspace install. */
const REQUIRED_FILES = [
  "package.json",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  `${SOURCE_PACKAGE_DIR}/package.json`,
  "AGENTS.md",
  // `README.md`, not `Readme.md` — Windows resolves either, Linux CI does not.
  "README.md",
  "Testing-handbook.md",
  "Failures.md",
  "site/tsconfig.json",
];

/** Paths checked for accidental git tracking (forbidden artifacts). */
const FORBIDDEN_GIT_PATHS = [
  "site/results",
  "site/test-results",
  "site/.cursor",
  "site/.firecrawl",
  "site/node_modules",
  `site/${GENERATED_ROOT_DIR}`,
  // Live generator output — regenerate with pnpm run tech-docs:generate; do not push
  GENERATED_ROOT_DIR,
  "package-lock.json",
  "yarn.lock",
  "site/package-lock.json",
  "site/yarn.lock",
  `${SOURCE_PACKAGE_DIR}/package-lock.json`,
  `${SOURCE_PACKAGE_DIR}/yarn.lock`,
  LEGACY_SOURCE_PACKAGE_DIR,
  ...LEGACY_GENERATED_ROOTS,
  ".claude",
  "CLAUDE.md",
  "site/CLAUDE.md",
];

const violations = [];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function isDir(rel) {
  const abs = path.join(root, rel);
  return fs.existsSync(abs) && fs.statSync(abs).isDirectory();
}

function isFile(rel) {
  const abs = path.join(root, rel);
  return fs.existsSync(abs) && fs.statSync(abs).isFile();
}

for (const rel of FORBIDDEN_DIRS) {
  if (exists(rel)) {
    violations.push(`FORBIDDEN directory: ${rel}`);
  }
}

for (const sprawl of findScriptSprawl(root)) {
  violations.push(
    `FORBIDDEN script sprawl: ${sprawl} (delete or move to .archive/)`,
  );
}

for (const rel of FORBIDDEN_FILES) {
  if (exists(rel)) {
    violations.push(
      `FORBIDDEN file: ${rel} (use root pnpm-lock.yaml only; install from root)`,
    );
  }
}

for (const rel of REQUIRED_DIRS) {
  if (!isDir(rel)) {
    violations.push(`REQUIRED directory missing: ${rel}/`);
  }
}

for (const rel of REQUIRED_FILES) {
  if (!isFile(rel)) {
    violations.push(`REQUIRED file missing: ${rel}`);
  }
}

// Next config: .ts (TypeScript 7 / useTypeScriptCli) or legacy .js
if (!isFile("site/next.config.ts") && !isFile("site/next.config.js") && !isFile("site/next.config.mjs")) {
  violations.push(
    "REQUIRED file missing: site/next.config.ts|js|mjs (one Next config)",
  );
}

// Root node_modules must exist after install (hoisted product deps live here).
// Not required in CI dry-check without install — only warn as violation if
// pnpm-lock exists but packages were never installed and site/node_modules
// was used as a substitute (already forbidden above).

// Durable hand-written docs must not live under results/.
// Tool dumps (Playwright error-context.md, html report data, etc.) are allowed.
const RESULTS_MD_TOOL_DIRS = new Set([
  "playwright-report",
  "test-results",
  "coverage",
  "coverage-site",
  "coverage-admin",
  "tooling",
  "audits",
  "tests",
  "browser",
  "admin",
  "site",
  "planner",
]);
const resultsDir = path.join(root, "results");
if (isDir("results")) {
  const entries = fs.readdirSync(resultsDir, {
    recursive: true,
    withFileTypes: true,
  });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".md")) continue;
    const parent = entry.parentPath ?? entry.path ?? resultsDir;
    const rel = path.relative(root, path.join(parent, entry.name)).replace(/\\/g, "/");
    const parts = rel.split("/");
    // results/<tool-bucket>/...  → ok; results/SomeReport.md at bucket root → forbid
    const bucket = parts[1];
    if (parts[0] === "results" && bucket && RESULTS_MD_TOOL_DIRS.has(bucket)) {
      continue;
    }
    violations.push(`FORBIDDEN Markdown report in results/: ${rel}`);
  }
}

// Product deps live on root package.json (one package). site/ is app directory only.
try {
  const rootPkg = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  );
  if (!rootPkg.dependencies?.next) {
    violations.push(
      "root package.json must declare next (product deps merged to root)",
    );
  }
  if (exists("site/package.json")) {
    violations.push(
      "FORBIDDEN site/package.json (product package is root only)",
    );
  }
} catch (error) {
  violations.push(
    `root package.json unreadable: ${error instanceof Error ? error.message : String(error)}`,
  );
}

try {
  const { execSync } = await import("node:child_process");
  const tracked = execSync(`git ls-files ${FORBIDDEN_GIT_PATHS.join(" ")}`, {
    cwd: root,
    encoding: "utf8",
  })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  for (const f of tracked) {
    violations.push(`FORBIDDEN tracked in git: ${f}`);
  }
} catch {
  // no git — skip index check
}

const STALE_NAME_PATTERN =
  "tech-stack-generator|tech-stack-generated|tech-stack-docs|\\.tech-stack-generated";
const STALE_NAME_EXCLUDES = [
  "node_modules",
  ".git",
  "archive",
  "websites",
  ".archive",
  ".websites",
  "results",
  "generated-documents",
  "plans/Site/TECH-DOCS-GENERATOR.md",
  "scripts/general/check-repo-layout.mjs",
  "tech-docs-generator/scripts/output-contract.mjs",
  "tech-docs-generator/scripts/output-contract.d.mts",
  "tech-docs-generator/tests",
];

function shouldSkipStaleNameScan(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  return STALE_NAME_EXCLUDES.some(
    (entry) => normalized === entry || normalized.startsWith(`${entry}/`),
  );
}

const STALE_SCAN_SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "vendor",
  "dist",
  "build",
  "coverage",
  ".claude",
]);

function scanStaleNamesWithNode(startDir) {
  const stalePattern =
    /tech-stack-generator|tech-stack-generated|tech-stack-docs|\.tech-stack-generated/;
  const matches = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const abs = path.join(currentDir, entry.name);
      const relative = path.relative(root, abs).replace(/\\/g, "/");
      if (shouldSkipStaleNameScan(relative)) continue;
      if (entry.isDirectory()) {
        if (STALE_SCAN_SKIP_DIRS.has(entry.name)) continue;
        walk(abs);
        continue;
      }
      if (!entry.isFile()) continue;
      if (
        !/\.(?:md|mdx|json|jsonc|ya?ml|toml|txt|css|scss|sql|ts|tsx|js|jsx|mjs|cjs|html|sh|ps1)$/i.test(
          entry.name,
        )
      ) {
        continue;
      }
      const text = fs.readFileSync(abs, "utf8");
      if (!stalePattern.test(text)) continue;
      const lineNumber =
        text.split(/\r?\n/).findIndex((line) => stalePattern.test(line)) + 1;
      matches.push(`${relative}:${lineNumber}`);
    }
  }

  walk(startDir);
  return matches;
}

try {
  const { execSync } = await import("node:child_process");
  const excludeArgs = STALE_NAME_EXCLUDES.flatMap((entry) => [
    "-g",
    `!${entry}/**`,
  ]);
  const matches = execSync(
    ["rg", "-n", "--hidden", ...excludeArgs, STALE_NAME_PATTERN, "."].join(" "),
    {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    },
  )
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  for (const match of matches) {
    violations.push(`STALE tech-stack name reference: ${match}`);
  }
} catch (error) {
  const exitCode =
    typeof error === "object" && error !== null && "status" in error
      ? error.status
      : null;
  if (exitCode === 1) {
    // rg exit 1 = no matches
  } else {
    for (const match of scanStaleNamesWithNode(root)) {
      violations.push(`STALE tech-stack name reference: ${match}`);
    }
  }
}

violations.push(...findRootSurfaceViolations(root));

if (violations.length > 0) {
  console.error("check-repo-layout FAILED (AGENTS.md layout):\n");
  for (const v of violations) console.error(`  - ${v}`);
  console.error(
    "\nInstall: pnpm install (repo root only). Product deps: root package.json. App dir: site/. Lock: pnpm-lock.yaml only.",
  );
  console.error(
    "Never: site/node_modules, package-lock.json, yarn.lock, site/results dumps.",
  );
  console.error(
    "Root: pinned Markdown only + at most 2 session .md; no stray scripts (use scripts/).",
  );
  process.exit(1);
}

console.log(
  "check-repo-layout OK — required workspace present; no nested installs or wrong locks",
);
process.exit(0);
