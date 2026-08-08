-- Tier 1 + Tier 2: Enable RLS on every public table and add baseline policies.
--
-- Strategy:
--   * service_role bypasses RLS automatically, so every backend route using
--     createSupabaseAdminClient() (which uses SUPABASE_SERVICE_ROLE_KEY)
--     keeps full access regardless of policies. Verified.
--
--   * Catalog tables already had public-read policies but RLS was disabled.
--     We just turn RLS on (Tier 2 fix). The existing policies become active.
--
--   * Private tables (clients, quotes, projects, team_members, etc.) get
--     RLS enabled with NO policies for non-service roles. Anon clients
--     get nothing. Authenticated users get nothing for now (the frontend
--     for these features doesn't exist yet). We'll tighten per-user
--     policies when those features ship.
--
--   * customer_queries already has a public-insert policy + service-role
--     read/write policies. Just enable RLS.
--
--   * business_stats_* are public-read (they power site stats). Policies
--     already exist; just enable RLS.
--
--   * user_history has service-role policies but is also written via
--     the app for tracking. Keeps service-role-only access since the
--     tracking route uses the admin client.
--
--   * Catalog views (products, product_images, etc.) are SECURITY INVOKER
--     by default and execute with the caller's privileges, so they
--     transparently respect the underlying tables' RLS. No change needed.

-- =================================================================
-- Tier 2: Tables with existing policies that just need RLS enabled
-- =================================================================
alter table public.catalog_product_images enable row level security;
alter table public.catalog_product_specs  enable row level security;

-- =================================================================
-- Tier 1: Catalog (public read, service-role write)
-- =================================================================
alter table public.catalog_categories                enable row level security;
alter table public.catalog_products                  enable row level security;
alter table public.catalog_product_slug_aliases      enable row level security;

-- catalog_items has no existing policy; add public read + service write.
alter table public.catalog_items enable row level security;

drop policy if exists "catalog_items_public_read" on public.catalog_items;
create policy "catalog_items_public_read"
  on public.catalog_items
  for select
  to anon, authenticated
  using (true);

drop policy if exists "catalog_items_service_write" on public.catalog_items;
create policy "catalog_items_service_write"
  on public.catalog_items
  for all
  to service_role
  using (true)
  with check (true);

-- series & templates: public read (catalog references them), service write.
alter table public.series    enable row level security;
alter table public.templates enable row level security;

drop policy if exists "series_public_read" on public.series;
create policy "series_public_read"
  on public.series
  for select
  to anon, authenticated
  using (true);

drop policy if exists "series_service_write" on public.series;
create policy "series_service_write"
  on public.series
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "templates_public_read" on public.templates;
create policy "templates_public_read"
  on public.templates
  for select
  to anon, authenticated
  using (true);

drop policy if exists "templates_service_write" on public.templates;
create policy "templates_service_write"
  on public.templates
  for all
  to service_role
  using (true)
  with check (true);

-- =================================================================
-- Tier 1: Stats (public read, service write — already has policies,
-- just enable RLS)
-- =================================================================
alter table public.business_stats_current enable row level security;
alter table public.business_stats_history enable row level security;

-- =================================================================
-- Tier 1: Customer queries (already has public insert + service r/w)
-- =================================================================
alter table public.customer_queries enable row level security;

-- =================================================================
-- Tier 1: Private tables — service-role only.
-- All currently empty (or accessed only by backend admin client).
-- Policies for end-user access will be added when those features ship.
-- =================================================================
alter table public.clients         enable row level security;
alter table public.quotes          enable row level security;
alter table public.projects        enable row level security;
alter table public.profiles        enable row level security;
alter table public.users           enable row level security;
alter table public.user_history    enable row level security;

alter table public.team_members    enable row level security;
alter table public.teams           enable row level security;
alter table public.invites         enable row level security;
alter table public.offices         enable row level security;

alter table public.plans           enable row level security;
alter table public.plan_versions   enable row level security;
alter table public.plan_comments   enable row level security;
alter table public.plan_shares     enable row level security;

-- For each, grant service_role full access (defense in depth — service_role
-- bypasses RLS already, but explicit policy makes intent clear and avoids
-- surprises if BYPASSRLS is ever revoked).
do $$
declare
  t text;
  private_tables text[] := array[
    'clients','quotes','projects','profiles','users','user_history',
    'team_members','teams','invites','offices',
    'plans','plan_versions','plan_comments','plan_shares'
  ];
begin
  foreach t in array private_tables loop
    execute format(
      'drop policy if exists %I on public.%I',
      t || '_service_role_all',
      t
    );
    execute format(
      'create policy %I on public.%I for all to service_role using (true) with check (true)',
      t || '_service_role_all',
      t
    );
  end loop;
end$$;
