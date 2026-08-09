/**
 * One-shot: re-apply Admin feature_flags GRANTs (DB-S02).
 * Usage: node scripts/AsNeeded/reapply-feature-flags-grants.mjs
 */
import { createRequire } from "node:module";
import postgres from "postgres";

const require = createRequire(import.meta.url);
require("../general/loadEnvLocal.cjs").loadEnvLocal();

const url = process.env.SUPABASE_AUTH_DATABASE_URL?.trim();
if (!url) {
  console.error("Missing SUPABASE_AUTH_DATABASE_URL");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });
try {
  await sql.unsafe(`
    grant select on public.feature_flags to anon, authenticated;
    grant all on public.feature_flags to service_role;
  `);
  const rows = await sql`
    select grantee, privilege_type
    from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'feature_flags'
    order by grantee, privilege_type
  `;
  console.log(JSON.stringify(rows, null, 2));
  console.log("OK: feature_flags grants re-applied on Admin DB");
} finally {
  await sql.end({ timeout: 5 });
}
