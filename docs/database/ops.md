# Database ops

Code + migrations under `site/platform/` win when this lags. Schema: [`schema.md`](./schema.md). Deploy: [`../../OPERATIONS_RUNBOOK.md`](../../OPERATIONS_RUNBOOK.md).

## Two projects

| Role | Ref | Owns | Env |
|------|-----|------|-----|
| **Products** | `erpweaiypimorcunaimz` | Marketing catalog, configurator, themes, flags | `PRODUCTS_DATABASE_URL` |
| **Admin** | `rxzpznmxbaoxpikowmfc` | Plans, staff data, furniture, descriptors | `SUPABASE_AUTH_DATABASE_URL` |

Staff/customer + furniture → **Admin**. Marketing catalog tables → **Products**.

## Persistence modes

Disk only when `DEV_AUTH_BYPASS=1` (non-prod). Prod FS is read-only. Never dual-write.

| Data | Supabase (prod) | Disk (dev) |
|------|-----------------|------------|
| Planner projects | `oando_plans` (admin) | `site/platform/Planner/data/projects/` |
| Furniture library | `furniture_catalog` + `catalog-assets` (admin) | `site/platform/shared/data/furniture/` |
| Descriptors | `block_descriptors` (admin) | `site/inventory/descriptors/` |

Selectors: `site/lib/Planner/plannerPersistenceMode.ts`, `site/lib/catalog/furnitureCatalogMode.ts`.

## Advisors

```powershell
pnpm run ops db:advisors
pnpm run ops db:advisors:security
pnpm run ops db:advisors:performance
pnpm run ops db:advisors:admin
```

Ship bar: **0 SECURITY ERRORs** on Products and Admin (`scripts/db_advisors.ts`).

## Seeding

**Env:** repo-root `.env.local` — `PRODUCTS_DATABASE_URL` (+ `SUPABASE_AUTH_DATABASE_URL` for admin).  
**Commands:** `pnpm run seed:furniture` from root, or `pnpm run ops <name>` for the rest (`pnpm run ops list`).

## Commands

| Goal | Command | DB |
|------|---------|-----|
| Marketing catalog | `pnpm run ops seed` | Products |
| Configurator catalog | `pnpm run ops seed:configurator` | Products |
| Planner managed rows | `pnpm run ops seed:managed` | Products (after `ops db:apply`) |
| Furniture library | `pnpm run seed:furniture` | Admin (after `ops db:apply:admin`) |
| Products migrations | `pnpm run ops db:apply` | Products |
| Admin migrations | `pnpm run ops db:apply:admin` | Admin |
| Admin schema verify | `pnpm run ops db:sync-drizzle` | Admin |

`seed_direct.ts` is **deprecated** — not routine CI.

## Marketing — `pnpm run ops seed`

- Script: `scripts/seed.ts` · data: `scripts/seed_data.sql`
- Upserts `catalog_products` / categories; safe to re-run
- Loads env from **repo root** via `loadEnvLocal.cjs`
- **Do not** use seed to invent PNG release authority (`planSymbolPngUrl`)

## Configurator — `pnpm run ops seed:configurator`

- `scripts/seed_configurator_catalog.ts` → `configurator_products`
- Kept separate so parametric rows never pollute the public marketing catalog

## Planner managed — `pnpm run ops seed:managed`

Idempotent rows into `planner_managed_products` (requires table from migrations).

## Furniture library — `pnpm run seed:furniture`

- `scripts/seed_furniture_catalog.ts` → `public.furniture_catalog` (admin DB via `SUPABASE_AUTH_DATABASE_URL`)
- Source of truth: `site/platform/Studio/data/seed-furniture.json` (16 specs)
- Idempotent: existing ids are skipped unless `-- --force`; `-- --dry` plans only
- Seed art is inline SVG, stored as a `data:` URL so the row needs no bucket
  round-trip. Studio/Planner uploads go to `catalog-assets` instead.

**Run this once per environment after `ops db:apply`.** The disk seeder
(`ensureFurnitureSeeded`) is disk-mode only — a GET handler must not write, and
production's filesystem is read-only, so nothing seeds itself there.

## Hygiene

- No `oando-param-proof-*` pollution as suite food  
- Tests must not mutate canonical catalog  
- Dual-write / revision table rows ≠ cutover  

Schema: [`schema.md`](./schema.md) · stack: [`../architecture/stack.md`](../architecture/stack.md)

## Troubleshooting

| Error | Fix |
|-------|-----|
| `PRODUCTS_DATABASE_URL is not set` | Repo-root `.env.local` |
| `seed_data.sql not found` | Run from monorepo root |
| Workstations total 0 | Re-run `ops seed`; category inserts may have been skipped by comment-split bugs (fixed in seed script) |
| Auth DB errors | Set `SUPABASE_AUTH_DATABASE_URL` for admin apply |
| `permission denied for table` | Policy exists but the **grant** is missing — add `grant select … to anon, authenticated` |
| Migration "applied" but nothing changed | Filename sorts before `20260524`; `db:apply` ignores it |
| Planner rail empty in prod | `seed:furniture` was never run against that environment |

## What happens if you get this wrong

The quiet failure mode: seed content is committed to git, so in production the Planner rail renders and looks healthy while every save fails with `EROFS: read-only file system`. This is silent data loss — the worst kind.

Prevention: all route handlers must import from `plannerStore.ts` or `studioStore.ts`, never `node:fs` directly.

---

## Restore / backup
---

## Restore / backup

**Scope:** Products + Admin Postgres, R2 dumps, catalog degraded mode, maintenance.  
**PNG release:** Storage bytes + release record — [`../architecture/stack.md`](../architecture/stack.md). Dual-write ≠ cutover.  
**Gate:** A backup is not proven until a restore has been exercised (governance P5).

## When to use what

| Situation | First action |
|-----------|--------------|
| Bad deploy | Vercel → Instant Rollback |
| Wrong migration / bad data | Supabase → PITR / daily backup |
| Project lost | R2 `pg_dump` → new Supabase project |
| Catalog empty during outage | R2 `catalog-latest.json` (+ bundled fallback) |
| Plan-symbol missing/corrupt | Keep prior valid release; do not invent pointers |
| Furniture library empty after restore | Re-run `pnpm run seed:furniture` |
| Planned maintenance | `SITE_MAINTENANCE_MODE=readonly` on Vercel |

## 1. Nightly backups

Secrets (sync): `pnpm run ops backup:github-secrets:sync`  
Workflow: `.github/workflows/supabase-backup-r2.yml` (daily 02:15 UTC).

Needs: `PRODUCTS_DATABASE_URL`, `SUPABASE_AUTH_DATABASE_URL`, Cloudflare R2 credentials + `CLOUDFLARE_R2_CATALOG_BUCKET`.

| R2 path | Contents |
|---------|----------|
| `backups/products/pgdump-products-*.dump` | Products DB |
| `backups/admin/pgdump-admin-*.dump` | Admin DB |
| `backups/catalog/catalog-latest.json` | Catalog snapshot for degraded reads |
| `backups/repo/oofplweb-*.zip` | Git archive |

## 2. Restore from Supabase dashboard

Database → Backups → restore/PITR on the matching project (Products or Admin).

```powershell
pnpm run ops db:test
pnpm run ops db:apply -- --dry
pnpm run ops db:apply:admin -- --dry
```

## 3. Restore from R2 pg_dump

1. Download latest dump from R2 (`oando-asset-cdn` default).
2. Create replacement Supabase projects if needed; get new URLs/keys.
3. Restore:

```powershell
if (-not $env:PRODUCTS_DATABASE_URL) { throw "Set PRODUCTS_DATABASE_URL first." }
pg_restore -d $env:PRODUCTS_DATABASE_URL --no-owner --no-acl -Fc products.dump
```

Repeat for admin dump into the admin project.

4. `pnpm run ops db:apply` · `pnpm run ops db:apply:admin`
5. `pnpm run seed:furniture` (targets the **Admin** DB via `SUPABASE_AUTH_DATABASE_URL`) — the furniture library does not seed itself
6. Update Vercel env → redeploy

A restored dump predating 2026-08-01 will still have the retired tables in
`public` and no `archive` schema. Re-applying the migrations moves them; see
[`schema.md`](./schema.md).

## 4. Quarterly restore drill

Staging Supabase → restore R2 dumps → preview Vercel → `db:test` + smoke catalog/planner guest → verify PNG pointers and Storage objects → log in `Failures.md`.

## 5. Maintenance mode

```env
SITE_MAINTENANCE_MODE=readonly
```

Banner on; admin/CRM blocked; mutating plan/planner/tracking/quotes/customer-queries APIs blocked; public catalog + local planner drafts still work. Clear with `off` or remove the var.

## 6. Catalog degraded mode

When Products DB fails, reads fall back to:

1. R2 `backups/catalog/catalog-latest.json`
2. Bundled `site/features/site/data/localCatalogIndex.json` (subset)

Refresh snapshot: `pnpm run catalog:snapshot:r2`. Degraded responses must say they are stale. Unverifiable state fails visibly.

## 7. Planner during outage

Cloud saves fail until Admin DB returns. Local drafts stay in IndexedDB and sync when back.

## 8. Rolling back code vs schema

Migrations are applied as work lands, so the databases can sit ahead of the
deployed build. Rolling code back past a schema change without also running that
migration's `-- rollback` section can point old code at tables that have moved to
`archive`. Check the active rows in root `Failures.md` before rolling back.

## Ownership

Supabase / R2 / GitHub secrets / Vercel env — dashboard owners. Blockers → `Failures.md`.
