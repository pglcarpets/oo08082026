# Database restore runbook

**Scope:** Products + Admin Postgres, R2 dumps, catalog degraded mode, maintenance.  
**PNG release:** Storage bytes + release record — `docs/architecture/stack.md`. Dual-write ≠ cutover.  
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
`schema.md`.

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
`archive`. Check the active rows in `Failures.md` before rolling back (as of
2026-08-08 these are deploy blockers P0-1–P0-3 and F3, not schema items).

## Ownership

Supabase / R2 / GitHub secrets / Vercel env — dashboard owners. Blockers → `Failures.md`.
