/**
 * @vitest-environment node
 *
 * Pins which tables are reachable only by `service_role`.
 *
 * "RLS enabled, zero policies" is deliberate for catalog-publish internals and
 * admin-only stores, but it is indistinguishable from a table whose policies
 * were forgotten. Both directions are failures worth catching:
 *
 *   - a policy appears on a pinned table  → data opens to anon/authenticated
 *   - a *new* table has RLS on, 0 policies → probably an oversight, not a design
 *
 * The intent is also recorded in the database itself; see
 * `migrations{,.admin}/20260801120000_document_service_role_only_tables.sql`.
 *
 * Skips when the corresponding connection URL is absent.
 */
import { describe, it, expect } from "vitest";

const ADMIN_URL = process.env.SUPABASE_AUTH_DATABASE_URL?.trim() ?? "";
const PRODUCTS_URL = process.env.PRODUCTS_DATABASE_URL?.trim() ?? "";

const ADMIN_SERVICE_ROLE_ONLY = [
  "_local_migration_history",
  "block_descriptors",
  "product_studio_template_audit",
  "product_studio_templates",
  "workspace_editor_config_audit",
  "workspace_editor_configs",
];

// No `_local_migration_history` here — the products copy carries a policy,
// unlike the admin one.
const PRODUCTS_SERVICE_ROLE_ONLY = [
  "block_descriptors",
  "block_themes",
  "svg_revision_artifacts",
  "svg_revisions",
];

async function unpolicedTables(url: string): Promise<string[]> {
  const postgres = (await import("postgres")).default;
  const sql = postgres(url, { prepare: false, ssl: "require", max: 1 });
  try {
    const rows = await sql<Array<{ table: string }>>`
      select c.relname as table
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      left join pg_policy p on p.polrelid = c.oid
      where n.nspname = 'public'
        and c.relkind = 'r'
        and c.relrowsecurity
      group by c.relname
      having count(p.polname) = 0
      order by c.relname
    `;
    return rows.map((r) => r.table);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

describe.runIf(ADMIN_URL)("admin DB — service-role-only tables", () => {
  it("matches the pinned set exactly", async () => {
    expect(await unpolicedTables(ADMIN_URL)).toEqual(ADMIN_SERVICE_ROLE_ONLY);
  }, 30_000);
});

describe.runIf(PRODUCTS_URL)("products DB — service-role-only tables", () => {
  it("matches the pinned set exactly", async () => {
    expect(await unpolicedTables(PRODUCTS_URL)).toEqual(PRODUCTS_SERVICE_ROLE_ONLY);
  }, 30_000);
});
