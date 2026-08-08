-- Canonical slug support with alias redirect and duplicate-name visibility.

create extension if not exists "pgcrypto";

create table if not exists public.product_slug_aliases (
  id uuid primary key default gen_random_uuid(),
  alias_slug text not null,
  canonical_slug text not null references public.products(slug) on update cascade on delete cascade,
  reason text not null default 'legacy_alias',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_slug_aliases_alias_not_blank check (btrim(alias_slug) <> ''),
  constraint product_slug_aliases_canonical_not_blank check (btrim(canonical_slug) <> ''),
  constraint product_slug_aliases_not_self check (alias_slug <> canonical_slug)
);

create unique index if not exists idx_product_slug_aliases_active_alias
  on public.product_slug_aliases (alias_slug)
  where is_active;

create index if not exists idx_product_slug_aliases_active_canonical
  on public.product_slug_aliases (canonical_slug)
  where is_active;

create or replace function public.touch_product_slug_aliases_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_product_slug_aliases_updated_at on public.product_slug_aliases;
create trigger trg_touch_product_slug_aliases_updated_at
before update on public.product_slug_aliases
for each row execute function public.touch_product_slug_aliases_updated_at();

alter table public.product_slug_aliases enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_slug_aliases'
      and policyname = 'Allow public read access on product_slug_aliases'
  ) then
    create policy "Allow public read access on product_slug_aliases"
      on public.product_slug_aliases
      for select
      using (true);
  end if;
end
$$;

alter table public.products
  add column if not exists normalized_name_key text;

create or replace function public.compute_normalized_product_name_key(source_name text)
returns text
language sql
immutable
as $$
  select nullif(
    trim(both '-' from regexp_replace(lower(coalesce(source_name, '')), '[^a-z0-9]+', '-', 'g')),
    ''
  );
$$;

create or replace function public.set_products_normalized_name_key()
returns trigger
language plpgsql
as $$
begin
  new.normalized_name_key := public.compute_normalized_product_name_key(new.name);
  return new;
end;
$$;

drop trigger if exists trg_set_products_normalized_name_key on public.products;
create trigger trg_set_products_normalized_name_key
before insert or update of name on public.products
for each row execute function public.set_products_normalized_name_key();

update public.products
set normalized_name_key = public.compute_normalized_product_name_key(name)
where normalized_name_key is distinct from public.compute_normalized_product_name_key(name);

create index if not exists idx_products_category_normalized_name_key
  on public.products (category_id, normalized_name_key);

create or replace view public.product_name_collisions as
select
  category_id,
  normalized_name_key,
  count(*) as row_count,
  array_agg(slug order by slug) as slugs
from public.products
where normalized_name_key is not null
group by category_id, normalized_name_key
having count(*) > 1;

insert into public.product_slug_aliases (alias_slug, canonical_slug, reason, is_active)
select 'fluid-x', 'oando-seating--fluid-x', 'canonicalize_mesh_slug_duplicate', true
where exists (select 1 from public.products where slug = 'fluid-x')
  and exists (select 1 from public.products where slug = 'oando-seating--fluid-x')
on conflict (alias_slug) where is_active
do update set
  canonical_slug = excluded.canonical_slug,
  reason = excluded.reason,
  is_active = true,
  updated_at = now();
