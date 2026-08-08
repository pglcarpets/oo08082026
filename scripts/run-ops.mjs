#!/usr/bin/env node
/**
 * Operational scripts — db, backup, seed, catalog, assets, e2e focus runs, etc.
 * Keeps package.json small; CI and runbooks call `pnpm run ops <name> [-- args]`.
 *
 *   pnpm run ops -- list
 *   pnpm run ops db:apply -- --dry
 *   pnpm run ops gate:open3d
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let argv = process.argv.slice(2);
if (argv[0] === "--") {
  argv = argv.slice(1);
}

/** @param {string} command @param {string[]} args @param {{ shell?: boolean }} opts */
function run(command, args, opts = {}) {
  // Windows resolves pnpm/vercel via .cmd shims; spawn without a shell → ENOENT.
  const useShell = opts.shell ?? process.platform === "win32";
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: useShell,
  });
  if (result.error) {
    process.stderr.write(
      `ops: failed to spawn ${command}: ${result.error.message}\n`,
    );
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

/** @param {string} rel @param {string[]} args */
function runNode(rel, args = []) {
  run(process.execPath, [path.join(ROOT, "scripts", rel), ...args]);
}

/** @param {string} rel @param {string[]} args */
function runGeneral(rel, args = []) {
  run(process.execPath, [path.join(ROOT, "scripts/general", rel), ...args]);
}

/** @param {string} rel @param {string[]} args */
function runAsNeeded(rel, args = []) {
  run(process.execPath, [path.join(ROOT, "scripts/AsNeeded", rel), ...args]);
}

/** @param {string} rel @param {string[]} args */
function runTsx(rel, args = []) {
  run("pnpm", [
    "exec",
    "tsx",
    "--tsconfig",
    path.join(ROOT, "scripts", "tsconfig.json"),
    path.join(ROOT, "scripts", rel),
    ...args,
  ]);
}

/** @param {string[]} specs @param {string[]} extra */
function runPlaywright(specs, extra = []) {
  run("pnpm", [
    "exec",
    "playwright",
    "test",
    "-c",
    "config/build/playwright.config.ts",
    ...specs,
    ...extra,
  ]);
}

/** @param {string[]} specs @param {string[]} extra */
function runPlaywrightClean(specs, extra = []) {
  runNode("clean-test-artifacts.mjs");
  runPlaywright(specs, extra);
}

/** @param {string} name */
function runPnpmScript(name, extra = []) {
  run("pnpm", ["run", name, ...extra]);
}

/** @type {Record<string, (args: string[]) => void>} */
const COMMANDS = {
  list: () => {
    const names = Object.keys(COMMANDS)
      .filter((name) => name !== "list")
      .sort();
    process.stdout.write(`${names.length} ops commands:\n`);
    for (const name of names) {
      process.stdout.write(`  ${name}\n`);
    }
  },

  "db:apply": (args) => runTsx("db_apply_migrations.ts", args),
  "db:apply:admin": () => runTsx("db_apply_migrations.ts", ["--target", "admin"]),
  "db:test": () => runTsx("db_test_connection.ts"),
  "db:types": () => {
    const result = spawnSync(
      "pnpm",
      ["exec", "supabase", "gen", "types", "--linked", "--schema", "public"],
      { cwd: ROOT, encoding: "utf8", shell: process.platform === "win32" },
    );
    if (result.status !== 0) {
      if (result.stderr) process.stderr.write(result.stderr);
      process.exit(result.status ?? 1);
    }
    fs.writeFileSync(
      path.join(ROOT, "site/platform/types/database.types.ts"),
      result.stdout,
    );
  },
  "db:types:admin": () => runTsx("db_gen_admin_types.ts"),
  "db:advisors": () => runTsx("db_advisors.ts"),
  "db:advisors:security": () => runTsx("db_advisors.ts", ["--security"]),
  "db:advisors:performance": () => runTsx("db_advisors.ts", ["--performance"]),
  "db:advisors:admin": () => runTsx("db_advisors_admin.ts"),
  "check:worker-origin": () => runGeneral("check-worker-origin.mjs"),
  "db:backup-dropped": () => runTsx("db_backup_dropped_tables.ts"),
  "db:backup:pgdump": () => runTsx("db_backup_pg_dump.ts"),
  "db:ensure-plans": () => runTsx("db_ensure_plans_table.ts"),
  "db:sync-drizzle": () => runTsx("db_sync_drizzle_schema.ts"),

  "backup:supabase:r2": () => runTsx("db_backup_upload_r2.ts"),
  "backup:github-secrets:sync": () =>
    run("pwsh", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      path.join(ROOT, "scripts/sync-github-backup-secrets.ps1"),
    ]),
  "catalog:snapshot:r2": () => runTsx("catalog_snapshot_upload_r2.ts"),
  "repo:backup:r2": () => runTsx("repo_backup_upload_r2.ts"),
  "backup:r2": () => {
    runTsx("db_backup_upload_r2.ts");
    runTsx("repo_backup_upload_r2.ts");
  },

  seed: () => runTsx("seed.ts"),
  "seed:managed": () => runTsx("seed_planner_managed_catalog.ts"),
  "seed:configurator": () => runTsx("seed_configurator_catalog.ts"),
  "seed:block-descriptors": () => runTsx("seed-block-descriptors.ts"),

  "sync:descriptor-svgs": () => runTsx("sync-descriptor-svgs.ts"),
  "audit:svg-catalog": () => runTsx("audit-svg-catalog.ts"),

  "catalog:blocks:qa": () => runTsx("generate_blocks.ts"),
  "catalog:qa:sheet": () => runTsx("render-catalog-qa-sheet.ts"),
  "catalog:organize:dry": () =>
    runTsx("organize-catalog-images.ts", ["--dry-run"]),
  "catalog:organize:apply": () =>
    runTsx("organize-catalog-images.ts", ["--apply"]),
  "catalog:organize:sync": () =>
    runTsx("organize-catalog-images.ts", ["--sync-db", "--sync-catalog"]),

  "supabase:assets:arrange": () => runTsx("arrange_supabase_catalog_assets.ts"),
  "supabase:backup": () => runTsx("backup_supabase.ts"),
  "audit:supabase:catalog": () => runTsx("audit_supabase_catalog.ts"),
  "audit:supabase:admin": () => runTsx("audit_supabase_admin.ts"),
  "supabase:backfill:canonical": () =>
    runTsx("backfill_canonical_catalog_metadata.ts"),
  "supabase:backfill:images": () => runTsx("backfill_missing_product_images.ts"),

  "audit:slug-id": () => runTsx("audit_slug_id_integrity.ts"),
  "audit:products:quality": () => runTsx("audit-product-quality.ts"),

  "alt:sync:dry": () => runTsx("sync-missing-alt-text.ts"),
  "alt:sync:apply": () => runTsx("sync-missing-alt-text.ts", ["--apply"]),

  "assets:cdn:sync": () => runNode("syncVendorCdnAssets.mjs"),
  "assets:cdn:catalog": () => runTsx("downloadCdnAssets.ts"),
  "assets:cdn:audit": () => runTsx("auditCdnAssetFailures.ts"),
  "assets:cdn:fix": () => runTsx("auditCdnAssetFailures.ts", ["--apply"]),
  "assets:cdn:replacements": () => runTsx("auditUnresolvedCdnPaths.ts"),
  "assets:r2:create-bucket": () => runTsx("create-bucket.ts"),
  "assets:r2:delete-bucket": () => runTsx("deleteR2Bucket.ts"),
  "assets:cdn:upload": () => runTsx("uploadCdnAssets.ts"),
  "assets:cdn:upload:incremental": () =>
    runTsx("uploadCdnAssets.ts", ["--skip-existing"]),
  "assets:audit:thirdparty": () =>
    run("python", [
      path.join(ROOT, "scripts/audit_external_asset_hosts.py"),
      "--fail-on-hit",
    ]),
  "assets:r2:count": () => runNode("count-r2-objects.mjs"),

  "launch:smoke": () => runNode("launch-smoke.mjs"),
  "launch:env": () => runGeneral("validate-launch-env.mjs"),
  "env:sync": () => runGeneral("sync-env-local-files.mjs"),

  "scan:secrets": () => runGeneral("scan_secrets.mjs"),
  "scan:tokens": () => runNode("sync-token-pairs.mjs"),
  "scan:hardcoding": () => runNode("scan-hardcoding.mjs"),

  "lint:secrets": () =>
    run("pnpm", [
      "exec",
      "secretlint",
      "**/*.{cjs,css,csv,html,js,json,jsx,md,mjs,ps1,py,sql,toml,ts,tsx,txt,yaml,yml}",
      ".env*",
      ".gitattributes",
      ".gitignore",
      ".npmrc",
      ".vercelignore",
    ]),
  "lint:type-aware": () => runGeneral("run-oxlint.mjs", ["--type-aware"]),
  "lint:ui": () => runGeneral("lint-ui-contract.mjs"),

  "typecheck:scripts": () =>
    run("pnpm", ["exec", "tsc", "-p", "scripts/tsconfig.json", "--noEmit"]),

  "verify:db-svg": () => runAsNeeded("verify-db-svg-matrix.mjs"),

  "docs:sync": () => runGeneral("generate-docs.mjs", ["--all"]),
  "docs:sync:all": () => runGeneral("generate-docs.mjs", ["--all"]),
  "docs:sync:routes": () => runGeneral("generate-route-index.mjs"),
  "docs:sync:sitemap-csv": () => runTsx("generate-sitemap-csv.ts"),
  "docs:sync:coverage": () => runGeneral("generate-docs.mjs", ["--coverage"]),
  "docs:check": () => runGeneral("generate-docs.mjs", ["--check"]),
  "docs:check:coverage": () =>
    runGeneral("generate-docs.mjs", ["--coverage", "--check"]),
  "docs:check:root-links": () => runGeneral("check-root-markdown-links.mjs"),

  "site-ui:matrix": () => runNode("generate-site-ui-route-matrix.mjs"),
  "check:site-ui": () => {
    runNode("check-site-page-shell.mjs");
    runNode("check-i18n-key-parity.mjs");
    runNode("check-marketing-copy-source.mjs");
    runNode("check-marketing-inline-style.mjs");
    runNode("check-homepage-dialect.mjs");
  },
  "check:site-ui:shell": () => runNode("check-site-page-shell.mjs"),
  "check:i18n:parity": () => runNode("check-i18n-key-parity.mjs"),
  "check:site-ui:copy": () => runNode("check-marketing-copy-source.mjs"),
  "check:site-ui:inline-style": () => runNode("check-marketing-inline-style.mjs"),
  "check:site-ui:dialect": () => runNode("check-homepage-dialect.mjs"),

  "i18n:sync:marketing": () => runNode("sync-marketing-i18n-messages.mjs"),
  "i18n:sync:hi-wave1": () => runNode("sync-hi-wave1-messages.mjs"),
  "i18n:sync:deferred-locales": () => runNode("sync-deferred-locale-messages.mjs"),
  "i18n:translate:deferred-locales": () =>
    runNode("translate-deferred-marketing-flat.mjs"),

  "codemod:homepage-dialect": () => runNode("codemods/homepage-dialect.mjs"),
  "failures:sync": () => runNode("export-pending-failures.mjs"),

  "planner:lift-verify": () =>
    runNode("planner-lift-project-trees.mjs", ["--verify"]),
  "planner:lift": () => runNode("planner-lift-project-trees.mjs"),

  "check-sharp": () => runGeneral("check-sharp.js"),
  "check:layout": () => runGeneral("check-repo-layout.mjs"),
  "check:failures": () => runGeneral("check-failures.mjs"),
  "check:agents-md": () => runGeneral("check-agents-md.mjs"),
  "check:agents-folder": () => runGeneral("check-agents-folder.mjs"),
  "check:active-docs": () => runGeneral("check-active-docs.mjs"),
  "check:plans-purity": () => runGeneral("check-plans-purity.mjs"),
  "check:docs-purity": () => runGeneral("check-docs-purity.mjs"),
  "check:docs-all": () => runPnpmScript("check:docs-all"),
  "check:style-tokens": () => runGeneral("check-style-tokens.mjs"),
  "check:governance": () => runGeneral("check-governance.mjs"),
  "check:product-icons": () => runGeneral("check-product-icons.mjs"),
  "check:composer-styles": () => runGeneral("check-composer-styles.mjs"),
  "check:ui-assets": () => {
    runGeneral("check-product-icons.mjs");
    runGeneral("check-composer-styles.mjs");
  },
  "check:launch": () => {
    runGeneral("validate-launch-env.mjs");
    runGeneral("scan_secrets.mjs");
    runTsx("db_test_connection.ts");
  },
  "seed:furniture": () => runTsx("seed_furniture_catalog.ts"),
  "test:audit": () => runGeneral("run-test-audits.mjs", ["--preset=release"]),
  "test:audit:fast": () => runGeneral("run-test-audits.mjs", ["--preset=fast"]),
  "test:audit:hollow": () => runGeneral("audit-hollow-tests.mjs"),
  "test:audit:fake-test": () =>
    run(process.execPath, [
      path.join(ROOT, "tech-docs-generator/scripts/fake-test-audit.mjs"),
    ]),
  "test:audit:gate-skips": () => runGeneral("audit-gate-skips.mjs"),
  "test:audit:eslint-disable": () => runGeneral("audit-eslint-disable.mjs"),
  "test:audit:api-routes": () => runGeneral("audit-api-route-safety.mjs"),
  "gate:site-ui": () => runNode("gate-site-ui.mjs"),

  "vercel:preview": () => run("pnpm", ["dlx", "vercel", "--yes"]),
  "vercel:prod": () => {
    runPnpmScript("release:gate");
    // CLI is not a workspace dep — dlx keeps installs out of package.json.
    run("pnpm", ["dlx", "vercel", "--prod", "--yes"]);
  },

  "dev:turbo": () =>
    run("pnpm", [
      "exec",
      "cross-env",
      "DEV_AUTH_BYPASS=1",
      "next",
      "dev",
      "site",
      "--turbo",
    ]),

  "tech-docs:generate": () => run("pnpm", ["--filter", "oando-tech-docs", "generate"]),
  "tech-docs:check": () => run("pnpm", ["--filter", "oando-tech-docs", "check"]),
  "tech-docs:typecheck": () =>
    run("pnpm", ["--filter", "oando-tech-docs", "typecheck"]),
  "tech-docs:test": () => run("pnpm", ["--filter", "oando-tech-docs", "test"]),
  "tech-docs:build": () => run("pnpm", ["--filter", "oando-tech-docs", "build"]),
  "test:tech-docs": () =>
    run("pnpm", [
      "exec",
      "vitest",
      "run",
      "--config",
      "tests/vitest.tech-docs.config.ts",
    ]),

  "test:browsers:install": () =>
    run("pnpm", ["exec", "playwright", "install", "chromium"]),
  "test:layout:check": () => runGeneral("check-test-layout.mjs"),
  "test:unit": () =>
    run("pnpm", [
      "exec",
      "vitest",
      "run",
      "--config",
      "tests/vitest.config.ts",
      "--exclude",
      "**/planner*",
    ]),
  "test:planner": () =>
    run("pnpm", [
      "exec",
      "vitest",
      "run",
      "--config",
      "tests/vitest.config.ts",
      "planner",
    ]),
  "test:planner:watch": () =>
    run("pnpm", [
      "exec",
      "vitest",
      "planner",
      "--config",
      "tests/vitest.config.ts",
    ]),
  "test:apps": () =>
    run("pnpm", [
      "exec",
      "vitest",
      "run",
      "tests/unit/planner",
      "tests/unit/studio",
    ]),
  "test:ui": () =>
    run("pnpm", ["exec", "vitest", "--ui", "--config", "tests/vitest.config.ts"]),
  "test:coverage:inventory": () => {
    runNode("clean-test-artifacts.mjs");
    run("pnpm", [
      "exec",
      "vitest",
      "run",
      "--coverage",
      "--config",
      "tests/vitest.coverage.inventory.config.ts",
    ]);
  },
  "test:coverage:admin": () => {
    runNode("clean-test-artifacts.mjs");
    run("pnpm", [
      "exec",
      "vitest",
      "run",
      "--coverage",
      "--config",
      "tests/vitest.admin.coverage.config.ts",
    ]);
    runNode("generate-coverage-report.mjs", ["admin"]);
  },
  "test:site-ui": () =>
    runPlaywrightClean([
      "tests/e2e/site-locale-switch.spec.ts",
      "tests/e2e/site-visual-regression.spec.ts",
    ]),
  "test:design-kit": () =>
    runPlaywrightClean(
      ["tests/e2e/design-kit-visual-regression.spec.ts"],
      ["--reporter=list"],
    ),
  "test:planner-catalog:watch": () =>
    runPlaywright(["tests/e2e/planner-catalog.spec.ts"], ["--ui"]),
  "test:e2e:open3d-world": () => runNode("run-open3d-world-e2e.mjs"),
  "test:e2e:world-standard-w1w2": () =>
    runPlaywright(
      ["tests/e2e/open3d-world-standard-journey.spec.ts"],
      ["--reporter=list"],
    ),
  "test:e2e:admin-retire-restore": () =>
    runNode("run-admin-retire-restore-canvas.mjs"),
  "test:e2e:assistant": () =>
    runPlaywrightClean(["tests/e2e/site-assistant-shell.spec.ts"]),
  "test:e2e:nav": () =>
    runPlaywrightClean([
      "tests/e2e/site-navigation-smoke.spec.ts",
      "tests/e2e/navigation-smoke.spec.ts",
    ]),
  "test:e2e:visual": () =>
    runPlaywright(["tests/e2e/site-visual-regression.spec.ts"]),
  "test:admin:production-auth": () =>
    run("pwsh", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      path.join(ROOT, "scripts/run-admin-production-auth-smoke.ps1"),
    ]),
  "test:auth:seed-users": () => runTsx("ensureAuthTestUsers.ts"),
  "test:auth:env": () => runTsx("checkAuthEnv.ts"),
  "p0:svg": () => runNode("smoke-svg-fixtures.mjs"),

  "gate:planner": () => {
    runPnpmScript("typecheck");
    runPlaywright(
      ["tests/e2e/open3d-world-standard-journey.spec.ts"],
      ["--reporter=list"],
    );
  },
  "gate:open3d": () => {
    runPnpmScript("typecheck");
    runNode("run-open3d-world-e2e.mjs");
  },
};

const name = argv[0];
const rest = argv.slice(1);

if (!name || name === "help" || name === "--help") {
  COMMANDS.list();
  process.exit(0);
}

const handler = COMMANDS[name];
if (!handler) {
  process.stderr.write(`ops: unknown command "${name}". Try: pnpm run ops list\n`);
  process.exit(1);
}

handler(rest);
