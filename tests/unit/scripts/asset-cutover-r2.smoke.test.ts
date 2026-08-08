/**
 * @vitest-environment node
 *
 * Phase 04 — clean R2 bucket smoke: head bucket, sample keys, decode bytes.
 * Skips when R2 creds or bucket are unavailable.
 */
import { describe, it, expect } from "vitest";
import {
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

const BUCKET =
  process.env.R2_NEW_BUCKET?.trim() ||
  process.env.CLOUDFLARE_R2_CATALOG_BUCKET?.trim() ||
  process.env.CLOUDFLARE_R2_BUCKET?.trim() ||
  "";

const hasR2 =
  Boolean(process.env.CLOUDFLARE_ACCOUNT_ID?.trim() || process.env.CLOUDFLARE_S3_URL?.trim()) &&
  Boolean(
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim() ||
      process.env.CLOUDFLARE_ACCESS_KEY_ID?.trim(),
  ) &&
  Boolean(
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim() ||
      process.env.CLOUDFLARE_SECRET_ACCESS_KEY?.trim(),
  );

function r2Client() {
  const endpoint =
    process.env.CLOUDFLARE_S3_URL?.trim() ||
    process.env.CLOULDFLARE_S3_URL?.trim() ||
    `https://${process.env.CLOUDFLARE_ACCOUNT_ID!.trim()}.r2.cloudflarestorage.com`;
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: (
        process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
        process.env.CLOUDFLARE_ACCESS_KEY_ID!
      ).trim(),
      secretAccessKey: (
        process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
        process.env.CLOUDFLARE_SECRET_ACCESS_KEY!
      ).trim(),
    },
    forcePathStyle: true,
  });
}

async function firstImageKey(client: S3Client, prefix: string) {
  const out = await client.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, MaxKeys: 40 }),
  );
  for (const obj of out.Contents || []) {
    if (!obj.Key || obj.Key.endsWith("/")) continue;
    if (/\.(webp|jpg|jpeg|png)$/i.test(obj.Key)) return obj.Key;
  }
  return null;
}

describe.runIf(hasR2 && Boolean(BUCKET))(`R2 clean bucket ${BUCKET || "(bucket not configured)"} (live)`, () => {
  it("heads bucket and decodes sample marketing + catalog keys", async () => {
    const client = r2Client();
    await expect(client.send(new HeadBucketCommand({ Bucket: BUCKET }))).resolves.toBeDefined();

    const keys = (
      await Promise.all([
        firstImageKey(client, "marketing/hero/slides/"),
        firstImageKey(client, "marketing/brand/logos/"),
        firstImageKey(client, "catalog/flagship/"),
        firstImageKey(client, "catalog/seating/"),
      ])
    ).filter((k): k is string => Boolean(k));

    expect(keys.length).toBeGreaterThan(0);

    for (const key of keys) {
      const head = await client.send(
        new HeadObjectCommand({ Bucket: BUCKET, Key: key }),
      );
      expect(head.ContentLength).toBeGreaterThan(0);

      const obj = await client.send(
        new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      );
      const chunks: Buffer[] = [];
      for await (const chunk of obj.Body as AsyncIterable<Uint8Array>) {
        chunks.push(Buffer.from(chunk));
      }
      const buf = Buffer.concat(chunks);
      const meta = await sharp(buf).metadata();
      expect(meta.width).toBeGreaterThan(0);
      expect(meta.height).toBeGreaterThan(0);
    }
  }, 60_000);
});
