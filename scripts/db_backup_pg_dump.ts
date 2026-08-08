/**
 * Logical backup via pg_dump for products or admin Supabase.
 *
 * Usage:
 *   npx tsx scripts/db_backup_pg_dump.ts --target products
 *   npx tsx scripts/db_backup_pg_dump.ts --target admin
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { resolvePgDumpExecutable } from "./lib/resolvePgDump";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();

const TARGETS = {
  products: "PRODUCTS_DATABASE_URL",
  admin: "SUPABASE_AUTH_DATABASE_URL",
} as const;

type Target = keyof typeof TARGETS;

function pickArg(name: string): string | null {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : null;
}

function timestamp(): string {
  return new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
}

function main() {
  const target = (pickArg("--target") ?? "products") as Target;
  if (!(target in TARGETS)) {
    console.error(`Unknown --target ${target}. Use: products | admin`);
    process.exit(1);
  }

  const envKey = TARGETS[target];
  const url = process.env[envKey]?.trim();
  if (!url) {
    console.error(`Missing ${envKey} in repo-root .env.local`);
    process.exit(1);
  }

  const outDir = resolve(process.cwd(), "backups");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outFile = resolve(outDir, `pgdump-${target}-${timestamp()}.dump`);

  console.log(`Backing up ${target} (${envKey}) → ${outFile}`);
  const pgDump = resolvePgDumpExecutable();
  const result = spawnSync(pgDump, ["-Fc", "-f", outFile, url], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(result.error.message);
    console.error("Install PostgreSQL client tools and ensure pg_dump is on PATH.");
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  console.log(`OK: ${outFile}`);
}

main();
