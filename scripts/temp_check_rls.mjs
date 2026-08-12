import { createRequire } from "node:module";
import postgres from "postgres";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();

async function checkRls(url, label) {
  const sql = postgres(url, { prepare: false, max: 1 });
  const rows = await sql`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public' AND rowsecurity = true
    ORDER BY tablename
  `;
  const policies = await sql`
    SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `;

  console.log(`\n=== ${label} RLS tables without policies ===`);
  for (const t of rows) {
    const p = policies.filter((pol) => pol.tablename === t.tablename);
    if (p.length === 0) {
      console.log(`  ${t.tablename}`);
    }
  }
  await sql.end({ timeout: 5 });
}

await checkRls(process.env.PRODUCTS_DATABASE_URL, "Products");
await checkRls(process.env.SUPABASE_AUTH_DATABASE_URL, "Admin");
