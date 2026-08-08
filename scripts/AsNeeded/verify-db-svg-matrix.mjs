#!/usr/bin/env node
/**
 * DB-SVG / plan-symbol PNG matrix verifier (post product-studio retirement).
 *
 * Admin product-studio tree is gone — fork surface is `/oostudio` + shared
 * `@/lib/catalog/publish/*` + `@/features/shared/catalog/*`. Matrix rows only
 * name test files that exist on disk.
 *
 * Evidence: results/tests/db-svg-matrix.json
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadEnvLocal } = require("../general/loadEnvLocal.cjs");

const repoRoot = path.resolve(import.meta.dirname, "../..");
const outDir = path.join(repoRoot, "results/tests");

/** Hardcoded in catalogAssetStorage.server.ts — not an env var. */
const CATALOG_ASSETS_BUCKET = "catalog-assets";

/**
 * Live residual matrix. Retired product-studio-only rows removed (08d).
 * Studio PNG pipeline deep proof remains Task 09.
 */
const MATRIX = [
  {
    id: "DB-SVG-01",
    note: "Release authority + dual-write gates (shared lib)",
    tests: [
      "tests/unit/lib/catalog/publish/svgReleaseAuthority.test.ts",
    ],
  },
  {
    id: "DB-SVG-02",
    note: "PNG checksum helpers (idempotent upload bytes)",
    tests: [
      "tests/unit/lib/catalog/publish/checksumPngBuffer.test.ts",
    ],
  },
  {
    id: "DB-SVG-03",
    note: "Plan-symbol PNG quality gate",
    tests: [
      "tests/unit/lib/catalog/publish/planSymbolPngQualityGate.test.ts",
    ],
  },
  {
    id: "DB-SVG-04",
    note: "Released catalog product contract (shared)",
    tests: [
      "tests/unit/features/shared/catalog/releasedCatalogProductContract.test.ts",
      "tests/unit/features/admin/catalog/releasedCatalogContract.test.ts",
    ],
  },
  {
    id: "DB-SVG-05",
    note: "Catalog asset storage server helpers",
    tests: [
      "tests/unit/features/shared/catalog/catalogAssetStorage.server.test.ts",
    ],
  },
  {
    id: "DB-SVG-06",
    note: "PNG release verify script + SVG→PNG migration",
    tests: [
      "tests/unit/scripts/verify-png-release.test.ts",
      "tests/unit/scripts/migrate-svg-catalog-to-png.test.ts",
    ],
  },
  {
    id: "DB-SVG-07",
    note: "Admin mutators CSRF + rate limit matrix (live surfaces)",
    tests: [
      "tests/unit/app/api/mutation-route-safety.matrix.test.ts",
    ],
  },
  {
    id: "DB-SVG-08",
    note: "Admin features / price-books / catalogs route gates (08a)",
    tests: [
      "tests/unit/app/api/admin/features/route.test.ts",
      "tests/unit/app/api/admin/price-books/route.test.ts",
      "tests/unit/app/api/admin/catalogs/[type]/route.test.ts",
    ],
  },
];

loadEnvLocal();

const deployEnv = {
  supabaseUrl: Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
      process.env.SUPABASE_URL?.trim(),
  ),
  supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
  catalogBucket: CATALOG_ASSETS_BUCKET,
};

function assertTestsExist(files) {
  const missing = files.filter((f) => !existsSync(path.join(repoRoot, f)));
  if (missing.length > 0) {
    return {
      ok: false,
      status: 1,
      stdout: "",
      stderr: `Missing matrix test files:\n${missing.map((m) => `  - ${m}`).join("\n")}\n`,
    };
  }
  return null;
}

function runVitest(files) {
  const unique = [...new Set(files)];
  const missing = assertTestsExist(unique);
  if (missing) return missing;

  const result = spawnSync(
    "pnpm",
    ["exec", "vitest", "run", "--config", "tests/vitest.config.ts", ...unique],
    {
      cwd: repoRoot,
      encoding: "utf8",
      shell: true,
    },
  );
  return {
    ok: result.status === 0,
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

const allTestFiles = MATRIX.flatMap((row) => row.tests);
const run = runVitest(allTestFiles);

const rows = MATRIX.map((row) => ({
  ...row,
  status: run.ok ? "PASS" : "FAIL",
}));

const deployReady = deployEnv.supabaseUrl && deployEnv.supabaseServiceRole;

const report = {
  ok: run.ok && deployReady,
  at: new Date().toISOString(),
  matrix: rows,
  deploy: {
    ready: deployReady,
    ...deployEnv,
    note: deployReady
      ? `Deploy env ready — Supabase URL + service role; bucket ${CATALOG_ASSETS_BUCKET}`
      : "Deploy / preview env flip OPEN — set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env.local",
  },
  vitest: {
    status: run.status,
    files: [...new Set(allTestFiles)],
    stderrTail: run.stderr.slice(-2000),
  },
};

mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "db-svg-matrix.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
// Vitest green is the gate for this script; deploy readiness is reported but not fatal
// when only local residual evidence is required (08d).
process.exit(run.ok ? 0 : 1);
