-- Phase 05: Move Studio furniture + descriptors from Products to Admin DB
-- Ownership B: Products = catalog + marketing only; Admin = auth + customer_queries + Planner + Studio furniture/descriptors

-- ---------------------------------------------------------------------------
-- furniture_catalog — shared Studio/Planner furniture library
-- ---------------------------------------------------------------------------
create table if not exists public.furniture_catalog (
  id                text primary key,
  name              text not null,
  category          text not null default 'uncategorized',
  subcategory       text,
  tags              text[] not null default '{}',
  dimensions        jsonb not null default '{}'::jsonb,
  notes             text,
  is_custom         boolean not null default true,
  thumbnail_url     text,
  top_png_url       text,
  top_svg_url       text,
  front_png_url     text,
  side_png_url      text,
  top_png_checksum  text,
  top_fabric_json   jsonb,
  front_fabric_json jsonb,
  side_fabric_json  jsonb,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists furniture_catalog_category_idx
  on public.furniture_catalog (category);
create index if not exists furniture_catalog_is_custom_idx
  on public.furniture_catalog (is_custom);
create index if not exists furniture_catalog_name_idx
  on public.furniture_catalog (name);

alter table public.furniture_catalog enable row level security;

-- Grants *and* policies are both required
grant select on public.furniture_catalog to anon, authenticated;
grant all on public.furniture_catalog to service_role;

-- Planner rail is guest-readable; writes stay service-role
drop policy if exists "furniture_catalog public read" on public.furniture_catalog;
create policy "furniture_catalog public read"
  on public.furniture_catalog
  for select
  to anon, authenticated
  using (true);

drop policy if exists "furniture_catalog service write" on public.furniture_catalog;
create policy "furniture_catalog service write"
  on public.furniture_catalog
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.furniture_catalog is
  'Shared Studio/Planner furniture library. Migrated from Products DB (phase 05).';

-- ---------------------------------------------------------------------------
-- block_descriptors — published descriptor releases
-- ---------------------------------------------------------------------------
create table if not exists public.block_descriptors (
  slug             text primary key,
  current_version  integer not null,
  current_checksum text,
  descriptor       jsonb not null,
  lifecycle        text not null default 'live'
    check (lifecycle in ('live', 'draft', 'retired')),
  updated_at       timestamptz not null default now(),
  updated_by       text
);

create index if not exists block_descriptors_lifecycle_idx
  on public.block_descriptors (lifecycle);

alter table public.block_descriptors enable row level security;

-- Service-role only (no public policies)
grant all on public.block_descriptors to service_role;

comment on table public.block_descriptors is
  'Published descriptor releases. Migrated from Products DB (phase 05). Service-role only.';

-- rollback:
-- drop policy if exists "furniture_catalog service write" on public.furniture_catalog;
-- drop policy if exists "furniture_catalog public read" on public.furniture_catalog;
-- revoke all on public.furniture_catalog from anon, authenticated, service_role;
-- drop table if exists public.furniture_catalog;
-- revoke all on public.block_descriptors from service_role;
-- drop table if exists public.block_descriptors;
