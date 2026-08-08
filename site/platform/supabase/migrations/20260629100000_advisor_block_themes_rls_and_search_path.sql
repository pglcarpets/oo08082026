-- Advisor fixes (2026-06-28 audit): block_themes RLS + pin search_path on June trigger fns.

-- block_themes: enable RLS (service-role access only; no public policies)
alter table public.block_themes enable row level security;

alter function public.touch_configurator_products_updated_at()
  set search_path = public, pg_temp;

alter function public.touch_feature_flags_updated_at()
  set search_path = public, pg_temp;

alter function public.touch_planner_managed_products_updated_at()
  set search_path = public, pg_temp;
