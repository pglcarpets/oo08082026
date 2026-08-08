import { createWriteStream, createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

function endpoint() {
  const e = process.env.CLOUDFLARE_S3_URL?.trim() || process.env.CLOULDFLARE_S3_URL?.trim();
  if (e) return e;
  const id = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  if (!id) throw new Error("no R2 endpoint");
  return `https://${id}.r2.cloudflarestorage.com`;
}
function creds() {
  const accessKeyId =
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim() ||
    process.env.CLOUDFLARE_ACCESS_KEY_ID?.trim();
  const secretAccessKey =
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim() ||
    process.env.CLOUDFLARE_SECRET_ACCESS_KEY?.trim();
  if (!accessKeyId || !secretAccessKey) throw new Error("no R2 creds");
  return { accessKeyId, secretAccessKey };
}
const client = new S3Client({
  region: "auto",
  endpoint: endpoint(),
  credentials: creds(),
  forcePathStyle: true,
});

async function listAll(bucket) {
  const keys = [];
  let token;
  do {
    const out = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token, MaxKeys: 1000 }),
    );
    for (const o of out.Contents || []) if (o.Key && !o.Key.endsWith("/")) keys.push(o.Key);
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function downloadBucket(bucket, destRoot) {
  const keys = await listAll(bucket);
  let ok = 0, fail = 0;
  for (const key of keys) {
    try {
      const out = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const filePath = path.join(destRoot, key);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await pipeline(out.Body, createWriteStream(filePath));
      ok++;
      if (ok % 100 === 0) console.log(`download ${ok}/${keys.length}`);
    } catch (e) {
      fail++;
      console.error("DL_FAIL", key, e.message || e);
    }
  }
  return { total: keys.length, ok, fail };
}

function contentType(file) {
  const e = path.extname(file).toLowerCase();
  if (e === ".webp") return "image/webp";
  if (e === ".jpg" || e === ".jpeg") return "image/jpeg";
  if (e === ".png") return "image/png";
  if (e === ".svg") return "image/svg+xml";
  if (e === ".json") return "application/json";
  if (e === ".glb") return "model/gltf-binary";
  return "application/octet-stream";
}

async function walk(dir, base = dir, acc = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) await walk(full, base, acc);
    else acc.push(full);
  }
  return acc;
}

async function uploadDir(localRoot, bucket, keyPrefix = "") {
  const files = await walk(localRoot);
  let ok = 0, fail = 0;
  for (const file of files) {
    const rel = path.relative(localRoot, file).split(path.sep).join("/");
    const key = keyPrefix ? `${keyPrefix.replace(/\/$/, "")}/${rel}` : rel;
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: createReadStream(file),
          ContentType: contentType(file),
        }),
      );
      ok++;
      if (ok % 100 === 0) console.log(`upload ${ok}/${files.length}`);
    } catch (e) {
      fail++;
      console.error("UP_FAIL", key, e.message || e);
    }
  }
  return { total: files.length, ok, fail };
}

const mode = process.argv[2] || "all";
const OLD = process.env.R2_OLD_BUCKET || "oando-asset-cdn";
const NEW = process.env.R2_NEW_BUCKET || "oando-assets-clean-20260805";
const BACKUP = process.env.R2_BACKUP_DIR || "E:/Websites/OandO-backups/r2-oando-asset-cdn-20260805";
const ASSETS = path.resolve("site/public/assets");

async function main() {
  console.log({ mode, OLD, NEW, BACKUP, ASSETS });
  await client.send(new HeadBucketCommand({ Bucket: NEW })).catch(async () => {
    console.log("new bucket head failed (may still upload)");
  });
  const report = { old: OLD, new: NEW, backup: BACKUP };
  if (mode === "download" || mode === "all") {
    report.download = await downloadBucket(OLD, BACKUP);
    console.log("DOWNLOAD", report.download);
  }
  if (mode === "upload" || mode === "all") {
    // keys: marketing/..., catalog/...
    report.upload = await uploadDir(ASSETS, NEW, "");
    console.log("UPLOAD", report.upload);
  }
  const out = path.resolve("results/asset-cutover/r2-sync-report.json");
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, JSON.stringify(report, null, 2));
  console.log("WROTE", out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
