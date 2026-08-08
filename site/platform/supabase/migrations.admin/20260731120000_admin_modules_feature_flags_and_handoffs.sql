-- Admin modules + feature-flag seed + planner handoffs (admin Supabase).
-- Supports /admin/* module gating and Port 01–04 commercial handoff persistence.
-- Idempotent: safe to re-apply.

-- ---------------------------------------------------------------------------
-- feature_flags — admin-owned overrides (same shape as products DB seed)
-- ---------------------------------------------------------------------------
create table if not exists public.feature_flags (
  key                  text primary key,
  enabled              boolean not null default false,
  rollout_percentage   integer not null default 100
    check (rollout_percentage >= 0 and rollout_percentage <= 100),
  description          text not null default '',
  module_group         text not null default 'general',
  updated_at           timestamptz not null default now()
);

-- Additive columns when table already existed without them
alter table public.feature_flags
  add column if not exists description text not null default '';
alter table public.feature_flags
  add column if not exists module_group text not null default 'general';

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

drop policy if exists "feature_flags service write" on public.feature_flags;
create policy "feature_flags service write"
  on public.feature_flags
  for all
  to service_role
  using (true)
  with check (true);

-- Authenticated admins may read flags (UI /api/features merge still uses service role)
drop policy if exists "feature_flags authenticated read" on public.feature_flags;
create policy "feature_flags authenticated read"
  on public.feature_flags
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- admin_modules — registry of console modules (nav / enable matrix)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_modules (
  id            text primary key,
  label         text not null,
  description   text not null default '',
  href          text not null,
  flag_key      text not null references public.feature_flags (key) on delete restrict,
  nav_group     text not null default 'System',
  sort_order    integer not null default 100,
  enabled       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists admin_modules_nav_group_idx
  on public.admin_modules (nav_group, sort_order);
create index if not exists admin_modules_flag_key_idx
  on public.admin_modules (flag_key);

alter table public.admin_modules enable row level security;

drop policy if exists "admin_modules service write" on public.admin_modules;
create policy "admin_modules service write"
  on public.admin_modules
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "admin_modules authenticated read" on public.admin_modules;
create policy "admin_modules authenticated read"
  on public.admin_modules
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- planner_handoffs — BOQ handoff records (Port 02)
-- ---------------------------------------------------------------------------
create table if not exists public.planner_handoffs (
  id                 uuid primary key default gen_random_uuid(),
  reference_id       text not null,
  idempotency_key    text not null,
  project_id         text not null default '',
  project_name       text not null default '',
  calculation_hash   text not null default '',
  contact            jsonb not null default '{}'::jsonb,
  boq                jsonb not null default '{}'::jsonb,
  project_notes      text,
  status             text not null default 'new'
    check (status in ('new', 'acknowledged', 'quoted', 'closed')),
  created_by         uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint planner_handoffs_reference_id_key unique (reference_id),
  constraint planner_handoffs_idempotency_key_key unique (idempotency_key)
);

create index if not exists planner_handoffs_status_idx
  on public.planner_handoffs (status);
create index if not exists planner_handoffs_created_at_idx
  on public.planner_handoffs (created_at desc);
create index if not exists planner_handoffs_project_id_idx
  on public.planner_handoffs (project_id);

alter table public.planner_handoffs enable row level security;

drop policy if exists "planner_handoffs service write" on public.planner_handoffs;
create policy "planner_handoffs service write"
  on public.planner_handoffs
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "planner_handoffs authenticated insert" on public.planner_handoffs;
create policy "planner_handoffs authenticated insert"
  on public.planner_handoffs
  for insert
  to authenticated
  with check (true);

drop policy if exists "planner_handoffs authenticated read own" on public.planner_handoffs;
create policy "planner_handoffs authenticated read own"
  on public.planner_handoffs
  for select
  to authenticated
  using (created_by is null or created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- Seed feature_flags for all admin modules + Port 01–04 keys
-- ON CONFLICT DO NOTHING preserves operator overrides already stored
-- ---------------------------------------------------------------------------
insert into public.feature_flags (key, enabled, rollout_percentage, description, module_group)
values
  -- Admin modules
  ('adminPlans', true, 100, 'Admin · Plans', 'Admin modules'),
  ('adminCatalog', true, 100, 'Admin · Products catalog', 'Admin modules'),
  ('adminConfiguratorCatalog', true, 100, 'Admin · Configurator catalog', 'Admin modules'),
  ('adminWorkspaceCatalog', true, 100, 'Admin · Workspace library', 'Admin modules'),
  ('adminFurnitureStudio', true, 100, 'Admin · Furniture Studio link', 'Admin modules'),
  ('adminPriceBooks', true, 100, 'Admin · Price books', 'Admin modules'),
  ('adminAnalytics', true, 100, 'Admin · Analytics', 'Admin modules'),
  ('adminCrm', true, 100, 'Admin · CRM hub', 'Admin modules'),
  ('adminCustomerQueries', true, 100, 'Admin · Customer queries', 'Admin modules'),
  ('adminThemes', true, 100, 'Admin · Themes', 'Admin modules'),
  ('adminSettings', true, 100, 'Admin · Settings', 'Admin modules'),
  ('adminDesignKit', true, 100, 'Admin · Design kit', 'Admin modules'),
  ('adminInventory', true, 100, 'Admin · Routes inventory', 'Admin modules'),
  ('adminFeatureToggle', true, 100, 'Admin · Feature flags page', 'Admin modules'),

  -- Planner core
  ('planner2D', true, 100, '2D floor-plan canvas', 'Planner core'),
  ('planner3D', true, 100, '3D preview panel', 'Planner core'),
  ('catalogSidebar', true, 100, 'Furniture catalog rail', 'Planner core'),
  ('layersPanel', true, 100, 'Layers dock panel', 'Planner core'),
  ('measurementTool', true, 100, 'Dimension / measure tool', 'Planner core'),
  ('snapToGrid', true, 100, 'Grid snapping', 'Planner core'),

  -- Port 01
  ('plannerAdvancedSnap', true, 100, 'Port 01 — advanced snap', 'Port 01 · Geometry & trust'),
  ('snapToWall', true, 100, 'Port 01 — snap to wall centreline', 'Port 01 · Geometry & trust'),
  ('plannerValidationPanel', true, 100, 'Port 01 — layout validation', 'Port 01 · Geometry & trust'),
  ('plannerWallGrips', true, 100, 'Port 01 — wall endpoint grips', 'Port 01 · Geometry & trust'),
  ('plannerOpeningPlacement', true, 100, 'Port 01 — doors/windows on walls', 'Port 01 · Geometry & trust'),
  ('plannerDistanceGuides', true, 100, 'Port 01 — distance guides', 'Port 01 · Geometry & trust'),
  ('plannerAlignDistribute', true, 100, 'Port 01 — align/distribute', 'Port 01 · Geometry & trust'),

  -- Port 02
  ('plannerBoqPanel', true, 100, 'Port 02 — BOQ panel', 'Port 02 · Commercial'),
  ('boqPricingEnabled', false, 100, 'Port 02 — BOQ unit prices', 'Port 02 · Commercial'),
  ('plannerExportBoq', true, 100, 'Port 02 — BOQ CSV/JSON export', 'Port 02 · Commercial'),
  ('plannerHandoff', true, 100, 'Port 02 — planner → CRM handoff', 'Port 02 · Commercial'),
  ('plannerUnderlay', true, 100, 'Port 02 — floor underlay', 'Port 02 · Commercial'),
  ('floorPlanImport', true, 100, 'Port 02 — import floor-plan image', 'Port 02 · Commercial'),

  -- Port 03
  ('studioExportSvg', true, 100, 'Port 03 — Studio export SVG', 'Port 03 · Studio catalog'),
  ('studioExportJson', true, 100, 'Port 03 — Studio export JSON', 'Port 03 · Studio catalog'),
  ('studioExportPng', true, 100, 'Port 03 — Studio export PNG', 'Port 03 · Studio catalog'),
  ('studioExportJpg', true, 100, 'Port 03 — Studio export JPG', 'Port 03 · Studio catalog'),
  ('studioExportDxf', true, 100, 'Port 03 — Studio export DXF', 'Port 03 · Studio catalog'),
  ('studioImportFiles', true, 100, 'Port 03 — Studio import files', 'Port 03 · Studio catalog'),
  ('studioPublishCatalog', true, 100, 'Port 03 — publish to catalog', 'Port 03 · Studio catalog'),
  ('studioCatalogLifecycle', false, 100, 'Port 03 — draft/live/retired', 'Port 03 · Studio catalog'),

  -- Exports / AI / Sync
  ('plannerExportPdf', true, 100, 'Planner PDF export', 'Planner exports'),
  ('plannerExportPng', true, 100, 'Planner PNG export', 'Planner exports'),
  ('plannerExportSvg', true, 100, 'Planner SVG export', 'Planner exports'),
  ('plannerExportDxf', false, 100, 'Planner DXF export', 'Planner exports'),
  ('plannerAiAdvisor', true, 100, 'Planner AI advisor panel', 'AI'),
  ('plannerAiSpaceSuggest', true, 100, 'Port 04 — AI space-suggest', 'AI'),
  ('sketchToPlan', true, 100, 'Port 04 — sketch image to walls/rooms', 'AI'),
  ('siteAiAdvisor', false, 100, 'Marketing site AI advisor', 'AI'),
  ('plannerCloudSync', true, 100, 'Disk / cloud project sync', 'Sync'),
  ('plannerGuestWorkspace', true, 100, 'Guest workspace entry', 'Sync')
on conflict (key) do update
  set
    description = excluded.description,
    module_group = excluded.module_group,
    updated_at = now();
-- Note: enabled is NOT overwritten on conflict — preserves operator toggles.

-- ---------------------------------------------------------------------------
-- Seed admin_modules registry (links nav href → flag)
-- ---------------------------------------------------------------------------
insert into public.admin_modules (id, label, description, href, flag_key, nav_group, sort_order, enabled)
values
  ('plans', 'Plans', 'Saved planner documents', '/admin/plans', 'adminPlans', 'Planner', 10, true),
  ('features', 'Features', 'Toolbar and capability toggles', '/admin/features', 'adminFeatureToggle', 'Planner', 20, true),
  ('analytics', 'Analytics', 'Usage volume and export activity', '/admin/analytics', 'adminAnalytics', 'Planner', 30, true),
  ('catalog', 'Products', 'Editable managed products', '/admin/catalog', 'adminCatalog', 'Catalog', 10, true),
  ('planner-catalog', 'Configurator', 'Parametric and discrete SKUs', '/admin/planner-catalog', 'adminConfiguratorCatalog', 'Catalog', 20, true),
  ('workspace-catalog', 'Library', 'Read-only static workspace elements', '/admin/workspace-catalog', 'adminWorkspaceCatalog', 'Catalog', 30, true),
  ('furniture-studio', 'Furniture Studio', 'Draw & export catalog furniture', '/oostudio', 'adminFurnitureStudio', 'Catalog', 40, true),
  ('price-books', 'Prices', 'BOQ price books draft → activate', '/admin/price-books', 'adminPriceBooks', 'Catalog', 50, true),
  ('crm', 'CRM Hub', 'Pipeline overview', '/admin/crm', 'adminCrm', 'CRM', 10, true),
  ('customer-queries', 'Queries', 'Server-backed inbound queue', '/admin/customer-queries', 'adminCustomerQueries', 'CRM', 50, true),
  ('settings', 'Settings', 'Canvas bounds and flags', '/admin/settings', 'adminSettings', 'System', 10, true),
  ('themes', 'Themes', 'Planner material tokens', '/admin/themes', 'adminThemes', 'System', 20, true),
  ('inventory', 'Routes', 'App pages and API map', '/admin/inventory', 'adminInventory', 'System', 30, true),
  ('design-kit', 'Design kit', 'Living visual contract', '/admin/design-kit', 'adminDesignKit', 'System', 40, true)
on conflict (id) do update
  set
    label = excluded.label,
    description = excluded.description,
    href = excluded.href,
    flag_key = excluded.flag_key,
    nav_group = excluded.nav_group,
    sort_order = excluded.sort_order,
    updated_at = now();

-- rollback:
-- drop table if exists public.planner_handoffs;
-- drop table if exists public.admin_modules;
-- drop trigger if exists trg_feature_flags_updated_at on public.feature_flags;
-- drop function if exists public.touch_feature_flags_updated_at();
-- drop table if exists public.feature_flags;
