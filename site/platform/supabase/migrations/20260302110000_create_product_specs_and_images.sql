-- Split product technical data and media into dedicated tables.
-- Core catalog tables become:
-- 1) categories
-- 2) products
-- 3) product_specs
-- 4) product_images

create extension if not exists "pgcrypto";

create table if not exists public.product_specs (
  product_id uuid primary key references public.products(id) on delete cascade,
  specs jsonb not null default '{}'::jsonb,
  source text not null default 'products.specs',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_specs_specs_is_object check (jsonb_typeof(specs) = 'object')
);

create index if not exists idx_product_specs_source on public.product_specs (source);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  image_kind text not null default 'gallery',
  variant_id text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_images_kind_check check (
    image_kind in ('flagship', 'gallery', 'scene', 'variant', 'other')
  )
);

create unique index if not exists idx_product_images_unique
  on public.product_images (product_id, image_kind, image_url, sort_order);

create index if not exists idx_product_images_lookup
  on public.product_images (product_id, image_kind, sort_order);

create or replace function public.touch_product_specs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_product_specs_updated_at on public.product_specs;
create trigger trg_touch_product_specs_updated_at
before update on public.product_specs
for each row execute function public.touch_product_specs_updated_at();

create or replace function public.touch_product_images_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_product_images_updated_at on public.product_images;
create trigger trg_touch_product_images_updated_at
before update on public.product_images
for each row execute function public.touch_product_images_updated_at();

-- Backfill specs from products.specs
insert into public.product_specs (product_id, specs, source)
select
  p.id,
  case
    when p.specs is null then '{}'::jsonb
    when jsonb_typeof(p.specs) = 'object' then p.specs
    else '{}'::jsonb
  end as specs,
  'migrated_from_products_specs'
from public.products p
on conflict (product_id) do update
set
  specs = excluded.specs,
  source = excluded.source,
  updated_at = now();

-- Backfill images from products columns
insert into public.product_images (product_id, image_url, image_kind, sort_order)
select p.id, p.flagship_image, 'flagship', 0
from public.products p
where p.flagship_image is not null
  and btrim(p.flagship_image) <> ''
on conflict do nothing;

insert into public.product_images (product_id, image_url, image_kind, sort_order)
select p.id, img.value, 'gallery', img.ord::int
from public.products p
cross join lateral jsonb_array_elements_text(
  case
    when p.images is null then '[]'::jsonb
    when jsonb_typeof(to_jsonb(p.images)) = 'array' then to_jsonb(p.images)
    else '[]'::jsonb
  end
) with ordinality as img(value, ord)
where img.value is not null
  and btrim(img.value) <> ''
on conflict do nothing;

insert into public.product_images (product_id, image_url, image_kind, sort_order)
select p.id, img.value, 'scene', img.ord::int
from public.products p
cross join lateral jsonb_array_elements_text(
  case
    when p.scene_images is null then '[]'::jsonb
    when jsonb_typeof(to_jsonb(p.scene_images)) = 'array' then to_jsonb(p.scene_images)
    else '[]'::jsonb
  end
) with ordinality as img(value, ord)
where img.value is not null
  and btrim(img.value) <> ''
on conflict do nothing;
