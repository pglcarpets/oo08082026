/**
 * Low-concurrency lane for `tests/tech-docs-generator/**`.
 *
 * Those cases do real filesystem + codegen work (often 10–35s each). Running them
 * in the default high-fan-out fork pool with ~8000 other tests causes timeouts
 * under load. Invoked as the second stage of `pnpm run test`.
 */
import { defineConfig } from "vitest/config";
import path from "path";
import { loadEnv } from "vite";

import {
  VITEST_CACHE_DIR,
  VITEST_COMMON_EXCLUDE,
  VITEST_CONSOLE_REPORTER,
  VITEST_REPO_ROOT,
  VITEST_RESULTS_DIR,
  VITEST_SETUP_FILE,
  VITEST_WORKSPACE_ROOT,
} from "./vitest.shared.ts";

const techDocsJson = path.resolve(VITEST_RESULTS_DIR, "vitest-tech-docs-results.json");
const techDocsConsole = path.resolve(
  VITEST_RESULTS_DIR,
  "vitest-tech-docs-console.json",
);
const techDocsPackageRoot = path.resolve(VITEST_WORKSPACE_ROOT, "tech-docs-generator");
const techDocsSetupFile = path.resolve(
  VITEST_WORKSPACE_ROOT,
  "tests/tech-docs-generator/setup.ts",
);

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
      // `mermaid` and `highlight.js` are declared only in tech-docs-generator's
      // package.json (not hoisted to the workspace root). This lane's tests live
      // under tests/tech-docs-generator/, so bare-specifier mocks must resolve to
      // the same module id as the component imports under tech-docs-generator/src/.
      mermaid: path.resolve(techDocsPackageRoot, "node_modules/mermaid"),
      "highlight.js": path.resolve(techDocsPackageRoot, "node_modules/highlight.js"),
    },
  },
  test: {
    env: {
      ...loadEnv("test", VITEST_WORKSPACE_ROOT, ""),
      DEV_AUTH_BYPASS: "true",
    },
    // Serial forks + isolate so per-file mocks stay correct. Generator model
    // is reused across files via the shared-repo-model disk cache.
    pool: "forks",
    isolate: true,
    maxWorkers: 1,
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 120_000,
    globals: true,
    environment: "happy-dom",
    // @ts-expect-error -- vitest 4.x public types omit environmentMatchGlobs
    environmentMatchGlobs: [["../tests/tech-docs-generator/snapshot.test.ts", "node"]],
    setupFiles: [VITEST_SETUP_FILE, techDocsSetupFile],
    globalSetup: [
      path.resolve(VITEST_WORKSPACE_ROOT, "tests/tech-docs-generator/global-setup.mjs"),
    ],
    reporters: [
      "default",
      "json",
      [VITEST_CONSOLE_REPORTER, { outputFile: techDocsConsole }],
    ],
    outputFile: {
      json: techDocsJson,
    },
    include: ["../tests/tech-docs-generator/**/*.test.{ts,tsx}"],
    exclude: [...VITEST_COMMON_EXCLUDE],
  },
});
