/**
 * One-shot live-module coverage (unique reports dir to avoid concurrent wipe races).
 * Not a gate entry — measurement only.
 */
import { defineConfig } from "vitest/config";
import path from "path";

import {
  VITEST_CACHE_DIR,
  VITEST_COMMON_COVERAGE_REPORTERS,
  VITEST_COMMON_EXCLUDE,
  VITEST_REPO_ROOT,
  VITEST_SETUP_FILE,
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
    maxWorkers: 1,
    fileParallelism: false,
    globals: true,
    environment: "happy-dom",
    setupFiles: [VITEST_SETUP_FILE],
    reporters: ["default"],
    include: [
      "../tests/unit/features/admin/**/*.test.ts",
      "../tests/unit/features/admin/**/*.test.tsx",
    ],
    exclude: [...VITEST_COMMON_EXCLUDE],
    coverage: {
      provider: "v8",
      reportsDirectory: path.resolve(
        VITEST_WORKSPACE_ROOT,
        "results/coverage-admin-live",
      ),
      reporter: [...VITEST_COMMON_COVERAGE_REPORTERS, "text", "json-summary"],
      // Live admin residual modules (product-studio tree retired → /oostudio).
      include: [
        "features/admin/api/**/*.ts",
        "features/admin/catalog/**/*.ts",
        "features/admin/feature-flags/**/*.{ts,tsx}",
        "features/admin/pricing/**/*.{ts,tsx}",
        "features/admin/ui/**/*.{ts,tsx}",
        "lib/catalog/publish/**/*.ts",
        "features/shared/catalog/**/*.ts",
      ],
      exclude: [
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/node_modules/**",
      ],
      // Measurement only — report real %; do not fail the run on thresholds here
      thresholds: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      },
    },
  },
});
