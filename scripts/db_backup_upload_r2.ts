/**
 * Nightly-style Supabase backup: pg_dump both projects → Cloudflare R2.
 *
 * Usage:
 *   pnpm --filter oando-site run backup:supabase:r2
 *   pnpm --filter oando-site run backup:supabase:r2 -- --keep-local
 *
 * R2 layout:
 *   backups/products/pgdump-products-<timestamp>.dump
 *   backups/admin/pgdump-admin-<timestamp>.dump
 *
 * Schedule: GitHub Actions workflow `.github/workflows/supabase-backup-r2.yml` (daily + manual).
 * Local one-off: same command if `pg_dump` is installed.
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createR2CatalogClient, resolveCatalogBucketName } from "./lib/r2Catalog";
import { resolvePgDumpExecutable } from "./lib/resolvePgDump";
import { REPO_ROOT } from "./lib/repoRoot";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();

export const TARGETS = {
  products: "PRODUCTS_DATABASE_URL",
  admin: "SUPABASE_AUTH_DATABASE_URL",
} as const;

export type Target = keyof typeof TARGETS;

export function hasFlag(flag: string, argv: string[] = process.argv): boolean {
  return argv.includes(flag);
}

export function pickTargets(argv: string[] = process.argv): Target[] {
  const fromCli: Target[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--target" && argv[i + 1]) {
      const value = argv[i + 1] as Target;
      if (value in TARGETS) fromCli.push(value);
    }
  }
  return fromCli.length > 0 ? [...new Set(fromCli)] : ["products", "admin"];
}

export function timestamp(now: () => Date = () => new Date()): string {
  return now().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
}

export async function uploadFile(
  localPath: string,
  key: string,
  deps: {
    createClient?: typeof createR2CatalogClient;
    resolveBucket?: typeof resolveCatalogBucketName;
    putCommand?: typeof PutObjectCommand;
    readStream?: typeof createReadStream;
    log?: typeof console.log;
  } = {},
): Promise<void> {
  const createClient = deps.createClient ?? createR2CatalogClient;
  const resolveBucket = deps.resolveBucket ?? resolveCatalogBucketName;
  const Put = deps.putCommand ?? PutObjectCommand;
  const readStream = deps.readStream ?? createReadStream;
  const log = deps.log ?? console.log;

  const client = createClient();
  const bucket = resolveBucket();
  await client.send(
    new Put({
      Bucket: bucket,
      Key: key,
      Body: readStream(localPath),
      ContentType: "application/octet-stream",
    }),
  );
  log(`Uploaded s3://${bucket}/${key}`);
}

export async function backupTarget(
  target: Target,
  keepLocal: boolean,
  pgDump: string,
  deps: {
    env?: NodeJS.ProcessEnv;
    spawn?: typeof spawnSync;
    upload?: typeof uploadFile;
    exists?: typeof existsSync;
    mkdir?: typeof mkdirSync;
    unlink?: typeof unlinkSync;
    resolvePath?: typeof resolve;
    cwd?: () => string;
    now?: () => Date;
    log?: typeof console.log;
    warn?: typeof console.warn;
  } = {},
): Promise<"skipped" | "uploaded"> {
  const env = deps.env ?? process.env;
  const spawn = deps.spawn ?? spawnSync;
  const upload = deps.upload ?? uploadFile;
  const exists = deps.exists ?? existsSync;
  const mkdir = deps.mkdir ?? mkdirSync;
  const unlink = deps.unlink ?? unlinkSync;
  const resolvePath = deps.resolvePath ?? resolve;
  const cwd = deps.cwd ?? (() => process.cwd());
  const now = deps.now ?? (() => new Date());
  const log = deps.log ?? console.log;
  const warn = deps.warn ?? console.warn;

  const envKey = TARGETS[target];
  const url = env[envKey]?.trim();
  if (!url) {
    warn(`Skip ${target}: missing ${envKey}`);
    return "skipped";
  }

  const outDir = resolvePath(cwd(), "backups");
  if (!exists(outDir)) mkdir(outDir, { recursive: true });
  const fileName = `pgdump-${target}-${timestamp(now)}.dump`;
  const localPath = resolvePath(outDir, fileName);

  log(`Dumping ${target} (${envKey}) → ${localPath}`);
  const dump = spawn(pgDump, ["-Fc", "-f", localPath, url], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (dump.error) {
    throw dump.error;
  }
  if (dump.status !== 0) {
    throw new Error(`pg_dump failed for ${target} (exit ${dump.status ?? "unknown"})`);
  }

  const r2Key = `backups/${target}/${fileName}`;
  await upload(localPath, r2Key);

  if (!keepLocal) {
    unlink(localPath);
    log(`Removed local copy ${localPath}`);
  }
  return "uploaded";
}

/** Optional JSON table export fallback → R2 (products Supabase REST snapshot). */
export async function uploadLatestJsonBackup(
  deps: {
    repoRoot?: string;
    exists?: typeof existsSync;
    readdir?: typeof readdirSync;
    stat?: typeof statSync;
    resolvePath?: typeof resolve;
    createClient?: typeof createR2CatalogClient;
    resolveBucket?: typeof resolveCatalogBucketName;
    putCommand?: typeof PutObjectCommand;
    readStream?: typeof createReadStream;
    log?: typeof console.log;
  } = {},
): Promise<number> {
  const repoRoot = deps.repoRoot ?? REPO_ROOT;
  const exists = deps.exists ?? existsSync;
  const readdir = deps.readdir ?? readdirSync;
  const stat = deps.stat ?? statSync;
  const resolvePath = deps.resolvePath ?? resolve;
  const createClient = deps.createClient ?? createR2CatalogClient;
  const resolveBucket = deps.resolveBucket ?? resolveCatalogBucketName;
  const Put = deps.putCommand ?? PutObjectCommand;
  const readStream = deps.readStream ?? createReadStream;
  const log = deps.log ?? console.log;

  const backupRoot = resolvePath(repoRoot, "results", "backups", "supabase");
  if (!exists(backupRoot)) {
    log("Skip JSON backup upload: no results/backups/supabase (run supabase:backup first).");
    return 0;
  }

  const folders = readdir(backupRoot)
    .map((name) => {
      const full = resolvePath(backupRoot, name);
      return { name, full, mtime: stat(full).mtimeMs };
    })
    .filter((entry) => stat(entry.full).isDirectory())
    .sort((a, b) => b.mtime - a.mtime);

  const latest = folders[0];
  if (!latest) return 0;

  log(`Uploading JSON backup folder ${latest.name} → R2...`);
  const client = createClient();
  const bucket = resolveBucket();
  const prefix = `backups/supabase-json/${latest.name}`;

  let count = 0;
  for (const file of readdir(latest.full)) {
    const localPath = resolvePath(latest.full, file);
    if (!stat(localPath).isFile()) continue;
    await client.send(
      new Put({
        Bucket: bucket,
        Key: `${prefix}/${file}`,
        Body: readStream(localPath),
        ContentType: file.endsWith(".json") ? "application/json" : "application/octet-stream",
      }),
    );
    count += 1;
  }
  log(`Uploaded JSON snapshot to s3://${bucket}/${prefix}/`);
  return count;
}

export async function main(
  argv: string[] = process.argv,
  deps: {
    resolvePgDump?: typeof resolvePgDumpExecutable;
    backup?: typeof backupTarget;
    uploadJson?: typeof uploadLatestJsonBackup;
    log?: typeof console.log;
  } = {},
): Promise<void> {
  const resolvePgDump = deps.resolvePgDump ?? resolvePgDumpExecutable;
  const backup = deps.backup ?? backupTarget;
  const uploadJson = deps.uploadJson ?? uploadLatestJsonBackup;
  const log = deps.log ?? console.log;

  const keepLocal = hasFlag("--keep-local", argv);
  const includeJson = hasFlag("--with-json", argv);
  const pgDump = resolvePgDump();
  log(`Using pg_dump: ${pgDump}`);

  for (const target of pickTargets(argv)) {
    await backup(target, keepLocal, pgDump);
  }

  if (includeJson) {
    await uploadJson();
  }

  log("OK: Supabase backup → R2 finished.");
}

function isMain(): boolean {
  const entry = (process.argv[1] ?? "").replace(/\\/g, "/");
  return entry.endsWith("db_backup_upload_r2.ts") || entry.endsWith("db_backup_upload_r2.js");
}

if (isMain()) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
