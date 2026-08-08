-- Fix RLS policies and Grant permissions for public access
-- This ensures the 'anon' and 'authenticated' roles can read the catalog and business stats.

do $$
declare
  tab text;
begin
  -- 1) Grant SELECT permissions on physical tables
  foreach tab in array array[
    'catalog_products',
    'catalog_categories',
    'catalog_product_specs',
    'catalog_product_images',
    'catalog_product_slug_aliases',
    'business_stats_current',
    'business_stats_history'
  ]
  loop
    if to_regclass('public.' || tab) is not null then
      execute format('grant select on public.%I to anon, authenticated', tab);
      execute format('grant all privileges on public.%I to service_role', tab);
    end if;
  end loop;

  -- 2) Ensure RLS policies exist for physical tables
  -- catalog_products
  if to_regclass('public.catalog_products') is not null then
    drop policy if exists "Allow public read access to catalog_products" on public.catalog_products;
    create policy "Allow public read access to catalog_products"
      on public.catalog_products for select to anon, authenticated using (true);
  end if;

  -- catalog_categories
  if to_regclass('public.catalog_categories') is not null then
    drop policy if exists "Allow public read access to catalog_categories" on public.catalog_categories;
    create policy "Allow public read access to catalog_categories"
      on public.catalog_categories for select to anon, authenticated using (true);
  end if;

  -- catalog_product_specs
  if to_regclass('public.catalog_product_specs') is not null then
    drop policy if exists "Allow public read access to catalog_product_specs" on public.catalog_product_specs;
    create policy "Allow public read access to catalog_product_specs"
      on public.catalog_product_specs for select to anon, authenticated using (true);
  end if;

  -- catalog_product_images
  if to_regclass('public.catalog_product_images') is not null then
    drop policy if exists "Allow public read access to catalog_product_images" on public.catalog_product_images;
    create policy "Allow public read access to catalog_product_images"
      on public.catalog_product_images for select to anon, authenticated using (true);
  end if;

  -- catalog_product_slug_aliases
  if to_regclass('public.catalog_product_slug_aliases') is not null then
    drop policy if exists "Allow public read access to catalog_product_slug_aliases" on public.catalog_product_slug_aliases;
    create policy "Allow public read access to catalog_product_slug_aliases"
      on public.catalog_product_slug_aliases for select to anon, authenticated using (true);
  end if;

  -- business_stats_current
  if to_regclass('public.business_stats_current') is not null then
    drop policy if exists "Allow public read access to business_stats_current" on public.business_stats_current;
    create policy "Allow public read access to business_stats_current"
      on public.business_stats_current for select to anon, authenticated using (true);
  end if;

  -- business_stats_history
  if to_regclass('public.business_stats_history') is not null then
    drop policy if exists "Allow public read access to business_stats_history" on public.business_stats_history;
    create policy "Allow public read access to business_stats_history"
      on public.business_stats_history for select to anon, authenticated using (true);
  end if;
end
$$;
