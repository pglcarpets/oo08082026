import { defineConfig } from "vitest/config";
import path from "path";

import {
  VITEST_CACHE_DIR,
  VITEST_COMMON_COVERAGE_REPORTERS,
  VITEST_COMMON_EXCLUDE,
  VITEST_COVERAGE_DIRS,
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
    globals: true,
    environment: "happy-dom",
    setupFiles: [VITEST_SETUP_FILE],
    reporters: ["default", "json"],
    include: [
      "../tests/unit/features/admin/**/*.test.ts",
      "../tests/unit/features/admin/**/*.test.tsx",
      "../tests/unit/app/api/admin/**/*.test.ts",
      "../tests/unit/app/admin/**/*.test.ts",
      "../tests/unit/app/admin/**/*.test.tsx",
    ],
    exclude: [...VITEST_COMMON_EXCLUDE],
    coverage: {
      provider: "v8",
      reportsDirectory: VITEST_COVERAGE_DIRS.admin,
      reporter: [...VITEST_COMMON_COVERAGE_REPORTERS],
      // `coverage.all` was removed in Vitest 4 — every file matching
      // `include` is instrumented by default. The option was silently ignored
      // here and type-errored under `typecheck:tests`.
      include: ["features/admin/**/*.{ts,tsx}"],
      exclude: [
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/node_modules/**",
        "**/archive/**",
        "**/.next/**",
        "**/public/**",
        "**/results/**",
        "**/scripts/**",
        "**/tests/**",
      ],
      // User quality bar: 95% floor on admin include.
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
    },
  },
});
