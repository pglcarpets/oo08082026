import {
  DeleteBucketCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";

import { createR2CatalogClient } from "./lib/r2Catalog";

dotenv.config({ path: ".env.local" });

export const PROTECTED_BUCKET = "oando-asset-cdn";

export function isProtectedBucket(bucket: string): boolean {
  return bucket === PROTECTED_BUCKET;
}

export async function emptyBucket(
  client: ReturnType<typeof createR2CatalogClient>,
  bucket: string,
): Promise<number> {
  let removed = 0;
  let token: string | undefined;

  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: token,
        MaxKeys: 1000,
      }),
    );

    const keys = (listed.Contents ?? [])
      .map((item) => item.Key)
      .filter((key): key is string => Boolean(key));

    if (keys.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: keys.map((Key) => ({ Key })),
            Quiet: true,
          },
        }),
      );
      removed += keys.length;
      console.log(`removed ${removed} objects from ${bucket}...`);
    }

    token = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (token);

  return removed;
}

export async function deleteBucket(
  bucket: string,
  deps: {
    createClient?: typeof createR2CatalogClient;
    empty?: typeof emptyBucket;
    log?: typeof console.log;
  } = {},
): Promise<number> {
  const createClient = deps.createClient ?? createR2CatalogClient;
  const empty = deps.empty ?? emptyBucket;
  const log = deps.log ?? console.log;

  const client = createClient();
  const removed = await empty(client, bucket);
  await client.send(new DeleteBucketCommand({ Bucket: bucket }));
  log(`deleted bucket "${bucket}" (objects removed: ${removed})`);
  return removed;
}

export function parseBuckets(argv: string[] = process.argv): string[] {
  return argv.slice(2).filter((arg) => !arg.startsWith("-"));
}

export async function main(
  argv: string[] = process.argv,
  deps: {
    deleteOne?: typeof deleteBucket;
    error?: typeof console.error;
    exit?: (code: number) => void;
  } = {},
): Promise<void> {
  const deleteOne = deps.deleteOne ?? deleteBucket;
  const error = deps.error ?? console.error;
  const exit = deps.exit ?? ((code: number) => process.exit(code));

  const buckets = parseBuckets(argv);

  if (buckets.length === 0) {
    error("Usage: npx tsx scripts/deleteR2Bucket.ts <bucket> [bucket...]");
    exit(1);
    return;
  }

  for (const bucket of buckets) {
    if (isProtectedBucket(bucket)) {
      error(`Refusing to delete protected bucket "${PROTECTED_BUCKET}".`);
      exit(1);
      return;
    }
    await deleteOne(bucket);
  }
}

function isMain(): boolean {
  const entry = (process.argv[1] ?? "").replace(/\\/g, "/");
  return entry.endsWith("deleteR2Bucket.ts") || entry.endsWith("deleteR2Bucket.js");
}

if (isMain()) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
