/**
 * List all objects in an R2 bucket and find duplicates by:
 * 1. Same key appearing more than once (shouldn't happen in S3 but just in case)
 * 2. Same content under different keys (e.g. image-1.jpg vs image-01.jpg)
 * 3. Same file name in different paths that are likely the same content
 *
 * Usage: node scripts/find-r2-duplicates.mjs [bucket] [--prefix=images/]
 */
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env.local") });
dotenv.config({ path: path.join(root, "site", ".env.local") });

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
  process.env.CLOUDFLARE_R2_CATALOG_BUCKET ||
  process.env.CLOUDFLARE_R2_BUCKET ||
  process.env.R2_CATALOG_BUCKET ||
  "oando-asset-cdn";

const prefixArg = process.argv.find((a) => a.startsWith("--prefix="));
const prefix = prefixArg ? prefixArg.slice("--prefix=".length) : undefined;

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

// Collect all objects
const allObjects = [];
let token;
do {
  const out = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: token,
      MaxKeys: 1000,
      Prefix: prefix,
    }),
  );
  for (const item of out.Contents ?? []) {
    if (item.Key) {
      allObjects.push({ key: item.Key, size: item.Size ?? 0, lastModified: item.LastModified?.toISOString() ?? "" });
    }
  }
  token = out.IsTruncated ? out.NextContinuationToken : undefined;
} while (token);

console.log(`Total objects: ${allObjects.length}`);

// Group by basename (filename only)
const byBasename = new Map();
for (const obj of allObjects) {
  const basename = path.posix.basename(obj.key);
  if (!byBasename.has(basename)) byBasename.set(basename, []);
  byBasename.get(basename).push(obj);
}

// Find basenames that appear under multiple keys
const duplicateBasenameGroups = [...byBasename.entries()]
  .filter(([, objs]) => objs.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log(`\nBasename collisions (same filename, different paths): ${duplicateBasenameGroups.length}`);

// Find padded vs unpadded number duplicates (image-01.jpg vs image-1.jpg)
const imageKeyPattern = /^(.*\/image-)0*(\d+)(\.[a-z0-9]+)$/i;
const normalizedKeys = new Map();

for (const obj of allObjects) {
  const match = obj.key.match(imageKeyPattern);
  if (match) {
    const normalized = `${match[1]}${Number.parseInt(match[2], 10)}${match[3]}`;
    if (!normalizedKeys.has(normalized)) normalizedKeys.set(normalized, []);
    normalizedKeys.get(normalized).push(obj);
  }
}

const paddedDuplicates = [...normalizedKeys.entries()]
  .filter(([, objs]) => objs.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log(`\nPadded/unpadded number duplicates (image-01 vs image-1): ${paddedDuplicates.length}`);

// Find same content under catalog slug AND UUID paths
// e.g. /assets/catalog/oando-seating--phoenix/image-1.jpg AND /assets/catalog/<uuid>/image-1.jpg
const catalogImagePattern = /^images\/catalog\/([^/]+)\/(image-\d+\.[a-z0-9]+)$/i;
const byCatalogImage = new Map();

for (const obj of allObjects) {
  const match = obj.key.match(catalogImagePattern);
  if (match) {
    const imageFile = match[2];
    if (!byCatalogImage.has(imageFile)) byCatalogImage.set(imageFile, []);
    byCatalogImage.get(imageFile).push({ ...obj, folder: match[1] });
  }
}

const catalogImageCollisions = [...byCatalogImage.entries()]
  .filter(([, objs]) => objs.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log(`\nCatalog image filename collisions (same image-N.ext in different catalog folders): ${catalogImageCollisions.length}`);

// Find likely duplicate folders: slug-based AND uuid-based for the same product
// e.g. oando-seating--phoenix AND <uuid> both containing image-1.jpg with same size
const slugFolders = new Map();
const uuidFolders = new Map();

for (const obj of allObjects) {
  const match = obj.key.match(catalogImagePattern);
  if (match) {
    const folder = match[1];
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(folder);
    if (isUuid) {
      if (!uuidFolders.has(folder)) uuidFolders.set(folder, []);
      uuidFolders.get(folder).push(obj);
    } else {
      if (!slugFolders.has(folder)) slugFolders.set(folder, []);
      slugFolders.get(folder).push(obj);
    }
  }
}

console.log(`\nCatalog folders: ${slugFolders.size} slug-based, ${uuidFolders.size} UUID-based`);

// Build full report
const report = {
  scannedAt: new Date().toISOString(),
  bucket,
  totalObjects: allObjects.length,
  basenameCollisions: duplicateBasenameGroups.length,
  paddedUnpaddedDuplicates: paddedDuplicates.length,
  catalogImageCollisions: catalogImageCollisions.length,
  slugFolders: slugFolders.size,
  uuidFolders: uuidFolders.size,
  // Detailed duplicate groups
  paddedDuplicateGroups: paddedDuplicates.map(([normalized, objs]) => ({
    normalized,
    keys: objs.map((o) => o.key),
  })),
  catalogCollisionSamples: catalogImageCollisions.slice(0, 20).map(([imageFile, objs]) => ({
    imageFile,
    folders: objs.map((o) => o.folder),
    sizes: objs.map((o) => o.size),
  })),
  // UUID folders that might be duplicates of slug folders
  uuidFolderDetails: [...uuidFolders.entries()].map(([folder, objs]) => ({
    folder,
    imageCount: objs.length,
    images: objs.map((o) => ({ key: o.key, size: o.size })),
  })),
  slugFolderDetails: [...slugFolders.entries()].map(([folder, objs]) => ({
    folder,
    imageCount: objs.length,
    images: objs.map((o) => ({ key: o.key, size: o.size })),
  })),
};

const outDir = path.join(root, "results", "audits");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "r2-duplicates.json");
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`\nReport saved to ${outPath}`);

// Print summary of what to delete
console.log("\n=== DUPLICATE SUMMARY ===");

if (paddedDuplicates.length > 0) {
  console.log("\nPadded/unpadded duplicates (keep one, delete the other):");
  for (const [normalized, objs] of paddedDuplicates) {
    console.log(`  ${normalized}:`);
    for (const obj of objs) {
      console.log(`    ${obj.key} (${obj.size} bytes)`);
    }
  }
}

if (catalogImageCollisions.length > 0) {
  console.log("\nCatalog image collisions (same filename in different folders):");
  for (const [imageFile, objs] of catalogImageCollisions.slice(0, 30)) {
    console.log(`  ${imageFile}:`);
    for (const obj of objs) {
      console.log(`    ${obj.folder}/  (${obj.size} bytes)`);
    }
  }
  if (catalogImageCollisions.length > 30) {
    console.log(`  ... and ${catalogImageCollisions.length - 30} more`);
  }
}

// Count total potential deletions
const paddedDeletionCount = paddedDuplicates.reduce((sum, [, objs]) => objs.length - 1, 0);
console.log(`\nPotential deletions from padded/unpadded: ${paddedDeletionCount}`);
