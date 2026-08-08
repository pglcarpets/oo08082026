# Operations runbook

Deploy, migrate, seed, verify, roll back. Every command runs from the **repo root**.

Most operational steps use **`pnpm run ops <name>`** — `pnpm run ops list` for the
full catalog. Root `package.json` keeps daily dev, gates, and tests only.

Blockers: [`Failures.md`](./Failures.md) · Schema: [`docs/database/schema.md`](./docs/database/schema.md) ·
Restore detail: [`docs/database/restore.md`](./docs/database/restore.md)

---

## 0. Environments at a glance

| | Filesystem | Persistence | Auth bypass |
|---|---|---|---|
| Local dev | writable | **disk** | `DEV_AUTH_BYPASS=1` |
| CI | writable | **supabase** | unset |
| Production | **read-only** | **supabase** | never |

`DEV_AUTH_BYPASS` is ignored when `NODE_ENV=production` — the code hard-returns
false, so it cannot leak. `DEV_AUTH_BYPASS_ALLOW_PRODUCTION` appears in
`.env.local` but has **zero code references**; it does nothing.

Two Supabase projects, and mixing them up is the most common incident here:

| Role | Ref | URL env | DB env |
|------|-----|---------|--------|
| Products / catalog | `erpweaiypimorcunaimz` | `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` | `PRODUCTS_DATABASE_URL` |
| Admin / planner | `rxzpznmxbaoxpikowmfc` | `NEXT_ADMIN_SUPABASE_URL` | `SUPABASE_AUTH_DATABASE_URL` |

The `catalog-assets` bucket exists on **both** projects: the furniture library
uses the Admin-project copy (`catalogAssetStorage.server.ts` selects the storage
project), while legacy planner symbols/GLB remain on the products copy.

---

## 1. Deploy sequence

Order matters. Migrations first, then seed, then code.

```bash
pnpm install
```

```bash
pnpm run ops db:apply -- --dry
```

Read the plan before applying. If it says "all up to date" but you expect a new
file, check the filename sorts at or after `20260524` — `db:apply` ignores
anything earlier.

```bash
pnpm run ops db:apply
```

```bash
pnpm run ops db:apply:admin
```

```bash
pnpm run seed:furniture
```

**Required once per environment.** The furniture library does not seed itself in
Supabase mode: the disk seeder is disk-only, because a GET handler must not write
and production's filesystem is read-only. Skip this and the Planner rail is empty.

```bash
pnpm run release:gate
```

Then deploy the build.

### After deploying

```bash
pnpm run ops db:test
```

Then, in a browser at the deployed origin: open `/ooplanner`, confirm the
furniture rail is populated, place one item, save, reload, confirm it persisted.
That single journey exercises `furniture_catalog`, the `catalog-assets` bucket and
`oando_plans` together.

---

## 2. Adding a migration

1. Create the file under `site/platform/supabase/migrations/` (products) or
   `migrations.admin/` (admin). Name it `YYYYMMDDHHMMSS_snake_case.sql`.
2. **Include a `-- rollback:` section.** `check:governance` ratchets
   `P4_migration_no_rollback` against a baseline of 42 and fails when it rises.
3. If you create a table, add **grants as well as policies**:

```sql
alter table public.thing enable row level security;
grant select on public.thing to anon, authenticated;
grant all    on public.thing to service_role;
-- then the policies
```

A policy without a grant still fails with `permission denied for table`. This is
the single most common cause of a "correct" migration not working.

4. Apply with `--dry` first, then for real.
5. Regenerate types:

```bash
pnpm run ops db:types:admin
```

```bash
pnpm run ops db:types
```

`db:types:admin` introspects `information_schema` and writes
`site/platform/types/database.admin.types.ts`. `db:types` needs the Supabase CLI
and rewrites the products types, which contain Views and Functions the
introspection generator does not emit — do not substitute one for the other.

6. `pnpm run typecheck`. Stale types are how a live bug hid here before: `any`
   casts added to work around them concealed a write to columns that did not
   exist, failing every production Planner save.

### Re-running an already-applied migration

`db:apply` skips anything recorded in `_local_migration_history`. If you corrected
an idempotent migration and need it re-run, delete its row and re-apply. Only do
this when the migration is genuinely idempotent.

---

## 3. Seeding

| Command | Target | Notes |
|---------|--------|-------|
| `pnpm run ops seed` | `catalog_products` (products) | Marketing catalog, idempotent |
| `pnpm run ops seed:configurator` | `configurator_products` | Parametric catalog |
| `pnpm run ops seed:managed` | `planner_managed_products` | Admin-curated library |
| `pnpm run seed:furniture` | `furniture_catalog` | **Planner rail contents** |

`seed:furniture` accepts `-- --dry` to plan and `-- --force` to overwrite existing
ids. Source: `site/platform/Studio/data/seed-furniture.json`.

---

## 4. Rolling back

**Code and schema roll back separately, and the order matters.**

Rolling code back past a schema change without also reverting that migration can
point old code at tables that have moved or changed. The specific hazard today:
nine legacy tables (`plans`, `clients`, `quotes`, `users`, …) now live in the
`archive` schema, so they are invisible to PostgREST.

1. Identify which migrations landed after the target build.
2. Run each one's `-- rollback:` section, newest first, by hand against the right
   database. They are commented out on purpose — read before pasting.
3. Then roll the code back (Vercel → Instant Rollback).

Verified before this was written: no deployed code path reads the archived tables
— zero `.from("<table>")` references across `site/` and `scripts/`. Re-verify if
you are rolling back to a much older build.

---

## 5. Incidents

| Symptom | First check |
|---------|-------------|
| Planner rail empty in prod | `seed:furniture` never run on that environment |
| Studio saves fail in prod | Persistence resolved to `disk` — is `DEV_AUTH_BYPASS` set? |
| `permission denied for table` | Policy exists, grant missing |
| `PGRST204 … column not found` | Code writing a column the table lacks; regenerate types |
| Plan list empty for a signed-in user | `oando_plans.user_id` vs the session id; profile row must exist first |
| `relation … does not exist` | Table archived, or wrong database of the two |
| Catalog empty during outage | R2 `catalog-latest.json` fallback — see `docs/database/restore.md` |
| Bad deploy | Vercel → Instant Rollback, then §4 |

Planned maintenance: set `SITE_MAINTENANCE_MODE=readonly`. Banner on, admin and
mutating APIs blocked, public catalog and local planner drafts still work.

---

## 6. Backups

Nightly workflow `.github/workflows/supabase-backup-r2.yml` (02:15 UTC) writes
`pg_dump` files for both databases, a catalog snapshot and a repo archive to R2.

```bash
pnpm run ops backup:github-secrets:sync
```

A backup is not proven until a restore has been exercised — governance P5. Drill
quarterly against staging and log the result in `Failures.md`.

Note for any restore of a dump predating **2026-08-01**: it will still have the
retired tables in `public` and no `archive` schema. Re-applying the migrations
moves them.

---

## 7. Gate reference

Root scripts (daily loop):

| Command | Covers |
|---------|--------|
| `pnpm run check:layout` | Workspace shape, no nested installs |
| `pnpm run scan:boundaries` | Studio ↔ Planner separation |
| `pnpm run typecheck` · `typecheck:tests` | Types |
| `pnpm run test` | **Both** vitest lanes |
| `pnpm run check:docs-all` | Docs + handbooks + plan purity |
| `pnpm run check:governance` | Ratchets incl. migration rollbacks |
| `pnpm run gate` | Fast gate |
| `pnpm run release:gate` | Full ship gate |
| `pnpm run tech-docs:gate` | Tech-docs package CI gate |

Ops examples (`pnpm run ops list`):

| Command | Covers |
|---------|--------|
| `ops db:apply` · `ops db:apply:admin` | Migrations |
| `ops db:test` | Connection smoke |
| `ops backup:supabase:r2` | Scheduled backup workflow |
| `ops gate:site-ui` | Marketing site-ui CI workflow |
| `ops gate:open3d` | Open3D world e2e pack |

Known blockers: [`Failures.md`](./Failures.md) P0-1–P0-3 and F3 (deploy: Worker origin /
apex catalog / docs DNS) as of 2026-08-08. The tech-docs gate needs a fresh
exit-0 run — no longer tracked under an F-id.
