/**
 * Apply the configurator_products migration (if pending) and upsert the typed
 * oando seed into it. Idempotent: re-running upserts by slug, no duplicates,
 * no deletes. (Plan D / D2)
 *
 * Usage: npx tsx scripts/seed_configurator_catalog.ts [--verify-only]
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { buildOandoSeedProducts } from "@/lib/catalog/seed/oandoCatalog";
import { productToRow } from "@/lib/catalog/configuratorCatalog";

config({ path: resolve(process.cwd(), ".env.local") });

const MIGRATION = "20260601120000_create_configurator_products.sql";

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
      // 1) Ensure the table exists (apply migration once, tracked in history).
      await sql`
        create table if not exists public._local_migration_history (
          filename text primary key,
          applied_at timestamptz not null default now()
        );
      `;
      const already = await sql<Array<{ filename: string }>>`
        select filename from public._local_migration_history where filename = ${MIGRATION};
      `;
      if (already.length === 0) {
        const body = readFileSync(resolve(process.cwd(), "supabase", "migrations", MIGRATION), "utf8");
        process.stdout.write(`Applying ${MIGRATION}... `);
        await sql.unsafe(body);
        await sql`insert into public._local_migration_history (filename) values (${MIGRATION});`;
        console.log("OK");
      } else {
        console.log(`Migration ${MIGRATION} already applied.`);
      }

      // 2) Upsert the seed (idempotent on slug).
      const rows = buildOandoSeedProducts().map(productToRow);
      for (const r of rows) {
        // direct sql template (no any); json() accepts serializable from row type; reason: matching sibling seed_planner script pattern; owner: Resolve Failures Agent (PLAN-FAIL-0411); removal: n/a once postgres lib types accepted at call (or explicit overload)
        await sql`
          insert into public.configurator_products
            (slug, name, category, family, brand_name, sizing_type, workstation,
             size_options, default_footprint, derived_rules, materials,
             thumbnail_url, model_3d_url, description, active)
          values
            (${r.slug}, ${r.name}, ${r.category}, ${r.family}, ${r.brand_name},
             ${r.sizing_type}, ${JSON.stringify(r.workstation)}, ${sql.json(r.size_options as unknown as Parameters<typeof sql.json>[0])},
             ${JSON.stringify(r.default_footprint)}, ${JSON.stringify(r.derived_rules)},
             ${JSON.stringify(r.materials)}, ${r.thumbnail_url}, ${r.model_3d_url}, ${r.description}, true)
          on conflict (slug) do update set
            name = excluded.name,
            category = excluded.category,
            family = excluded.family,
            brand_name = excluded.brand_name,
            sizing_type = excluded.sizing_type,
            workstation = excluded.workstation,
            size_options = excluded.size_options,
            default_footprint = excluded.default_footprint,
            derived_rules = excluded.derived_rules,
            materials = excluded.materials,
            description = excluded.description,
            active = true;
        `;
      }
      console.log(`Upserted ${rows.length} configurator products.`);
    }

    // 3) Verify read-back.
    const summary = await sql<Array<{ category: string; sizing_type: string; n: number }>>`
      select category, sizing_type, count(*)::int as n
      from public.configurator_products
      group by category, sizing_type
      order by category, sizing_type;
    `;
    console.log("\nconfigurator_products contents:");
    for (const s of summary) console.log(`  ${s.category} / ${s.sizing_type}: ${s.n}`);
    const total = summary.reduce((a, s) => a + s.n, 0);
    console.log(`  total: ${total}`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
