-- ---------------------------------------------------------------------------
-- Record that these tables are service-role-only on purpose (admin DB)
-- ---------------------------------------------------------------------------
-- RLS is enabled with zero policies, so `anon` and `authenticated` see nothing
-- and only the service-role client can reach them. That is deliberate: every
-- reader goes through a server route holding SUPABASE_ADMIN_SERVICE_ROLE_KEY.
--
-- Without this note the shape is indistinguishable from a table someone forgot
-- to write policies for. `tests/unit/platform/serviceRoleOnlyTables.db.test.ts`
-- pins the set, so adding a policy here — or leaving a *new* table unpoliced —
-- fails the suite rather than silently changing who can read what.

comment on table public.product_studio_templates is
  'service_role only by design — RLS on, no policies; reached via admin server routes.';
comment on table public.product_studio_template_audit is
  'service_role only by design — RLS on, no policies; append-only audit trail.';
comment on table public.workspace_editor_configs is
  'service_role only by design — RLS on, no policies; reached via admin server routes.';
comment on table public.workspace_editor_config_audit is
  'service_role only by design — RLS on, no policies; append-only audit trail.';
comment on table public._local_migration_history is
  'service_role only by design — migration runner bookkeeping (scripts/db_apply_migrations.ts).';

-- rollback:
-- comment on table public.product_studio_templates is null;
-- comment on table public.product_studio_template_audit is null;
-- comment on table public.workspace_editor_configs is null;
-- comment on table public.workspace_editor_config_audit is null;
-- comment on table public._local_migration_history is null;
