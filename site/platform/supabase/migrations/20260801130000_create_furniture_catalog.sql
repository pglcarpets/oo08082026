-- ---------------------------------------------------------------------------
-- furniture_catalog — the shared Studio/Planner furniture library
-- ---------------------------------------------------------------------------
-- Until now this library lived only on disk, under
-- `site/platform/shared/data/furniture/`: the Studio wrote JSON + PNG/SVG bytes
-- there and the Planner rail read the same directory. On a read-only production
-- filesystem the seeded files still render, so the rail looks healthy while
-- every save, upload and publish fails.
--
-- Columns mirror the item object built in `app/api/Studio/furniture/route.ts`
-- one-for-one, and `id` keeps the on-disk `f_{slug}_{shortid}` shape, so a disk
-- row and a database row are interchangeable and no migration of existing
-- content is required.
--
-- Asset bytes live in the `catalog-assets` storage bucket on this same project;
-- the *_url columns hold the resulting public URLs.

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

-- Grants *and* policies are both required — a policy without a grant still
-- yields "permission denied for table". Mirrors `catalog_products`.
grant select on public.furniture_catalog to anon, authenticated;
grant all on public.furniture_catalog to service_role;

-- The Planner rail is guest-readable (`/api/Planner/catalog` is role: "guest"),
-- matching `catalog_products`. Writes stay service-role: both the Studio and the
-- Planner upload handler run server-side with the service key.
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
  'Shared Studio/Planner furniture library. Rows mirror the on-disk item JSON; bytes live in the catalog-assets bucket.';

-- rollback:
-- drop policy if exists "furniture_catalog service write" on public.furniture_catalog;
-- drop policy if exists "furniture_catalog public read" on public.furniture_catalog;
-- revoke all on public.furniture_catalog from anon, authenticated, service_role;
-- drop table if exists public.furniture_catalog;
