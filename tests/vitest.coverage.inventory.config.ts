/**
 * Dark-product inventory coverage — broad include, NO thresholds.
 * Do not chase 90% on this total. Use dual rollup for diagnosis.
 *
 *   pnpm run test:coverage:inventory
 */
import { defineConfig } from "vitest/config";
import path from "path";

import {
  VITEST_CACHE_DIR,
  VITEST_COMMON_COVERAGE_REPORTERS,
  VITEST_COMMON_EXCLUDE,
  VITEST_COVERAGE_DIRS,
  VITEST_PLANNER_INVENTORY_COVERAGE_INCLUDE,
  VITEST_REPORT_PATHS,
  VITEST_REPO_ROOT,
  VITEST_SETUP_FILE,
  VITEST_CONSOLE_REPORTER,
  VITEST_TEST_INCLUDE,
  VITEST_WORKSPACE_ROOT,
} from "./vitest.shared.ts";

export default defineConfig({
  root: VITEST_REPO_ROOT,
  cacheDir: VITEST_CACHE_DIR,
  server: {
    fs: { allow: [VITEST_WORKSPACE_ROOT] },
  },
  resolve: {
    alias: {
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
    pool: "forks",
    globals: true,
    environment: "happy-dom",
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
    exclude: [...VITEST_COMMON_EXCLUDE],
    coverage: {
      provider: "v8",
      reportsDirectory: path.resolve(
        VITEST_COVERAGE_DIRS.full,
        "..",
        "coverage-inventory",
      ),
      reporter: [...VITEST_COMMON_COVERAGE_REPORTERS],
      // `coverage.all` was removed in Vitest 4 — every file matching
      // `include` is instrumented by default. The option was silently ignored
      // here and type-errored under `typecheck:tests`.
      include: [...VITEST_PLANNER_INVENTORY_COVERAGE_INCLUDE],
      exclude: [
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/node_modules/**",
        "**/features/planner/_archive/**",
        "**/scripts/**",
        "**/tests/**",
        "**/public/**",
        "**/results/**",
        "**/generated-documents/**",
      ],
      // intentionally NO thresholds
    },
  },
});
