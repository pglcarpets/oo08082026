-- ============================================================
-- Migration: Add missing indexes (products catalog DB).
-- Skips sections when a table was dropped in the products split.
-- ============================================================

-- ----------------------------------------------------------------
-- 1) catalog_products
-- ----------------------------------------------------------------
create index if not exists idx_catalog_products_created_at
  on public.catalog_products (created_at desc);
create index if not exists idx_catalog_products_series_id
  on public.catalog_products (series_id);
create index if not exists idx_catalog_products_series_name
  on public.catalog_products (series_name);
create index if not exists idx_catalog_products_performance_tier
  on public.catalog_products (performance_tier)
  where performance_tier is not null;
create index if not exists idx_catalog_products_category_created_at
  on public.catalog_products (category_id, created_at desc);
create index if not exists idx_catalog_products_category_subcategory
  on public.catalog_products (category_id, canonical_subcategory_id);
create index if not exists idx_catalog_products_series_created_at
  on public.catalog_products (series_id, created_at desc);

-- ----------------------------------------------------------------
-- 2) catalog_product_images
-- ----------------------------------------------------------------
create index if not exists idx_catalog_product_images_created_at
  on public.catalog_product_images (created_at desc);

-- ----------------------------------------------------------------
-- 3) catalog_product_specs
-- ----------------------------------------------------------------
drop index if exists public.catalog_product_specs_product_id_idx;

-- ----------------------------------------------------------------
-- 4) catalog_product_slug_aliases
-- ----------------------------------------------------------------
create index if not exists idx_catalog_product_slug_aliases_created_at
  on public.catalog_product_slug_aliases (created_at desc);

-- ----------------------------------------------------------------
-- 5–9) Optional tables — guard for products-split omissions
-- ----------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'configurator_products'
  ) then
    execute 'create index if not exists idx_configurator_products_family on public.configurator_products (family)';
    execute 'create index if not exists idx_configurator_products_created_at on public.configurator_products (created_at desc)';
    execute 'create index if not exists idx_configurator_products_category_active on public.configurator_products (category, active)';
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'business_stats_history'
  ) then
    execute 'create index if not exists idx_business_stats_history_business_stats_id on public.business_stats_history (business_stats_id)';
    execute 'create index if not exists idx_business_stats_history_changed_at on public.business_stats_history (changed_at desc)';
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'customer_queries'
  ) then
    execute 'create index if not exists customer_queries_source_idx on public.customer_queries (source)';
    execute 'create index if not exists customer_queries_status_created_at_idx on public.customer_queries (status, created_at desc)';
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'block_themes'
  ) then
    execute 'create index if not exists idx_block_themes_name on public.block_themes (name)';
    execute 'create index if not exists idx_block_themes_created_at on public.block_themes (created_at desc)';
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'image_assets'
  ) then
    execute 'create index if not exists idx_image_assets_created_by on public.image_assets (created_by)';
  end if;
end $$;
