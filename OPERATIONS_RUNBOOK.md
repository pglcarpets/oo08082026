# Operations runbook

Deploy · migrate · seed · roll back. **Repo root only.**

- Daily: root scripts. Rest: `pnpm run ops <name>` (`ops list`).
- Blockers: [`Failures.md`](./Failures.md) · Schema: [`docs/database/schema.md`](./docs/database/schema.md) · Restore: [`docs/database/restore.md`](./docs/database/restore.md)

---

## 0. Environments

| | FS | Persistence | Bypass |
|---|----|--------------|--------|
| Local | writable | **disk** | `DEV_AUTH_BYPASS=1` |
| CI | writable | **supabase** | unset |
| Prod | **read-only** | **supabase** | never |

`DEV_AUTH_BYPASS` ignored in production. Don't set `DEV_AUTH_BYPASS_ALLOW_PRODUCTION` (dead).

| DB | Ref | URL env | DB env |
|----|-----|---------|--------|
| Products | `erpweaiypimorcunaimz` | `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` | `PRODUCTS_DATABASE_URL` |
| Admin | `rxzpznmxbaoxpikowmfc` | `NEXT_ADMIN_SUPABASE_URL` | `SUPABASE_AUTH_DATABASE_URL` |

Furniture + descriptors → **Admin**. Products may still hold legacy assets. Selector: `catalogAssetStorage.server.ts`.

---

## 1. Deploy

Order: migrations → seed → code.

```bash
pnpm install
pnpm run ops db:apply -- --dry    # read plan; only ≥ 20260524
pnpm run ops db:apply
pnpm run ops db:apply:admin
pnpm run seed:furniture           # once per env — else empty Planner rail
pnpm run release:gate
# deploy
pnpm run ops db:test
```

Smoke in browser: `/ooplanner` → rail populated → place → save → reload.

---

## 2. Migration

1. File under `site/platform/supabase/migrations/` or `migrations.admin/`: `YYYYMMDDHHMMSS_snake_case.sql`.
2. Include `-- rollback:`. Ratchet baseline **42**.
3. New table → **grants + policies**:

```sql
alter table public.thing enable row level security;
grant select on public.thing to anon, authenticated;
grant all on public.thing to service_role;
-- policies next
```

4. `--dry`, then apply.  
5. Types: `ops db:types:admin` then `ops db:types` (not interchangeable).  
6. `pnpm run typecheck`.

Re-run: delete row from `_local_migration_history` only if migration is idempotent.

---

## 3. Seed

| Command | Target |
|---------|--------|
| `ops seed` | `catalog_products` |
| `ops seed:configurator` | `configurator_products` |
| `ops seed:managed` | `planner_managed_products` |
| `seed:furniture` | `furniture_catalog` (Planner rail) |

`seed:furniture -- --dry` / `-- --force`. Source: `site/platform/Studio/data/seed-furniture.json`.

---

## 4. Rollback

Code and schema are separate. Revert migrations (newest first, hand-run `-- rollback:`) **before** Instant Rollback if schema moved.

Hazard: legacy tables now in `archive` (invisible to PostgREST). Don't roll code past schema without reverting.

---

## 5. Incidents

| Symptom | Check |
|---------|-------|
| Empty rail in prod | `seed:furniture` not run |
| Saves fail in prod | Stuck on `disk`? `DEV_AUTH_BYPASS` set? |
| `permission denied for table` | Grant missing |
| `PGRST204` column | Stale types / wrong columns |
| Empty plan list | `user_id` / profile row |
| `relation does not exist` | Archived table or wrong DB |
| Catalog outage | R2 fallback — `docs/database/restore.md` |
| Bad deploy | Instant Rollback → §4 |

Maintenance: `SITE_MAINTENANCE_MODE=readonly`.

---

## 6. Backups

Nightly: `.github/workflows/supabase-backup-r2.yml` (02:15 UTC) → both DBs + catalog + repo to R2.

```bash
pnpm run ops backup:github-secrets:sync
```

Prove with a restore drill (P5). Pre-2026-08-01 dumps still have public legacy tables.

---

## 7. Gates

| Command | Covers |
|---------|--------|
| `check:layout` | Workspace shape |
| `scan:boundaries` | Studio ↔ Planner |
| `typecheck` · `typecheck:tests` | Types |
| `test` | Both vitest lanes |
| `check:docs-all` | Docs + plan purity |
| `check:governance` | Ratchets |
| `gate` / `release:gate` | Fast / full |
| `tech-docs:gate` | Inventory package |

Ops: `db:apply` · `db:test` · `backup:supabase:r2` · `gate:site-ui` · `gate:open3d` · `list`.

Blockers: [`Failures.md`](./Failures.md) only.
