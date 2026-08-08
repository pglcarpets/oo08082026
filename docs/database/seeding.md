# Database seeding

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

Schema: [`schema.md`](./schema.md) · PNG contract: `docs/architecture/stack.md`

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
