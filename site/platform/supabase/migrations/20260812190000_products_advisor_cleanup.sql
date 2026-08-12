-- Supabase Advisor cleanup for Products DB:
--   - Missing FK indexes (2 real gaps found by direct pg_index inspection)
--   - RLS-enabled tables with no policies (service-role-only intent)
--
-- rollback:
--   drop index if exists public.catalog_product_slug_aliases_canonical_slug_idx;
--   drop index if exists public.catalog_product_specs_product_id_idx;
--   drop policy if exists "block_descriptors_service_all" on public.block_descriptors;
--   drop policy if exists "block_themes_service_all" on public.block_themes;
--   drop policy if exists "svg_revision_artifacts_service_all" on public.svg_revision_artifacts;
--   drop policy if exists "svg_revisions_service_all" on public.svg_revisions;

-- Missing indexes (dropped by duplicate-cleanup migration and never recreated)
create index if not exists catalog_product_slug_aliases_canonical_slug_idx
  on public.catalog_product_slug_aliases (canonical_slug);

create index if not exists catalog_product_specs_product_id_idx
  on public.catalog_product_specs (product_id);

-- RLS: explicit service-role-only policies (no public access intended)
create policy "block_descriptors_service_all"
  on public.block_descriptors for all to service_role using (true) with check (true);

create policy "block_themes_service_all"
  on public.block_themes for all to service_role using (true) with check (true);

create policy "svg_revision_artifacts_service_all"
  on public.svg_revision_artifacts for all to service_role using (true) with check (true);

create policy "svg_revisions_service_all"
  on public.svg_revisions for all to service_role using (true) with check (true);
