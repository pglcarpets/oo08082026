do $$
declare
  product_aliases_relkind "char";
  catalog_aliases_relkind "char";
begin
  select c.relkind
    into product_aliases_relkind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'product_slug_aliases'
  limit 1;

  select c.relkind
    into catalog_aliases_relkind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'catalog_product_slug_aliases'
  limit 1;

  -- If the catalog table exists, ensure legacy compatibility via a view.
  if catalog_aliases_relkind = 'r' then
    if product_aliases_relkind is null then
      execute 'create view public.product_slug_aliases as select * from public.catalog_product_slug_aliases';
    end if;
    return;
  end if;

  -- If legacy table is missing, create it with the columns resolver expects.
  if product_aliases_relkind is null then
    execute '
      create table public.product_slug_aliases (
        id bigserial primary key,
        alias_slug text not null unique,
        canonical_slug text not null,
        is_active boolean not null default true,
        product_id bigint null,
        created_at timestamptz not null default now()
      )
    ';
  end if;
end
$$;

-- Apply only when product_slug_aliases is a table, not a view.
do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'product_slug_aliases'
      and c.relkind = 'r'
  ) then
    alter table public.product_slug_aliases
      add column if not exists is_active boolean not null default true;

    create index if not exists idx_product_slug_aliases_canonical
      on public.product_slug_aliases (canonical_slug);
  end if;
end
$$;
