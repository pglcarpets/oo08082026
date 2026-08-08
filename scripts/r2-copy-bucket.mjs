import {
  S3Client,
  ListObjectsV2Command,
  CopyObjectCommand,
  CreateBucketCommand,
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
  const accessKeyId =
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim() ||
    process.env.CLOUDFLARE_ACCESS_KEY_ID?.trim();
  const secretAccessKey =
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim() ||
    process.env.CLOUDFLARE_SECRET_ACCESS_KEY?.trim();
  if (!accessKeyId || !secretAccessKey) throw new Error("no creds");
  return { accessKeyId, secretAccessKey };
}

const client = new S3Client({
  region: "auto",
  endpoint: endpoint(),
  credentials: creds(),
  forcePathStyle: true,
});

const src = process.argv[2]?.trim();
const dest = process.argv[3]?.trim();
if (!src || !dest) {
  throw new Error("Usage: node scripts/r2-copy-bucket.mjs <source-bucket> <dest-bucket>");
}

try {
  await client.send(new HeadBucketCommand({ Bucket: dest }));
  console.log(`dest bucket exists: ${dest}`);
} catch {
  await client.send(new CreateBucketCommand({ Bucket: dest }));
  console.log(`created dest bucket: ${dest}`);
}

let token;
let copied = 0;
let failed = 0;
do {
  const out = await client.send(
    new ListObjectsV2Command({ Bucket: src, ContinuationToken: token, MaxKeys: 200 }),
  );
  for (const item of out.Contents ?? []) {
    const key = item.Key;
    if (!key) continue;
    try {
      await client.send(
        new CopyObjectCommand({
          Bucket: dest,
          Key: key,
          CopySource: encodeURI(`${src}/${key}`),
        }),
      );
      copied++;
      if (copied % 100 === 0) console.log(`copied ${copied}`);
    } catch (e) {
      failed++;
      if (failed <= 5) console.error(`copy fail ${key}: ${e.message}`);
    }
  }
  token = out.IsTruncated ? out.NextContinuationToken : undefined;
} while (token);

console.log(JSON.stringify({ src, dest, copied, failed }));
