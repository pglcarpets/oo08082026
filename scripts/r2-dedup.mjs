/**
 * Analyze R2 bucket storage by prefix and find all duplicate objects.
 * Duplicates = same image number stored in both .jpg and .webp (or .png).
 * Keeps .webp (smaller), deletes .jpg/.png duplicates.
 *
 * Usage: node scripts/r2-dedup.mjs [--dry-run] [--delete]
 */
import { ListObjectsV2Command, DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env.local") });
dotenv.config({ path: path.join(root, "site", ".env.local") });

const dryRun = process.argv.includes("--dry-run");
const doDelete = process.argv.includes("--delete");

function resolveIntactCredentials() {
  const pairs = [
    [process.env.CLOUDFLARE_R2_ACCESS_KEY_ID, process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY, "cloudflare-r2"],
    [process.env.CLOUDFLARE_ACCESS_KEY_ID, process.env.CLOUDFLARE_SECRET_ACCESS_KEY, "cloudflare-access"],
    [process.env.CLOULD_ACCESS_KEY_ID, process.env.CLOULDFLARE_S3_SECRET_ACCESS_KEY, "legacy-typo"],
  ];
  for (const [access, secret, source] of pairs) {
    const accessKeyId = access?.trim() ?? "";
    const secretAccessKey = secret?.trim() ?? "";
    if (accessKeyId && secretAccessKey) {
      return { accessKeyId, secretAccessKey, source };
    }
  }
  return null;
}

const bucket =
  process.env.CLOUDFLARE_R2_CATALOG_BUCKET?.trim() ||
  process.env.CLOUDFLARE_R2_BUCKET?.trim() ||
  process.env.R2_CATALOG_BUCKET?.trim() ||
  "";
if (!bucket) throw new Error("Missing R2 bucket: set CLOUDFLARE_R2_CATALOG_BUCKET in .env.local");

const endpoint =
  process.env.CLOUDFLARE_S3_URL?.trim() ||
  process.env.CLOULDFLARE_S3_URL?.trim() ||
  (process.env.CLOUDFLARE_ACCOUNT_ID
    ? `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : null);

const credentials = resolveIntactCredentials();
if (!endpoint || !credentials) {
  console.error("Missing R2 endpoint or intact S3 pair.");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint,
  credentials: { accessKeyId: credentials.accessKeyId, secretAccessKey: credentials.secretAccessKey },
});

// ── Step 1: List all objects ──────────────────────────────────────────────
console.log(`Scanning bucket: ${bucket} ...`);
const allObjects = [];
let token;
do {
  const out = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token, MaxKeys: 1000 }),
  );
  for (const item of out.Contents ?? []) {
    if (item.Key) {
      allObjects.push({ key: item.Key, size: item.Size ?? 0, lastModified: item.LastModified?.toISOString() ?? "" });
    }
  }
  token = out.IsTruncated ? out.NextContinuationToken : undefined;
} while (token);

// ── Step 2: Storage breakdown by top-level prefix ─────────────────────────
const byPrefix = {};
let totalBytes = 0;
for (const o of allObjects) {
  totalBytes += o.size;
  const p = o.key.split("/")[0];
  if (!byPrefix[p]) byPrefix[p] = { count: 0, bytes: 0, samples: [] };
  byPrefix[p].count++;
  byPrefix[p].bytes += o.size;
  if (byPrefix[p].samples.length < 3) byPrefix[p].samples.push(o.key);
}

console.log(`\nTotal objects: ${allObjects.length}  Total size: ${(totalBytes / 1024 / 1024 / 1024).toFixed(2)} GB\n`);
console.log("Storage by prefix:");
for (const [p, d] of Object.entries(byPrefix).sort((a, b) => b[1].bytes - a[1].bytes)) {
  console.log(`  ${p}: ${d.count} files, ${(d.bytes / 1024 / 1024 / 1024).toFixed(2)} GB`);
  for (const k of d.samples) console.log(`    ${k}`);
}

// ── Step 3: Find duplicates ───────────────────────────────────────────────
// Group by (folder, image-number) — same image stored in multiple formats
const imagePattern = /^(.*\/image-)0*(\d+)\.([a-z0-9]+)$/i;
const byImageId = new Map();

for (const obj of allObjects) {
  const match = obj.key.match(imagePattern);
  if (match) {
    const folder = match[1].replace(/\/$/, ""); // e.g. images/catalog/oando-seating--arvo/image-
    const num = Number.parseInt(match[2], 10);
    const id = `${folder}${num}`;
    if (!byImageId.has(id)) byImageId.set(id, []);
    byImageId.get(id).push(obj);
  }
}

// For each group with >1 file, pick the one to keep (prefer .webp, then smallest)
const toDelete = [];
let keptBytes = 0;
let deletedBytes = 0;

for (const [_id, objs] of byImageId) {
  if (objs.length <= 1) {
    keptBytes += objs[0]?.size ?? 0;
    continue;
  }

  // Prefer .webp (smallest for same quality), then smallest file
  const webp = objs.filter((o) => o.key.endsWith(".webp"));
  const keep = webp.length > 0
    ? webp.sort((a, b) => a.size - b.size)[0]
    : objs.sort((a, b) => a.size - b.size)[0];

  keptBytes += keep.size;

  for (const obj of objs) {
    if (obj.key !== keep.key) {
      toDelete.push({ ...obj, reason: `duplicate of ${keep.key}` });
      deletedBytes += obj.size;
    }
  }
}

// Also find non-image duplicates (same size, different key — likely backups)
const backups = allObjects.filter((o) => o.key.startsWith("backups/"));
const backupBytes = backups.reduce((s, o) => s + o.size, 0);

console.log(`\n═══ DUPLICATE ANALYSIS ═══`);
console.log(`Image duplicate groups: ${[...byImageId.values()].filter((o) => o.length > 1).length}`);
console.log(`Files to delete (image dupes): ${toDelete.length}`);
console.log(`Bytes to free (image dupes): ${(deletedBytes / 1024 / 1024).toFixed(1)} MB`);
console.log(`Backup objects: ${backups.length} (${(backupBytes / 1024 / 1024 / 1024).toFixed(2)} GB)`);
console.log(`Non-image, non-backup objects: ${allObjects.length - [...byImageId.values()].flat().length - backups.length}`);

// Show some examples
if (toDelete.length > 0) {
  console.log(`\nSample deletions (first 30):`);
  for (const d of toDelete.slice(0, 30)) {
    console.log(`  ${d.key}  (${(d.size / 1024).toFixed(0)} KB)  — ${d.reason}`);
  }
}

// ── Step 4: Delete if requested ───────────────────────────────────────────
if (doDelete && toDelete.length > 0) {
  console.log(`\n⚠️  DELETING ${toDelete.length} duplicate objects from ${bucket}...`);

  // Batch delete (max 1000 per request)
  for (let i = 0; i < toDelete.length; i += 1000) {
    const batch = toDelete.slice(i, i + 1000);
    const result = await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: batch.map((d) => ({ Key: d.key })),
          Quiet: false,
        },
      }),
    );

    const errors = result.Errors ?? [];
    const deleted = result.Deleted ?? [];
    console.log(`  Batch ${Math.floor(i / 1000) + 1}: deleted=${deleted.length} errors=${errors.length}`);
    for (const e of errors) {
      console.error(`    ERROR: ${e.Key} — ${e.Code} ${e.Message}`);
    }
  }

  console.log(`\n✅ Deleted ${toDelete.length} duplicate objects. Freed ${(deletedBytes / 1024 / 1024).toFixed(1)} MB.`);
} else if (dryRun && toDelete.length > 0) {
  console.log(`\n📋 DRY RUN — ${toDelete.length} objects would be deleted, freeing ${(deletedBytes / 1024 / 1024).toFixed(1)} MB.`);
  console.log("Run with --delete to actually delete.");
} else {
  console.log(`\nNo action taken. Use --dry-run or --delete.`);
}

// ── Step 5: Save report ──────────────────────────────────────────────────
const report = {
  scannedAt: new Date().toISOString(),
  bucket,
  totalObjects: allObjects.length,
  totalBytes,
  totalGB: (totalBytes / 1024 / 1024 / 1024).toFixed(2),
  storageByPrefix: Object.fromEntries(
    Object.entries(byPrefix).map(([k, v]) => [k, { count: v.count, bytes: v.bytes, gb: (v.bytes / 1024 / 1024 / 1024).toFixed(2) }])
  ),
  duplicateImageGroups: [...byImageId.values()].filter((o) => o.length > 1).length,
  filesToDelete: toDelete.length,
  bytesToFree: deletedBytes,
  backupObjects: backups.length,
  backupBytes,
  deletions: toDelete.map((d) => ({ key: d.key, size: d.size, reason: d.reason })),
};

const outDir = path.join(root, "results", "audits");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "r2-dedup-report.json");
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`\nReport saved to ${outPath}`);
