-- Supabase Advisor cleanup for Admin DB:
--   - Missing FK indexes (2 real gaps found by direct pg_index inspection)
--   - RLS-enabled tables with no policies (service-role-only intent)
--   - Mutable search_path on functions
--
-- rollback:
--   drop index if exists public.product_studio_template_audit_template_id_idx;
--   drop index if exists public.workspace_editor_config_audit_config_id_idx;
--   drop policy if exists "_local_migration_history_service_all" on public._local_migration_history;
--   drop policy if exists "block_descriptors_service_all" on public.block_descriptors;
--   drop policy if exists "product_studio_template_audit_service_all" on public.product_studio_template_audit;
--   drop policy if exists "product_studio_templates_service_all" on public.product_studio_templates;
--   drop policy if exists "workspace_editor_config_audit_service_all" on public.workspace_editor_config_audit;
--   drop policy if exists "workspace_editor_configs_service_all" on public.workspace_editor_configs;
--   alter function public.reject_product_studio_template_audit_mutation reset search_path;
--   alter function public.reject_workspace_editor_config_audit_mutation reset search_path;
--   alter function public.touch_feature_flags_updated_at reset search_path;

-- Missing indexes
create index if not exists product_studio_template_audit_template_id_idx
  on public.product_studio_template_audit (template_id);

create index if not exists workspace_editor_config_audit_config_id_idx
  on public.workspace_editor_config_audit (config_id);

-- RLS: explicit service-role-only policies (no public access intended)
create policy "_local_migration_history_service_all"
  on public._local_migration_history for all to service_role using (true) with check (true);

create policy "block_descriptors_service_all"
  on public.block_descriptors for all to service_role using (true) with check (true);

create policy "product_studio_template_audit_service_all"
  on public.product_studio_template_audit for all to service_role using (true) with check (true);

create policy "product_studio_templates_service_all"
  on public.product_studio_templates for all to service_role using (true) with check (true);

create policy "workspace_editor_config_audit_service_all"
  on public.workspace_editor_config_audit for all to service_role using (true) with check (true);

create policy "workspace_editor_configs_service_all"
  on public.workspace_editor_configs for all to service_role using (true) with check (true);

-- Pin search_path on mutable functions
alter function public.reject_product_studio_template_audit_mutation set search_path = '';
alter function public.reject_workspace_editor_config_audit_mutation set search_path = '';
alter function public.touch_feature_flags_updated_at set search_path = '';
