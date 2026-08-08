-- ============================================================
-- Supabase 'products' table for O&O dynamic catalog
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

create table if not exists products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text unique not null,
  category        text,
  performance_tier text,
  flagship_image  text,
  description     text,
  scene_images    text[] default '{}',
  variants        jsonb default '[]'::jsonb,
  detailed_info   jsonb default '{}'::jsonb,
  metadata        jsonb default '{}'::jsonb,
  specs           jsonb default '{}'::jsonb,
  series_id       text,
  series_name     text,
  created_at      timestamptz default now()
);

-- Index for fast slug lookup
create index if not exists idx_products_slug on products (slug);

-- Index for category filtering
create index if not exists idx_products_category on products (category);

-- Enable Row-Level Security (read-only for anon)
alter table products enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'Allow public read access'
  ) then
    create policy "Allow public read access"
      on products
      for select
      using (true);
  end if;
end
$$;
