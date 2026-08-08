-- Rename core catalog tables to explicit catalog_* names.
-- Also create backward-compatible views with legacy names so current app code
-- can continue to read/write during transition.

-- 1) Physical table renames (idempotent)
do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'products' and c.relkind = 'r'
  )
  and not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'catalog_products' and c.relkind = 'r'
  ) then
    alter table public.products rename to catalog_products;
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'categories' and c.relkind = 'r'
  )
  and not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'catalog_categories' and c.relkind = 'r'
  ) then
    alter table public.categories rename to catalog_categories;
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'product_specs' and c.relkind = 'r'
  )
  and not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'catalog_product_specs' and c.relkind = 'r'
  ) then
    alter table public.product_specs rename to catalog_product_specs;
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'product_images' and c.relkind = 'r'
  )
  and not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'catalog_product_images' and c.relkind = 'r'
  ) then
    alter table public.product_images rename to catalog_product_images;
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'product_slug_aliases' and c.relkind = 'r'
  )
  and not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'catalog_product_slug_aliases' and c.relkind = 'r'
  ) then
    alter table public.product_slug_aliases rename to catalog_product_slug_aliases;
  end if;
end
$$;

-- 2) Optional index name alignment
alter index if exists public.idx_products_slug rename to idx_catalog_products_slug;
alter index if exists public.idx_products_category rename to idx_catalog_products_category;
alter index if exists public.idx_products_category_id rename to idx_catalog_products_category_id;
alter index if exists public.idx_product_specs_source rename to idx_catalog_product_specs_source;
alter index if exists public.idx_product_images_unique rename to idx_catalog_product_images_unique;
alter index if exists public.idx_product_images_lookup rename to idx_catalog_product_images_lookup;
alter index if exists public.idx_product_slug_aliases_active_alias rename to idx_catalog_product_slug_aliases_active_alias;
alter index if exists public.idx_product_slug_aliases_active_canonical rename to idx_catalog_product_slug_aliases_active_canonical;

-- 3) Remove old compatibility views if they already exist
do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'products' and c.relkind = 'v'
  ) then
    drop view public.products;
  end if;
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'categories' and c.relkind = 'v'
  ) then
    drop view public.categories;
  end if;
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'product_specs' and c.relkind = 'v'
  ) then
    drop view public.product_specs;
  end if;
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'product_images' and c.relkind = 'v'
  ) then
    drop view public.product_images;
  end if;
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'product_slug_aliases' and c.relkind = 'v'
  ) then
    drop view public.product_slug_aliases;
  end if;
end
$$;

-- 4) Backward-compatible legacy views (legacy names -> new catalog_* tables)
do $$
begin
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'products' and c.relkind = 'r'
  )
  and exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'catalog_products' and c.relkind = 'r'
  ) then
    execute '
      create view public.products
      with (security_invoker=true)
      as select * from public.catalog_products
    ';
  end if;

  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'categories' and c.relkind = 'r'
  )
  and exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'catalog_categories' and c.relkind = 'r'
  ) then
    execute '
      create view public.categories
      with (security_invoker=true)
      as select * from public.catalog_categories
    ';
  end if;

  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'product_specs' and c.relkind = 'r'
  )
  and exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'catalog_product_specs' and c.relkind = 'r'
  ) then
    execute '
      create view public.product_specs
      with (security_invoker=true)
      as select * from public.catalog_product_specs
    ';
  end if;

  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'product_images' and c.relkind = 'r'
  )
  and exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'catalog_product_images' and c.relkind = 'r'
  ) then
    execute '
      create view public.product_images
      with (security_invoker=true)
      as select * from public.catalog_product_images
    ';
  end if;

  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'product_slug_aliases' and c.relkind = 'r'
  )
  and exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'catalog_product_slug_aliases' and c.relkind = 'r'
  ) then
    execute '
      create view public.product_slug_aliases
      with (security_invoker=true)
      as select * from public.catalog_product_slug_aliases
    ';
  end if;
end
$$;

-- 5) Ensure app roles can continue to query legacy view names
do $$
declare
  rel text;
begin
  foreach rel in array array[
    'products',
    'categories',
    'product_specs',
    'product_images',
    'product_slug_aliases'
  ]
  loop
    if to_regclass('public.' || rel) is not null then
      execute format('grant select on public.%I to anon, authenticated', rel);
      execute format('grant all privileges on public.%I to service_role', rel);
    end if;
  end loop;
end
$$;
