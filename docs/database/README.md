# Database

| File | Answers |
|------|---------|
| [`schema.md`](./schema.md) | Which tables exist, on which project, with what RLS |
| [`overview.md`](./overview.md) | Persistence modes, advisors, ship bar |
| [`seeding.md`](./seeding.md) | Which seed command fills which table |
| [`restore.md`](./restore.md) | Backups, restore paths, maintenance, degraded mode |

Operational sequence — deploy, migrate, roll back:
[`../../OPERATIONS_RUNBOOK.md`](../../OPERATIONS_RUNBOOK.md).

## Two projects

Genuinely separate Supabase projects, confirmed by pooler user rather than by
convention. Choosing the wrong one is the most common mistake here.

| Role | Ref | Owns | Env |
|------|-----|------|-----|
| **Products** | `erpweaiypimorcunaimz` | Marketing catalog, configurator, themes, flags (furniture + descriptors moved to Admin in cutover) | `PRODUCTS_DATABASE_URL` |
| **Admin** | `rxzpznmxbaoxpikowmfc` | Plans, profiles, handoffs, teams, price books, customer queries, audit, furniture library, descriptors | `SUPABASE_AUTH_DATABASE_URL` |

Rule of thumb: anything a customer or staff member **owns** is Admin; anything in
the **catalog** is Products.

`SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` both point at the products project,
so the `catalog-assets` storage bucket and the products database are one project —
asset bytes and their metadata rows live together.

## Three things that will catch you

**`public.oando_plans` is the Planner store.** There is also an `archive.plans` —
a retired table kept for its six rows. Do not read it. Nine legacy tables moved to
the admin `archive` schema on 2026-08-01, preserving data and foreign keys and
removing them from the PostgREST surface.

**A policy is not enough.** Supabase needs the table **grant** as well:
`grant select … to anon, authenticated` plus `grant all … to service_role`, or
reads fail with `permission denied for table` despite a matching policy.

**`profiles` has no `email` and no `role` column** — only `id`, `display_name`,
`avatar_url`, `created_at`. Writing either returns PGRST204, and because
`oando_plans.user_id` has a foreign key to `profiles.id`, that upsert runs before
every plan write. Getting it wrong fails every save.

## Neither database is optional in production

Disk storage is a **dev-only** mode selected by `DEV_AUTH_BYPASS=1` on a
non-production build. Production's filesystem is read-only. See
[`overview.md`](./overview.md#persistence-modes).

## VS Code customization

When editing SQL files under `site/platform/supabase/migrations/`, VS Code
Copilot auto-loads
[`.github/instructions/migrations.instructions.md`](../../.github/instructions/migrations.instructions.md)
with the rollback requirement, grants + policies rule, and type regeneration
commands.
