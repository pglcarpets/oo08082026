-- Seed Port 04 sketchToPlan feature flag (products DB). Idempotent.
insert into public.feature_flags (key, enabled, rollout_percentage, description, module_group)
values (
  'sketchToPlan',
  true,
  100,
  'Port 04 — sketch image to walls/rooms',
  'AI'
)
on conflict (key) do update
  set
    description = excluded.description,
    module_group = excluded.module_group,
    updated_at = now();

-- rollback:
-- delete from public.feature_flags where key = 'sketchToPlan';
