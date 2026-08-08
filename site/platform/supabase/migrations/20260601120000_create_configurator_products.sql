-- Configurator parametric catalog (Plan D / D2).
-- Dedicated table — kept SEPARATE from the public `products` marketing catalog so
-- empty-image seed rows never surface on the live site. Holds the parametric model
-- from lib/catalog/types.ts: three sizing types (parametric / discrete / fixed).
-- No pricing (owner spec). Thumbnails/3D optional, filled in admin later.

create table if not exists public.configurator_products (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  name              text not null,
  category          text not null,                 -- workstations | storage | tables | seating | soft-seating
  family            text,                          -- Linear | L-Shape | Pedestal | Meeting | ...
  brand_name        text,
  sizing_type       text not null
                      check (sizing_type in ('parametric', 'discrete', 'fixed')),
  workstation       jsonb,                          -- WorkstationSpec when sizing_type = parametric
  size_options      jsonb not null default '[]'::jsonb,  -- SizeOption[] when sizing_type = discrete
  default_footprint jsonb,                          -- Dim when sizing_type = fixed
  derived_rules     jsonb,                          -- DerivedRules (screen/modesty offsets)
  materials         text[] not null default '{}',
  thumbnail_url     text,
  model_3d_url      text,
  description       text,
  active            boolean not null default true,  -- soft delete; existing Spaces keep working
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_configurator_products_category
  on public.configurator_products (category);
create index if not exists idx_configurator_products_active
  on public.configurator_products (active);

-- Keep updated_at fresh on every write.
create or replace function public.touch_configurator_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_configurator_products_updated_at on public.configurator_products;
create trigger trg_configurator_products_updated_at
  before update on public.configurator_products
  for each row
  execute function public.touch_configurator_products_updated_at();

-- RLS: public can read only ACTIVE rows; writes go through the service role
-- (which bypasses RLS), so no write policy is granted to anon/authenticated.
alter table public.configurator_products enable row level security;

drop policy if exists "configurator_products public read active"
  on public.configurator_products;
create policy "configurator_products public read active"
  on public.configurator_products
  for select
  using (active = true);
