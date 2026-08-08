/**
 * Export catalog_products → JSON on R2 for degraded-mode reads when Supabase is down.
 *
 * Usage:
 *   pnpm --filter oando-site run catalog:snapshot:r2
 */
import { createRequire } from "node:module";
import { asc } from "drizzle-orm";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createPostgresDrizzle } from "../site/platform/drizzle/createPostgresDrizzle";
import { resolveProductsDatabaseUrl } from "../site/platform/drizzle/databaseUrls";
import { catalogProducts } from "../site/platform/drizzle/schema/catalog";
import { normalizeProducts } from "../site/lib/catalog/adapters";
import { CATALOG_SNAPSHOT_R2_KEY } from "../site/lib/catalog/catalogSnapshotConstants";
import { normalizeUuid } from "../site/lib/uuid/normalizeUuid";
import {
  contentTypeForKey,
  createR2CatalogClient,
  resolveCatalogBucketName,
} from "../site/lib/storage/r2Catalog";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();

function timestamp(): string {
  return new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
}

async function main() {
  const url = resolveProductsDatabaseUrl();
  if (!url) {
    throw new Error("Missing PRODUCTS_DATABASE_URL");
  }

  const db = createPostgresDrizzle(url);
  const rows = await db.select().from(catalogProducts).orderBy(asc(catalogProducts.name));

  const rawProducts = rows.map((row) => ({
    ...(row as Record<string, unknown>),
    "3d_model": row.model_3d ?? undefined,
  })) as import("../lib/catalog/types").Product[];

  const products = normalizeProducts(rawProducts);
  const uuidRows = products.filter((product) => normalizeUuid(product.id)).length;

  console.log(
    `catalog_products rows=${rows.length} exported=${products.length} uuid_ids=${uuidRows}`,
  );

  const categoryIds = [
    ...new Set(
      products
        .map((product) => String((product as { category_id?: string }).category_id ?? "").trim())
        .filter(Boolean),
    ),
  ].sort();

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    products,
    categoryIds,
  };

  const body = JSON.stringify(payload);
  const client = createR2CatalogClient();
  const bucket = resolveCatalogBucketName();
  const datedKey = `backups/catalog/catalog-${timestamp()}.json`;

  for (const key of [CATALOG_SNAPSHOT_R2_KEY, datedKey]) {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentTypeForKey(key),
      }),
    );
    console.log(`Uploaded s3://${bucket}/${key} (${products.length} products)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
