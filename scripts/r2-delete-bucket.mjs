import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  DeleteBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

function endpoint() {
  const e = process.env.CLOUDFLARE_S3_URL?.trim();
  if (e) return e;
  const id = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  if (!id) throw new Error("no endpoint");
  return `https://${id}.r2.cloudflarestorage.com`;
}
function creds() {
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim() || process.env.CLOUDFLARE_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim() || process.env.CLOUDFLARE_SECRET_ACCESS_KEY?.trim();
  if (!accessKeyId || !secretAccessKey) throw new Error("no creds");
  return { accessKeyId, secretAccessKey };
}

const client = new S3Client({
  region: "auto",
  endpoint: endpoint(),
  credentials: creds(),
  forcePathStyle: true,
});

const bucketArg = process.argv[2]?.trim();
const bucketEnv =
  process.env.R2_NEW_BUCKET?.trim() ||
  process.env.CLOUDFLARE_R2_CATALOG_BUCKET?.trim() ||
  process.env.CLOUDFLARE_R2_BUCKET?.trim() ||
  "";
const bucket = bucketArg || bucketEnv;
if (!bucket) throw new Error("Missing R2 bucket: pass as argv or set R2_NEW_BUCKET / CLOUDFLARE_R2_CATALOG_BUCKET in .env.local");

async function emptyBucket() {
  let token, total = 0;
  do {
    const out = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token, MaxKeys: 1000 }),
    );
    const objs = (out.Contents || []).filter((o) => o.Key).map((o) => ({ Key: o.Key }));
    if (objs.length) {
      await client.send(
        new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objs, Quiet: true } }),
      );
      total += objs.length;
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return total;
}

async function main() {
  console.log("Deleting bucket", bucket);
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (e) {
    console.log("Bucket not found or inaccessible:", e.name || e.message);
    process.exit(0);
  }
  const n = await emptyBucket();
  console.log("Emptied objects:", n);
  await client.send(new DeleteBucketCommand({ Bucket: bucket }));
  console.log("DELETED_BUCKET", bucket);
}

main().catch((e) => {
  console.error("FAIL", e.message || e);
  process.exit(1);
});
