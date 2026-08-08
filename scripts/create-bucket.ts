import { CreateBucketCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

import {
  createR2CatalogClient,
  resolveCatalogBucketName,
} from "./lib/r2Catalog";

dotenv.config({ path: ".env.local" });

async function createBucket() {
  const bucketName = resolveCatalogBucketName();

  console.log(`Attempting to create R2 bucket "${bucketName}"...`);

  let r2Client;
  try {
    r2Client = createR2CatalogClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    console.error("Required in .env.local:");
    console.error("  CLOUDFLARE_S3_URL  (or CLOUDFLARE_ACCOUNT_ID)");
    console.error("  CLOUDFLARE_R2_ACCESS_KEY_ID  (or CLOULD_ACCESS_KEY_ID)");
    console.error("  CLOUDFLARE_R2_SECRET_ACCESS_KEY  (or CLOULDFLARE_S3_SECRET_ACCESS_KEY)");
    process.exit(1);
  }

  try {
    await r2Client.send(new CreateBucketCommand({ Bucket: bucketName }));
    console.log(`SUCCESS: bucket "${bucketName}" is ready.`);
    console.log("Next: point oando-worker-proxy at this bucket for /images and /models.");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (/BucketAlreadyOwnedByYou|BucketAlreadyExists|already exists/i.test(message)) {
      console.log(`Bucket "${bucketName}" already exists — OK to use.`);
      return;
    }
    console.error("FAILED to create bucket.");
    console.error("If permissions failed, the key needs R2 Admin (bucket create), not object-only.");
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

createBucket();