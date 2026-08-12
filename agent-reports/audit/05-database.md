# 05 — Database Deep Audit

## Overview
- **Track:** Database (two Supabase projects, migrations, RLS, types, mode-aware persistence).
- **Scope:** Products DB (`erpweaiypimorcunaimz`) + Admin/Planner DB (`rxzpznmxbaoxpikowmfc`); migrations under `site/platform/supabase/migrations*/`; RLS grant+policy pairs; generated types; exclusive-mode persistence wrappers; legacy `site/data/storage/`.
- **Date:** 2026-08-12.
- **Authority:** `AGENTS.md` §4–§7, `docs/database/schema.md`, `OPERATIONS_RUNBOOK.md`, `Agents/06-architecture.md`. Audit only — no source/migration/type/baseline edits.

## Method
Fresh commands from repo root `E:\oo08082026` (pnpm only; never inside `site/`):

1. `pnpm run check:governance` → `results/audit/database/governance.txt` (P4 migration-rollback ratchet vs baseline 42).
2. `pnpm run check:launch` → `results/audit/database/launch.txt` (validate-launch-env + scan_secrets + `db_test_connection`).
3. Glob/grep of `site/platform/supabase/migrations/` (Products) and `migrations.admin/` (Admin) for `-- rollback|down`, `create policy`, `grant … on`.
4. Read mode-aware wrappers + stores: `site/lib/Planner/plannerPersistenceMode.ts`, `site/lib/catalog/furnitureCatalogMode.ts`, `site/lib/Planner/projectsStore.ts`, `site/server/Planner/plannerStore.ts`, `site/server/Studio/studioStore.ts`, `site/lib/auth/devAuthBypass.ts`.
5. Grep `site/app/api` + `site/server` for `node:fs` raw writes and for direct calls to raw disk helpers (`writeFurniture(`, `writeCatalogItem(`, `writeProject(`, `persistFurnitureFiles(`, `listCatalogFromDisk(`, `listFurnitureFromDisk(`) = bypass search.
6. Grep `site/` for `site/data/storage` references (expect 0).
7. Read type blocks in `site/platform/types/database.admin.types.ts` (`profiles`, `oando_plans`) and `tests/unit/platform/serviceRoleOnlyTables.db.test.ts` for the service-role-only pin set.
8. Read `site/features/site/contact/createCustomerQuery.ts` (customer_queries insert path) + `site/app/api/customer-queries/route.ts` + migration `20260302170000_create_customer_queries.sql` (RLS/grant).

Files inspected (with line refs): `scripts/db_apply_migrations.ts:37` (`FIRST_MANAGED_MIGRATION="20260524"`), `scripts/db_gen_admin_types.ts` (introspects `information_schema` → `site/platform/types/database.admin.types.ts`), `docs/database/schema.md`, `docs/governance/rules.md` §7 (ratchet), `OPERATIONS_RUNBOOK.md` §0–§4.

## Findings

### 1. [PASS] Migration-rollback ratchet holds at baseline 42
`check:governance` exit 0: `P2_csp_unsafe_inline=2 P4_migration_no_rollback=42 (all at or below baseline)` — `results/audit/database/governance.txt:8`. Grep confirms: of 54 migration files on disk (39 Products + 15 Admin), 12 contain a `-- rollback`/`-- down` section (5 Products + 7 Admin) and 42 do not — exactly the ratcheted baseline. No new rollback-less migration was introduced. (Note: the audit-program brief estimated “40 Products + 16 Admin”; actual on-disk counts are 39 + 15 = 54; the 42-without-rollback baseline still holds.)

### 2. [PASS] Dual-database connection + launch env verified
`check:launch` exit 0 — `results/audit/database/launch.txt`: `✅ Products: connection established.` (`catalog_products=157`), `✅ Planner/Auth: connection established.`, `oando_plans reachable (2 rows)`, Supabase HTTP + Admin HTTP env present, `workstationOk: true`, no likely secrets. Both DB URLs resolve to distinct projects; the Products probe lists `catalog_categories, catalog_products, configurator_products, planner_managed_products, svg_revision_artifacts, svg_revisions` (the `furniture_catalog`/`block_descriptors` rows are correctly absent from the Products probe — migrated to Admin 2026-08-06).

### 3. [PASS] Mode-aware persistence wrappers are exclusive (no dual-write), and route handlers use them — no raw-disk bypasses
- Selectors are exclusive: `plannerPersistenceMode.ts:16` (`isDevAuthBypassEnabled(env)?"disk":"supabase"`) and `furnitureCatalogMode.ts:25` (mirror). `devAuthBypass.ts:54` hard-returns `false` when `NODE_ENV==="production"`.
- Stores gate every disk write behind the mode check: `plannerStore.ts:216` (`listCatalog`), `:233` (`writeCatalogEntry`), `:249` (`persistCatalogUpload`); `studioStore.ts` `listFurnitureCatalog`, `writeFurnitureItem`, `persistFurnitureAssets`, `persistFurnitureUpload`; `projectsStore.ts:181` (`writeProjectRecord` → `writeProject` only in the `disk` branch, else `writeProjectToSupabase`) with an ownership guard (`projectsStore.ts` `ownsProject` + `FORBIDDEN: plan ownership mismatch`).
- **Bypass search returned 0 matches:** grepping `site/app/api` for direct calls to the raw disk helpers (`writeFurniture(`, `writeCatalogItem(`, `writeProject(`, `persistFurnitureFiles(`, `listCatalogFromDisk(`, `listFurnitureFromDisk(`) found nothing. Route handlers import the wrappers: `api/Planner/catalog/route.ts:18` (`listCatalog`), `api/Planner/catalog/upload/route.ts:69` (`writeCatalogEntry`), `api/Studio/furniture/route.ts:25,81,104`, `api/Studio/furniture/upload/route.ts:37,61`, `api/Studio/furniture/[id]/route.ts:73,91`, `api/Planner/projects/route.ts:38` + `[id]/route.ts:37,95,116,152` (`getPlannerPersistenceMode`).

### 4. [PASS] Legacy `site/data/storage/` has zero code references
Grep for `site/data/storage` across `site/` → no files found. Matches `Agents/06-architecture.md` (“legacy with zero code references”). Disk data lives under `site/platform/{shared,Studio,Planner}/data/` (dev only).

### 5. [PASS] `profiles` type has no `email`/`role` column — types are live-accurate
`database.admin.types.ts:747-766` `profiles` Row = `{ id, display_name, avatar_url, created_at }` only. No `email`, no `role`. Writing either would PGRST204 (the historical every-Planner-save break). `oando_plans` (`:334`) has `payload: Json` + FK `oando_plans_user_id_fkey → profiles.id` (`:370`), matching `docs/database/schema.md`. The admin types are regenerated by `db_gen_admin_types.ts` (information_schema introspection), so they track the live schema.

### 6. [P3] `customer_queries` has a public-insert POLICY but no anon GRANT — the policy is effectively dead
`20260302170000_create_customer_queries.sql:54-59` creates `customer_queries_insert_public … for insert to anon, authenticated with check (true)`, plus service-role select/update (`:61-72`). But grepping every Products migration for `grant … on public.customer_queries` returns **no matches**. Per `docs/database/schema.md` (“A policy alone is not enough: Supabase also needs the table grant”), an anon `insert` would fail with `permission denied for table`. It is not a live production bug because the actual insert path is service-role: `createCustomerQuery.ts:172` `createSupabaseAuthAdminClient()` → `.from("customer_queries").insert(...)` (`:173-175`) — the contact route (`api/customer-queries/route.ts`) delegates to it and never uses anon. Net effect: the documented “customer_queries: public insert” (`docs/database/schema.md` RLS section) is misleading; the policy is unreachable by anon. Either add `grant insert on public.customer_queries to anon, authenticated` to match the stated intent, or correct the doc. Evidence: `results/audit/database/governance.txt` + migration `20260302170000…sql:54-72`.

### 7. [P2] `POST /api/exports` writes to disk unconditionally — fails on read-only production FS
`api/exports/route.ts:35` calls `writeBytes(path.join(EXPORTS_DIR, exportId), raw)` → `exportsStore.ts:76` `await fs.writeFile(filePath, data)`, with `EXPORTS_DIR = site/platform/shared/data/exports/` (`exportsStore.ts:7-11`). There is **no mode check** (unlike the furniture/planner stores) and no Supabase/streaming alternative. Per `stack.md §5` / `AGENTS.md §5`, production is a read-only filesystem and “an `fs.writeFile` on a request path is a production bug, not a fallback.” The export feature (POST /api/exports → GET /api/files/exports/[filename]) will fail in production. The reader `GET /api/files/exports/[filename]` is disk-only too. Severity P2: feature-level break, no data-loss/security exposure. Note: this is the catalog-assets/exports path, distinct from the three governed persistence stores.

### 8. [P3] `serviceRoleOnlyTables.db.test.ts` pin set drift vs `docs/database/schema.md`
The DB test (`tests/unit/platform/serviceRoleOnlyTables.db.test.ts:24-37`) pins Products service-role-only = `[block_descriptors, block_themes, svg_revision_artifacts, svg_revisions]` (4) and Admin = 6 (`_local_migration_history, block_descriptors, product_studio_template_audit, product_studio_templates, workspace_editor_config_audit, workspace_editor_configs`). `docs/database/schema.md` lists Products service-role-only as only `block_themes, svg_revisions, svg_revision_artifacts` (3) — it omits `block_descriptors` from the Products set. Minor doc/test drift; the test is the stricter source. (The test skips silently without `SUPABASE_AUTH_DATABASE_URL`/`PRODUCTS_DATABASE_URL`, so a green local run is not proof — see `Testing-handbook.md`.)

### 9. [P3] 13 Products migrations add a `create policy` with no same-file `grant` — resolved by catch-all grant migrations, not a live bug
16 Products files contain `create policy`; only 5 contain a `grant … on`. The 13 policy-without-same-file-grant files are mostly pre-batch (`20240101*`, `20250522*`, `20260101*`, `2026022*`, `2026030*`) plus four managed ones (`20260524233841_secure_local_migration_history`, `20260601120000_create_configurator_products`, `20260628100000_create_planner_managed_products_and_feature_flags`, `20260731120000_feature_flags_admin_modules_seed`). Grants land via catch-all migrations instead: `20260307153500_rename_to_catalog_tables.sql:255` and `20260313100000_fix_rls_and_permissions.sql:20` run `grant select … to anon, authenticated` for the catalog tables; `20260806120000_feature_flags_grants.sql:5-6` grants `feature_flags`; `20260801130000_create_furniture_catalog.sql:52-53` grants `furniture_catalog`. So no API-exposed catalog table is left without a grant, but the per-file policy-without-grant pattern is fragile (a future table could be missed) and is exactly why the Supabase grants+policies rule exists. No current missing grant on an API-exposed table was found.

### 10. [PASS] RLS on the spot-checked API-exposed tables is sound
- `customer_queries`: RLS on (`:52`); insert public / select+update service-role. (Grant caveat in Finding 6.)
- `oando_plans`: live + reachable (launch probe, 2 rows); writes go through the service-role admin client via `projectsStore.supabase.ts`; ownership enforced in the disk path and by `user_id` scoping in the Supabase path.
- `furniture_catalog` / `block_descriptors` (Admin): `20260805180000_studio_furniture_to_admin.sql:40-41` grants `furniture_catalog` select(anon/auth)+all(service); `:82` grants `block_descriptors` all(service) only — service-role-only by design, pinned by the DB test. Catalog reads/writes go through `furnitureCatalogStore.supabase.ts`, not raw disk, in Supabase mode.

## Deferred
- Live-DB RLS probes for the service-role-only sets require `SUPABASE_AUTH_DATABASE_URL`/`PRODUCTS_DATABASE_URL` in the test env; those suites skip silently without them (`serviceRoleOnlyTables.db.test.ts` `describe.runIf`). Not re-run here — the pin set is documented, not freshly asserted against a live DB.
- A fresh `db:apply --dry` plan output was not captured (would need to run `pnpm run ops db:apply -- --dry`); the `_local_migration_history` gap check is deferred. Launch probe confirmed applied state (`oando_plans` reachable).
- Drizzle-vs-SQL drift (`db:sync-drizzle`) not run.

## Changed files
None (audit only).

## Blockers (proposed `Failures.md` rows — not applied)

| id | priority | blocker | evidence | owner action |
|----|----------|---------|----------|--------------|
| DB-1 | P2 | `POST /api/exports` + `GET /api/files/exports/[filename]` write/read disk unconditionally; breaks on read-only prod FS | `site/app/api/exports/route.ts:35`, `site/app/api/_lib/exportsStore.ts:76`, `EXPORTS_DIR=site/platform/shared/data/exports` | Stream the export bytes back or move to Supabase Storage / `/tmp`; do not write under the app dir on a request path |
| DB-2 | P3 | `customer_queries` has an anon insert POLICY but no anon GRANT — policy is dead; doc claims “public insert” | `20260302170000_create_customer_queries.sql:54-59` (no grant found in any Products migration); `docs/database/schema.md` RLS section | Add `grant insert on public.customer_queries to anon, authenticated` OR correct the doc to “service-role insert” |
| DB-3 | P3 | `docs/database/schema.md` omits `block_descriptors` from the Products service-role-only set vs the DB test pin (4 vs 3) | `tests/unit/platform/serviceRoleOnlyTables.db.test.ts:30-36` vs `docs/database/schema.md` | Add `block_descriptors` to the docs Products list |
