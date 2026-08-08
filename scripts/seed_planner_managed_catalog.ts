/**
 * Upsert a curated admin-managed catalog into planner_managed_products.
 * Idempotent on slug. Requires db:apply (table already live on products Supabase).
 *
 * Usage: npx tsx scripts/seed_planner_managed_catalog.ts [--verify-only]
 */
import { createRequire } from "node:module";
import postgres from "postgres";

import { MANAGED_CATALOG_SEED } from "../site/lib/catalog/managedCatalogSeed";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();

async function main() {
  const verifyOnly = process.argv.includes("--verify-only");
  const url = process.env.PRODUCTS_DATABASE_URL?.trim();
  if (!url) {
    console.error("Missing PRODUCTS_DATABASE_URL in .env.local");
    process.exit(1);
  }

  const sql = postgres(url, { prepare: false, max: 1 });

  try {
    if (!verifyOnly) {
      for (const row of MANAGED_CATALOG_SEED) {
        await sql`
          insert into public.planner_managed_products (
            slug,
            planner_source_slug,
            name,
            description,
            category,
            category_id,
            category_name,
            series_id,
            series_name,
            price,
            flagship_image,
            images,
            specs,
            metadata,
            active
          ) values (
            ${row.slug},
            ${row.planner_source_slug},
            ${row.name},
            ${row.description},
            ${row.category},
            ${row.category_id},
            ${row.category_name},
            ${row.series_id},
            ${row.series_name},
            ${row.price},
            ${row.flagship_image},
            ${sql.array(row.images)},
            ${sql.json(row.specs)},
            ${sql.json({ seed: "seed_planner_managed_catalog.ts" })},
            true
          )
          on conflict (slug) do update set
            planner_source_slug = excluded.planner_source_slug,
            name = excluded.name,
            description = excluded.description,
            category = excluded.category,
            category_id = excluded.category_id,
            category_name = excluded.category_name,
            series_id = excluded.series_id,
            series_name = excluded.series_name,
            price = excluded.price,
            flagship_image = excluded.flagship_image,
            images = excluded.images,
            specs = excluded.specs,
            metadata = excluded.metadata,
            active = true,
            updated_at = now();
        `;
      }
      console.log(`Upserted ${MANAGED_CATALOG_SEED.length} planner_managed_products rows.`);
    }

    const summary = await sql<Array<{ category: string; n: number }>>`
      select category, count(*)::int as n
      from public.planner_managed_products
      where active = true
      group by category
      order by category;
    `;
    console.log("\nplanner_managed_products (active):");
    for (const row of summary) console.log(`  ${row.category}: ${row.n}`);
    const total = summary.reduce((sum, row) => sum + row.n, 0);
    console.log(`  total: ${total}`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
