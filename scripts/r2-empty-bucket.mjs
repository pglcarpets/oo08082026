import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
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
const client = new S3Client({ region: "auto", endpoint: endpoint(), credentials: creds(), forcePathStyle: true });
const bucket = process.env.R2_NEW_BUCKET || "oando-assets-clean-20260805";

async function main() {
  let token, total = 0;
  do {
    const out = await client.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token, MaxKeys: 1000 }));
    const objs = (out.Contents || []).filter((o) => o.Key).map((o) => ({ Key: o.Key }));
    if (objs.length) {
      await client.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objs, Quiet: true } }));
      total += objs.length;
      console.log("deleted batch", objs.length, "total", total);
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  console.log("EMPTY_DONE", bucket, total);
}
main().catch((e) => { console.error(e); process.exit(1); });
