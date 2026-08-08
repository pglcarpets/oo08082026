# Database schema

**Authority:** migrations + Drizzle under `site/platform/`. Code wins if this doc lags.  
**Verified live:** 2026-08-01, by introspecting both projects. The table lists below
are the actual `public` contents on that date, not an aspiration.

## Two databases

Genuinely separate Supabase projects — confirmed by pooler user, not by convention.

| DB | Project ref | Env | Migrations / Drizzle |
|----|-------------|-----|----------------------|
| **Products** | `erpweaiypimorcunaimz` | `PRODUCTS_DATABASE_URL` | `site/platform/supabase/migrations/` · `site/platform/drizzle/schema/catalog.ts` |
| **Admin / Planner** | `rxzpznmxbaoxpikowmfc` | `SUPABASE_AUTH_DATABASE_URL` | `site/platform/supabase/migrations.admin/` · `site/platform/drizzle/schema/planner.ts` |

`SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` both point at the **products**
project, so the `catalog-assets` storage bucket and the products DB are one
project — asset bytes and their metadata rows live together.

Clients: `@/platform/supabase/supabaseAdmin.ts` (products, service role),
`auth-admin.ts` (admin, service role), `server.ts` (request-scoped anon).

## Products DB — 19 tables

| Table | Role |
|-------|------|
| `catalog_products` · `catalog_categories` · `catalog_product_specs` · `catalog_product_images` · `catalog_product_slug_aliases` | Marketing catalog |
| `catalog_items` · `series` · `templates` | Reference series |
| `business_stats_current` · `business_stats_history` | Site stats |
| `configurator_products` | Parametric catalog (separate from marketing) |
| `planner_managed_products` | Admin-curated planner library |
| `furniture_catalog` | **Shared Studio/Planner furniture library** — moved to Admin DB (phase 05 cutover, 2026-08-06); listed here while the legacy Products copy exists |
| `block_descriptors` | Published descriptor release record + `lifecycle` |
| `block_themes` | Theme tokens |
| `svg_revisions` · `svg_revision_artifacts` | Legacy SVG revision schema — residual |
| `feature_flags` | Flag rows (mirrored in both DBs) |
| `_local_migration_history` | Local apply bookkeeping |

## Admin / Planner DB — 21 tables

| Table | Role |
|-------|------|
| `oando_plans` | **Live Planner documents** (`payload` jsonb); FK `user_id → profiles.id` |
| `profiles` | User row — `id`, `display_name`, `avatar_url`, `created_at` only |
| `planner_handoffs` | BOQ handoff records (customer contact + BOQ) |
| `planner_settings` | Planner preferences |
| `customer_queries` | Contact form / ops queue |
| `teams` · `team_members` · `invites` · `offices` | Team model |
| `price_books` · `price_book_versions` | Price books |
| `product_studio_templates` · `product_studio_template_audit` · `product_studio_drafts` | Admin product-studio store |
| `workspace_editor_configs` · `workspace_editor_config_audit` | Workspace editor store |
| `admin_modules` · `feature_flags` | Admin module registry / flags |
| `audit_events` · `user_history` | Audit |
| `_local_migration_history` | Local apply bookkeeping |

`profiles` has **no `email` and no `role` column.** Writing either returns
PGRST204 — this previously broke every production Planner save (pre-deploy B4 —
profile upsert fix; the old `docs/plan/6.md` write-up no longer exists).

### `archive` schema — 9 retired tables

Moved out of `public` by `20260801110000_archive_legacy_planner_tables.sql`. Data
preserved, foreign keys intact, invisible to PostgREST (which exposes `public` only).

`plans` (6 rows) · `templates` (4) · `users` (2) · `plan_versions` ·
`plan_shares` · `plan_comments` · `projects` · `clients` · `quotes`

They predate the `oando_plans` cutover and had zero readers in `site/` or
`scripts/`. **`archive.plans` is not the Planner store — `public.oando_plans` is.**

## RLS

Enabled on every table in both databases.

- Catalog + `furniture_catalog`: public `select`, writes service-role.
- `customer_queries`: public insert.
- `planner_handoffs`: `select` scoped to `created_by = auth.uid()`. Unowned rows
  (anonymous captures) are service-role only — staff read them through admin.
- **Service-role-only by design** (RLS on, zero policies), recorded as table
  comments and pinned by `tests/unit/platform/serviceRoleOnlyTables.db.test.ts`:
  - admin — `product_studio_templates`, `product_studio_template_audit`,
    `workspace_editor_configs`, `workspace_editor_config_audit`,
    `_local_migration_history`
  - products — `block_descriptors`, `block_themes`, `svg_revisions`,
    `svg_revision_artifacts`

A policy alone is not enough: Supabase also needs the table **grant**.
`grant select … to anon, authenticated` plus `grant all … to service_role`, or
reads fail with "permission denied for table" despite a matching policy.

## Commands

| Goal | Command |
|------|---------|
| Apply Products | `pnpm run ops db:apply` (`-- --dry` to plan first) |
| Apply Admin | `pnpm run ops db:apply:admin` |
| Seed furniture library | `pnpm run seed:furniture` |
| Regenerate admin types | `pnpm run ops db:types:admin` |
| Regenerate products types | `pnpm run ops db:types` (needs Supabase CLI) |
| Verify Admin Drizzle | `pnpm run ops db:sync-drizzle` |
| Advisors | `pnpm run ops db:advisors` / `:admin` |

`db:apply` selects every migration at or after `20260524` lexicographically and
records applied files in `_local_migration_history`. Pre-batch files (`001_*`,
`20240101*`, `20250522*`, `20260101*`) are deliberately excluded — they were
applied out of band.

Every migration needs a `-- rollback` section; `check:governance` ratchets
`P4_migration_no_rollback` against a baseline of **42**.

## Known drift

- `site/platform/drizzle/schema/planner.ts` declares `review_links` and `review_comments`.
  Neither exists in the live admin DB.
- `site/platform/types/database.types.ts` (products) is Supabase-CLI generated;
  `furniture_catalog` and `block_descriptors` were added by hand and will be
  reproduced on the next CLI run.
- `db:types:admin` writes `site/platform/types/database.admin.types.ts` — the path the
  app actually imports. It previously wrote `config/database/types/`, which
  nothing reads.

## Not this file

- Not proof migrations ran on a given environment
- Not a substitute for reading SQL under `site/platform/supabase/migrations*/`
- Drizzle-kit ledger (not `db:apply`): `site/platform/drizzle/migrations/meta/_journal.json`
