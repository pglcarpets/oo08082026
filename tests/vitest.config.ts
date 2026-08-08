import { defineConfig } from "vitest/config";
import path from "path";
import { loadEnv } from "vite";

import {
  VITEST_CACHE_DIR,
  VITEST_COMMON_COVERAGE_REPORTERS,
  VITEST_COVERAGE_DIRS,
  VITEST_DEFAULT_EXCLUDE,
  VITEST_PLANNER_GATE_COVERAGE_EXCLUDE,
  VITEST_PLANNER_GATE_COVERAGE_INCLUDE,
  VITEST_PLANNER_GATE_THRESHOLDS,
  VITEST_REPORT_PATHS,
  VITEST_REPO_ROOT,
  VITEST_SETUP_FILE,
  VITEST_CONSOLE_REPORTER,
  VITEST_TEST_INCLUDE,
  VITEST_WORKSPACE_ROOT,
} from "./vitest.shared.ts";

/**
 * Vitest lives under monorepo `tests/`.
 * `root` stays the product app (`site/`) so aliases and coverage globs match source.
 */
export default defineConfig({
  root: VITEST_REPO_ROOT,
  // Keep Vite/Vitest cache off site/ so check:layout does not see site/node_modules.
  cacheDir: VITEST_CACHE_DIR,
  server: {
    fs: { allow: [VITEST_WORKSPACE_ROOT] },
  },
  resolve: {
    alias: {
      // Planner / Studio category aliases. These must precede the bare "@"
      // entry below, which would otherwise swallow "@planner/*" and "@studio/*".
      "@planner/components": path.resolve(VITEST_REPO_ROOT, "components/Planner"),
      "@planner/lib": path.resolve(VITEST_REPO_ROOT, "lib/Planner"),
      "@planner/hooks": path.resolve(VITEST_REPO_ROOT, "hooks/Planner"),
      "@planner/store": path.resolve(VITEST_REPO_ROOT, "store/Planner"),
      "@planner/server": path.resolve(VITEST_REPO_ROOT, "server/Planner"),
      "@studio/components": path.resolve(VITEST_REPO_ROOT, "components/Studio"),
      "@studio/lib": path.resolve(VITEST_REPO_ROOT, "lib/Studio"),
      "@studio/hooks": path.resolve(VITEST_REPO_ROOT, "hooks/Studio"),
      "@studio/store": path.resolve(VITEST_REPO_ROOT, "store/Studio"),
      "@studio/server": path.resolve(VITEST_REPO_ROOT, "server/Studio"),
      "@/types": path.resolve(VITEST_REPO_ROOT, "platform/types"),
      "@/app": path.resolve(VITEST_REPO_ROOT, "app"),
      "@/components": path.resolve(VITEST_REPO_ROOT, "components"),
      "@/data": path.resolve(VITEST_REPO_ROOT, "data"),
      "@/features": path.resolve(VITEST_REPO_ROOT, "features"),
      "@/lib": path.resolve(VITEST_REPO_ROOT, "lib"),
      "@/scripts": path.resolve(VITEST_WORKSPACE_ROOT, "scripts"),
      "@/tests": path.resolve(VITEST_WORKSPACE_ROOT, "tests"),
      "@focss": path.resolve(VITEST_WORKSPACE_ROOT, "site/focss"),
      "@": VITEST_REPO_ROOT,
    },
  },
  test: {
    env: {
      ...loadEnv("test", VITEST_WORKSPACE_ROOT, ""),
      // Intentionally "true" (not "1"): unit tests exercise real withAuth gates.
      // Local/E2E servers use DEV_AUTH_BYPASS=1 when bypass is wanted.
      DEV_AUTH_BYPASS: "true",
    },
    pool: "forks",
    // Windows + many forks race on node_modules resolution (lucide-react CJS
    // intermittently "Cannot find module" under full-suite load). Cap hard.
    maxWorkers: 4,
    globals: true,
    environment: "happy-dom",
    // Auth/session tests import `node:url`, `node:path`, `node:crypto` via
    // `site/lib/auth/session` and `tests/setup.ts`. Running them under
    // happy-dom externalizes `node:` and fails with "No such built-in module".
    // Override: auth tests run in node env (matches root vitest.config.ts).
    // @ts-expect-error -- vitest 4.x public types omit environmentMatchGlobs
    // (present in 3.x and runtime 4.1.10). Re-validate when bumping.
    environmentMatchGlobs: [["tests/unit/lib/auth/**/*.test.ts", "node"]],
    setupFiles: [VITEST_SETUP_FILE],
    reporters: [
      "default",
      "json",
      [VITEST_CONSOLE_REPORTER, { outputFile: VITEST_REPORT_PATHS.full.console }],
    ],
    outputFile: {
      json: VITEST_REPORT_PATHS.full.json,
    },
    include: [...VITEST_TEST_INCLUDE],
    exclude: [...VITEST_DEFAULT_EXCLUDE],
    coverage: {
      provider: "v8",
      reportsDirectory: VITEST_COVERAGE_DIRS.full,
      reporter: [...VITEST_COMMON_COVERAGE_REPORTERS],
      // `coverage.all` was removed in Vitest 4 — every file matching
      // `include` is instrumented by default. The option was silently ignored
      // here and type-errored under `typecheck:tests`.
      include: [...VITEST_PLANNER_GATE_COVERAGE_INCLUDE],
      exclude: [...VITEST_PLANNER_GATE_COVERAGE_EXCLUDE],
      thresholds: { ...VITEST_PLANNER_GATE_THRESHOLDS },
    },
  },
});
