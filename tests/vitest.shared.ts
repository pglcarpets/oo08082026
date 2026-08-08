import path from "path";
import { fileURLToPath } from "node:url";

/** This folder (`tests/`) — vitest config home. */
const TESTS_DIR = path.dirname(fileURLToPath(import.meta.url));

/** Monorepo root (parent of `tests/` and `site/`). */
export const VITEST_WORKSPACE_ROOT = path.resolve(TESTS_DIR, "..");

/** Product Next app root (`site/`). Aliases + coverage include paths. */
export const VITEST_REPO_ROOT = path.join(VITEST_WORKSPACE_ROOT, "site");

/** Vite/Vitest cache — must stay off site/ (check:layout forbids site/node_modules). */
export const VITEST_CACHE_DIR = path.join(
  VITEST_WORKSPACE_ROOT,
  "node_modules",
  ".vite",
);

/** Test files root (same as tests/). */
export const VITEST_TESTS_DIR = TESTS_DIR;

export const VITEST_RESULTS_DIR = path.resolve(
  VITEST_WORKSPACE_ROOT,
  "results/tests",
);

export const VITEST_REPORT_PATHS = {
  full: {
    json: path.resolve(VITEST_RESULTS_DIR, "vitest-results.json"),
    console: path.resolve(VITEST_RESULTS_DIR, "vitest-console.json"),
    csv: path.resolve(VITEST_RESULTS_DIR, "vitest-results.csv"),
    html: path.resolve(VITEST_RESULTS_DIR, "vitest-results.html"),
  },
  site: {
    json: path.resolve(VITEST_RESULTS_DIR, "vitest-site-results.json"),
    console: path.resolve(VITEST_RESULTS_DIR, "vitest-site-console.json"),
    csv: path.resolve(VITEST_RESULTS_DIR, "vitest-site-results.csv"),
    html: path.resolve(VITEST_RESULTS_DIR, "vitest-site-results.html"),
  },
  p0: {
    json: path.resolve(VITEST_RESULTS_DIR, "vitest-p0-results.json"),
    console: path.resolve(VITEST_RESULTS_DIR, "vitest-p0-console.json"),
    csv: path.resolve(VITEST_RESULTS_DIR, "vitest-p0-results.csv"),
    html: path.resolve(VITEST_RESULTS_DIR, "vitest-p0-results.html"),
  },
} as const;

export const VITEST_CONSOLE_REPORTER = path.resolve(
  VITEST_WORKSPACE_ROOT,
  "config/build/vitest-console-reporter.ts",
);

export const VITEST_COVERAGE_DIRS = {
  full: path.resolve(VITEST_WORKSPACE_ROOT, "results/coverage"),
  site: path.resolve(VITEST_WORKSPACE_ROOT, "results/coverage-site"),
  admin: path.resolve(VITEST_WORKSPACE_ROOT, "results/coverage-admin"),
} as const;

export const VITEST_COVERAGE_REPORT_DIRS = {
  full: path.resolve(VITEST_WORKSPACE_ROOT, "results/coverage-reports/planner"),
  site: path.resolve(VITEST_WORKSPACE_ROOT, "results/coverage-reports/site"),
  admin: path.resolve(VITEST_WORKSPACE_ROOT, "results/coverage-reports/admin"),
} as const;

export const VITEST_SETUP_FILE = path.resolve(VITEST_TESTS_DIR, "setup.ts");

/**
 * Include globs relative to vitest `root` (= site package).
 * Tests live one level up at monorepo `tests/`.
 */
export const VITEST_TEST_INCLUDE = [
  "../tests/**/*.test.ts",
  "../tests/**/*.test.tsx",
] as const;

export const VITEST_COMMON_EXCLUDE = [
  "**/node_modules/**",
  "**/.cursor/**",
  "**/.vscode/**",
  "**/.next/**",
  "**/.git/**",
  "**/.github/**",
  "**/.playwright-cli/**",
  "**/.turbo/**",
  "**/.vercel/**",
  "**/.swc/**",
  "**/.output/**",
  "**/__snapshots__/**",
  "**/__mocks__/**",
  "**/*.md",
  "**/*.log",
  "**/*.txt",
  "**/*.csv",
  "**/*.svg",
  "**/*.stories.*",
  // Archived suites (not gate). Explicit relative + glob — vitest root is site/.
  "**/archive/**",
  "../tests/archive/**",
  "**/tests/archive/**",
  "**/public/**",
  "**/results/**",
  "scripts/**",
  "**/Plans/**",
  "**/docs/**",
  "**/Agents/**",
  "**/generated-documents/**",
] as const;

/**
 * Heavy FS/codegen suite — excluded from the default parallel pool and run via
 * `tests/vitest.tech-docs.config.ts` (low concurrency) as a second lane of
 * `pnpm run test`. Keeping it in the default fork pool starves ~8000 other
 * tests and times out under load.
 */
export const VITEST_TECH_DOCS_EXCLUDE = [
  "**/tech-docs-generator/**",
  "../tests/tech-docs-generator/**",
  "**/tests/tech-docs-generator/**",
] as const;

export const VITEST_DEFAULT_EXCLUDE = [
  ...VITEST_COMMON_EXCLUDE,
  ...VITEST_TECH_DOCS_EXCLUDE,
] as const;

export const VITEST_COMMON_COVERAGE_REPORTERS = [
  "text",
  "json",
  "json-summary",
  "html",
] as const;

/**
 * Planner/Studio ship gate allowlist — only modules with suite ownership ≥95%.
 * Expand this list when tests bring a file over the floor (never lower thresholds).
 * Inventory profile covers the full fork tree for dark metering.
 */
export const VITEST_PLANNER_GATE_COVERAGE_INCLUDE = [
  "lib/api/browserApi.ts",
  "lib/Planner/plannerApi.ts",
  "lib/Planner/plannerSnap.ts",
  "lib/Planner/plannerTokens.ts",
  "lib/Studio/studioDrawColors.ts",
  "lib/Studio/studioSnap.ts",
  "lib/Studio/studioTokens.ts",
] as const;

export const VITEST_PLANNER_GATE_COVERAGE_EXCLUDE = [
  "**/*.d.ts",
  "**/*.test.{ts,tsx}",
  "**/*.spec.{ts,tsx}",
  "**/*.mock.{ts,tsx}",
  "**/node_modules/**",
] as const;

/** Floor: 95% on gated include set (user quality bar). Expand tests before lowering. */
export const VITEST_PLANNER_GATE_THRESHOLDS = {
  statements: 95,
  branches: 95,
  functions: 95,
  lines: 95,
} as const;

export const VITEST_PLANNER_INVENTORY_COVERAGE_INCLUDE = [
  "app/api/**/*.{ts,tsx}",
  "features/Planner/**/*.{ts,tsx}",
  "features/Studio/**/*.{ts,tsx}",
  "features/crm/**/*.{ts,tsx}",
  "lib/**/*.{ts,tsx}",
  "server/**/*.{ts,tsx}",
  "platform/**/*.{ts,tsx}",
  "proxy.ts",
] as const;
