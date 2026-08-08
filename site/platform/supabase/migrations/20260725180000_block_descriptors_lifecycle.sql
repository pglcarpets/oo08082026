-- Phase 5 D5: buyer visibility under db authority must not depend on a disk
-- lifecycle manifest. Lifecycle lives on the release record itself.
alter table public.block_descriptors
  add column if not exists lifecycle text
    not null default 'live'
    check (lifecycle in ('live', 'draft', 'retired'));

create index if not exists block_descriptors_lifecycle_idx
  on public.block_descriptors (lifecycle);
