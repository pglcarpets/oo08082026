import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env.local") });
dotenv.config({ path: path.join(root, "..", ".env.local") });

/** Intact S3 pair only — never mix R2_* access with ACCESS_* secret. */
function resolveIntactCredentials() {
  const pairs = [
    [
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      "cloudflare-r2",
    ],
    [
      process.env.CLOUDFLARE_ACCESS_KEY_ID,
      process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
      "cloudflare-access",
    ],
    [
      process.env.CLOULD_ACCESS_KEY_ID,
      process.env.CLOULDFLARE_S3_SECRET_ACCESS_KEY,
      "legacy-typo",
    ],
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
  process.argv[2] || process.env.CLOUDFLARE_R2_CATALOG_BUCKET || "oando-asset-cdn";

const endpoint =
  process.env.CLOUDFLARE_S3_URL?.trim() ||
  process.env.CLOULDFLARE_S3_URL?.trim() ||
  (process.env.CLOUDFLARE_ACCOUNT_ID
    ? `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : null);

const credentials = resolveIntactCredentials();
if (!endpoint || !credentials) {
  console.error(
    "Missing R2 endpoint or intact S3 pair (CLOUDFLARE_R2_ACCESS_KEY_ID + CLOUDFLARE_R2_SECRET_ACCESS_KEY).",
  );
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
  },
});

let token;
let total = 0;
const samples = [];

do {
  const out = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token, MaxKeys: 200 }),
  );
  total += out.KeyCount ?? 0;
  for (const item of out.Contents ?? []) {
    if (item.Key && samples.length < 8) samples.push(item.Key);
  }
  token = out.IsTruncated ? out.NextContinuationToken : undefined;
} while (token);

const report = {
  scannedAt: new Date().toISOString(),
  bucket,
  credentialSource: credentials.source,
  objectCount: total,
  sampleKeys: samples,
};

const outDir = path.join(root, "results", "audits");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "r2-object-count.json");
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`bucket=${bucket} objects=${total}`);
