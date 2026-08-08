-- Planner-managed catalog + runtime feature flags (products Supabase DB).
-- Code: features/planner/catalog/*, /api/planner/catalog, /api/admin/features.
-- Apply with: pnpm --filter oando-site run db:apply -- --dry  (plan)
--             pnpm --filter oando-site run db:apply          (after explicit owner approval)

-- ---------------------------------------------------------------------------
-- planner_managed_products — admin-curated workspace library items
-- ---------------------------------------------------------------------------
create table if not exists public.planner_managed_products (
  id                  uuid primary key default gen_random_uuid(),
  legacy_product_id   text,
  slug                text not null,
  planner_source_slug text not null,
  name                text not null,
  description         text not null default '',
  category            text not null,
  category_id         text not null,
  category_name       text not null,
  series_id           text not null,
  series_name         text not null,
  price               integer not null default 0,
  flagship_image      text not null default '',
  images              text[] not null default '{}',
  specs               jsonb not null default '{}'::jsonb,
  metadata            jsonb not null default '{}'::jsonb,
  active              boolean not null default true,
  created_by          uuid,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint planner_managed_products_slug_key unique (slug)
);

create index if not exists idx_planner_managed_products_active
  on public.planner_managed_products (active);
create index if not exists idx_planner_managed_products_category
  on public.planner_managed_products (category);
create index if not exists idx_planner_managed_products_updated_at
  on public.planner_managed_products (updated_at desc);

create or replace function public.touch_planner_managed_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_planner_managed_products_updated_at on public.planner_managed_products;
create trigger trg_planner_managed_products_updated_at
  before update on public.planner_managed_products
  for each row
  execute function public.touch_planner_managed_products_updated_at();

alter table public.planner_managed_products enable row level security;

drop policy if exists "planner_managed_products public read active"
  on public.planner_managed_products;
create policy "planner_managed_products public read active"
  on public.planner_managed_products
  for select
  using (active = true);

drop policy if exists "planner_managed_products service write"
  on public.planner_managed_products;
create policy "planner_managed_products service write"
  on public.planner_managed_products
  for all
  to service_role
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- feature_flags — persisted overrides merged with local defaults in admin API
-- ---------------------------------------------------------------------------
create table if not exists public.feature_flags (
  key                  text primary key,
  enabled              boolean not null default false,
  rollout_percentage   integer not null default 100
    check (rollout_percentage >= 0 and rollout_percentage <= 100),
  updated_at           timestamptz not null default now()
);

create or replace function public.touch_feature_flags_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_feature_flags_updated_at on public.feature_flags;
create trigger trg_feature_flags_updated_at
  before update on public.feature_flags
  for each row
  execute function public.touch_feature_flags_updated_at();

alter table public.feature_flags enable row level security;

drop policy if exists "feature_flags service write"
  on public.feature_flags;
create policy "feature_flags service write"
  on public.feature_flags
  for all
  to service_role
  using (true)
  with check (true);
