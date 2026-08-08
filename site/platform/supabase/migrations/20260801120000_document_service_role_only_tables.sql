-- ---------------------------------------------------------------------------
-- Record that these tables are service-role-only on purpose (products DB)
-- ---------------------------------------------------------------------------
-- RLS is enabled with zero policies, so `anon` and `authenticated` see nothing
-- and only the service-role client can reach them. That is deliberate: the SVG
-- revision and block descriptor tables are catalog-publish internals, written
-- by server routes and scripts holding SUPABASE_SERVICE_ROLE_KEY. Buyer-facing
-- reads go through `catalog_products` / `planner_managed_products`, which do
-- carry policies.
--
-- `tests/unit/platform/serviceRoleOnlyTables.db.test.ts` pins the set, so adding
-- a policy here — or leaving a *new* table unpoliced — fails the suite rather
-- than silently changing who can read what.

comment on table public.block_descriptors is
  'service_role only by design — RLS on, no policies; catalog publish target.';
comment on table public.block_themes is
  'service_role only by design — RLS on, no policies; admin theme editor only.';
comment on table public.svg_revisions is
  'service_role only by design — RLS on, no policies; publish-pipeline internal.';
comment on table public.svg_revision_artifacts is
  'service_role only by design — RLS on, no policies; publish-pipeline internal.';

-- `_local_migration_history` is deliberately excluded: the products copy has a
-- policy, unlike the admin one, so it is not part of this set.

-- rollback:
-- comment on table public.block_descriptors is null;
-- comment on table public.block_themes is null;
-- comment on table public.svg_revisions is null;
-- comment on table public.svg_revision_artifacts is null;
