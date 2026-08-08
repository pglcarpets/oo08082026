/**
 * Git archive of the repo and upload to Cloudflare R2 (code backup layer 2).
 *
 * Layer 1: GitHub remote (push). This script is an offsite snapshot.
 *
 * Usage:
 *   npx tsx scripts/repo_backup_upload_r2.ts
 *   npx tsx scripts/repo_backup_upload_r2.ts --keep-local
 *
 * R2 key: backups/repo/oofplweb-<timestamp>.zip
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import {
  createR2CatalogClient,
  resolveCatalogBucketName,
} from "./lib/r2Catalog";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function timestamp(): string {
  return new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
}

function resolveRepoRoot(): string {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  return resolve(scriptDir, "..", "..");
}

async function main() {
  const repoRoot = resolveRepoRoot();
  const outDir = resolve(process.cwd(), "backups");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const fileName = `oofplweb-${timestamp()}.zip`;
  const localPath = resolve(outDir, fileName);

  console.log(`Archiving ${repoRoot} → ${localPath}`);
  const archive = spawnSync(
    "git",
    ["-C", repoRoot, "archive", "--format=zip", "-o", localPath, "HEAD"],
    { stdio: "inherit", shell: process.platform === "win32" },
  );

  if (archive.error) {
    console.error(archive.error.message);
    process.exit(1);
  }
  if (archive.status !== 0) {
    process.exit(archive.status ?? 1);
  }

  const client = createR2CatalogClient();
  const bucket = resolveCatalogBucketName();
  const r2Key = `backups/repo/${fileName}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: r2Key,
      Body: createReadStream(localPath),
      ContentType: "application/zip",
    }),
  );

  console.log(`Uploaded s3://${bucket}/${r2Key}`);

  if (!hasFlag("--keep-local")) {
    unlinkSync(localPath);
    console.log(`Removed local copy ${localPath}`);
  }

  console.log("OK: repo backup upload finished.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
