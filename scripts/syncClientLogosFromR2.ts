/**
 * Pull client logos from Cloudflare R2 into site/public for same-origin serving.
 * R2 keys: images/client-logos/*  →  site/public/assets/marketing/client-logos/*
 */
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import {
  createR2CatalogClient,
  resolveCatalogBucketName,
} from "../site/lib/storage/r2Catalog.ts";

dotenv.config({ path: path.resolve(".env.local") });

const PUBLIC_DIR = path.resolve("site/public/assets/client-logos");
const PREFIX = "images/client-logos/";

async function main() {
  const client = createR2CatalogClient();
  const bucket = resolveCatalogBucketName();
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  let token;
  let synced = 0;
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: PREFIX,
        ContinuationToken: token,
        MaxKeys: 200,
      }),
    );

    for (const obj of res.Contents ?? []) {
      if (!obj.Key || obj.Key.endsWith("/")) continue;
      const filename = obj.Key.slice(PREFIX.length);
      const dest = path.join(PUBLIC_DIR, filename);
      const body = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: obj.Key }),
      );
      const bytes = Buffer.from(await body.Body!.transformToByteArray());
      fs.writeFileSync(dest, bytes);
      synced += 1;
      console.log(`synced ${filename} (${bytes.length} bytes)`);
    }

    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  console.log(`Done: ${synced} logos → ${PUBLIC_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
