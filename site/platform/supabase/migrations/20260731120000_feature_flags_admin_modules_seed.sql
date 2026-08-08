-- Products / primary Supabase: ensure feature_flags exists and seed Port + admin keys.
-- Mirrors admin migration seed so either project can host overrides for /api/admin/features.
-- Idempotent.

create table if not exists public.feature_flags (
  key                  text primary key,
  enabled              boolean not null default false,
  rollout_percentage   integer not null default 100
    check (rollout_percentage >= 0 and rollout_percentage <= 100),
  description          text not null default '',
  module_group         text not null default 'general',
  updated_at           timestamptz not null default now()
);

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

insert into public.feature_flags (key, enabled, rollout_percentage, description, module_group)
values
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
  ('planner2D', true, 100, '2D floor-plan canvas', 'Planner core'),
  ('planner3D', true, 100, '3D preview panel', 'Planner core'),
  ('catalogSidebar', true, 100, 'Furniture catalog rail', 'Planner core'),
  ('layersPanel', true, 100, 'Layers dock panel', 'Planner core'),
  ('measurementTool', true, 100, 'Dimension / measure tool', 'Planner core'),
  ('snapToGrid', true, 100, 'Grid snapping', 'Planner core'),
  ('plannerAdvancedSnap', true, 100, 'Port 01 — advanced snap', 'Port 01 · Geometry & trust'),
  ('snapToWall', true, 100, 'Port 01 — snap to wall centreline', 'Port 01 · Geometry & trust'),
  ('plannerValidationPanel', true, 100, 'Port 01 — layout validation', 'Port 01 · Geometry & trust'),
  ('plannerWallGrips', true, 100, 'Port 01 — wall endpoint grips', 'Port 01 · Geometry & trust'),
  ('plannerOpeningPlacement', true, 100, 'Port 01 — doors/windows on walls', 'Port 01 · Geometry & trust'),
  ('plannerDistanceGuides', true, 100, 'Port 01 — distance guides', 'Port 01 · Geometry & trust'),
  ('plannerAlignDistribute', true, 100, 'Port 01 — align/distribute', 'Port 01 · Geometry & trust'),
  ('plannerBoqPanel', true, 100, 'Port 02 — BOQ panel', 'Port 02 · Commercial'),
  ('boqPricingEnabled', false, 100, 'Port 02 — BOQ unit prices', 'Port 02 · Commercial'),
  ('plannerExportBoq', true, 100, 'Port 02 — BOQ CSV/JSON export', 'Port 02 · Commercial'),
  ('plannerHandoff', true, 100, 'Port 02 — planner → CRM handoff', 'Port 02 · Commercial'),
  ('plannerUnderlay', true, 100, 'Port 02 — floor underlay', 'Port 02 · Commercial'),
  ('floorPlanImport', true, 100, 'Port 02 — import floor-plan image', 'Port 02 · Commercial'),
  ('studioExportSvg', true, 100, 'Port 03 — Studio export SVG', 'Port 03 · Studio catalog'),
  ('studioExportJson', true, 100, 'Port 03 — Studio export JSON', 'Port 03 · Studio catalog'),
  ('studioExportPng', true, 100, 'Port 03 — Studio export PNG', 'Port 03 · Studio catalog'),
  ('studioExportJpg', true, 100, 'Port 03 — Studio export JPG', 'Port 03 · Studio catalog'),
  ('studioExportDxf', true, 100, 'Port 03 — Studio export DXF', 'Port 03 · Studio catalog'),
  ('studioImportFiles', true, 100, 'Port 03 — Studio import files', 'Port 03 · Studio catalog'),
  ('studioPublishCatalog', true, 100, 'Port 03 — publish to catalog', 'Port 03 · Studio catalog'),
  ('studioCatalogLifecycle', false, 100, 'Port 03 — draft/live/retired', 'Port 03 · Studio catalog'),
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

-- rollback:
-- drop trigger if exists trg_feature_flags_updated_at on public.feature_flags;
-- drop function if exists public.touch_feature_flags_updated_at();
-- drop table if exists public.feature_flags;
