import { createRequire } from "node:module";
import postgres from "postgres";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();

async function checkFkIndexes(url, label) {
  const sql = postgres(url, { prepare: false, max: 1 });
  const rows = await sql`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name
  `;

  const indexes = await sql`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `;

  console.log(`\n=== ${label} FKs without covering index ===`);
  for (const fk of rows) {
    const idx = indexes.filter(
      (i) =>
        i.tablename === fk.table_name &&
        (i.indexdef.includes(`(${fk.column_name})`) ||
         i.indexdef.includes(`(${fk.column_name},`))
    );
    if (idx.length === 0) {
      console.log(`  ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name} (${fk.constraint_name})`);
    }
  }
  await sql.end({ timeout: 5 });
}

await checkFkIndexes(process.env.PRODUCTS_DATABASE_URL, "Products");
await checkFkIndexes(process.env.SUPABASE_AUTH_DATABASE_URL, "Admin");
