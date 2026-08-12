# Database docs — critical only

Live docs under `docs/database/`. Code and migrations under `site/platform/` win when this lags.

Tech-docs / admin Architecture docs link is **not** database-backed; see [`tech-docs-link.md`](../architecture/tech-docs-link.md) if you need that surface.

## Live

| File | Owns |
|------|------|
| [`schema.md`](./schema.md) | Two DBs, live table map, RLS, `archive` schema, migration commands |
| [`seeding.md`](./seeding.md) | Seed / apply commands from repo root |
| [`restore.md`](./restore.md) | Backup / restore / maintenance |

## Advisors (no essay)

```powershell
pnpm run ops db:advisors
pnpm run ops db:advisors:security
pnpm run ops db:advisors:performance
pnpm run ops db:advisors:admin
```

Ship bar: **0 SECURITY ERRORs** on Products and Admin. Script: `scripts/db_advisors.ts`.

## Persistence modes

Neither database is optional in production. Disk storage is a **dev-only** mode,
selected by `DEV_AUTH_BYPASS=1` on a non-production build; production's
filesystem is read-only.

| Data | Supabase (prod) | Disk (dev) |
|------|-----------------|------------|
| Planner projects | `oando_plans` (admin) | `platform/Planner/data/projects/` |
| Furniture library | `furniture_catalog` + `catalog-assets` bucket (admin) | `platform/shared/data/furniture/` |
| Published descriptors | `block_descriptors` (admin) | `site/inventory/descriptors/` |

Selectors: `lib/Planner/plannerPersistenceMode.ts`, `lib/catalog/furnitureCatalogMode.ts`.
Never dual-write.
