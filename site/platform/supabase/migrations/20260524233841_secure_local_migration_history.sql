-- Lock down the migration runner's bookkeeping table.
-- _local_migration_history is created automatically by scripts/db_apply_migrations.ts
-- to track which local migrations have been applied. It contains no user
-- data, but it lives in the public schema so we enable RLS to deny anon
-- access and add a service-role-only policy.

alter table public._local_migration_history enable row level security;

drop policy if exists "_local_migration_history_service_role_all"
  on public._local_migration_history;

create policy "_local_migration_history_service_role_all"
  on public._local_migration_history
  for all
  to service_role
  using (true)
  with check (true);
