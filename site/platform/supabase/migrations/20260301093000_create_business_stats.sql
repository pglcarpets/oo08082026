create extension if not exists pgcrypto;

create table if not exists public.business_stats_current (
  id uuid primary key default gen_random_uuid(),
  is_active boolean not null default true,
  projects_delivered int not null check (projects_delivered >= 0),
  client_organisations int not null check (client_organisations >= 0),
  sectors_served int not null check (sectors_served >= 0),
  locations_served int not null check (locations_served >= 0),
  years_experience int not null check (years_experience >= 0),
  as_of_date date not null,
  source_note text,
  updated_at timestamptz not null default now(),
  updated_by text
);

create unique index if not exists business_stats_single_active_idx
  on public.business_stats_current (is_active)
  where is_active = true;

create table if not exists public.business_stats_history (
  history_id uuid primary key default gen_random_uuid(),
  business_stats_id uuid not null,
  projects_delivered int not null,
  client_organisations int not null,
  sectors_served int not null,
  locations_served int not null,
  years_experience int not null,
  as_of_date date not null,
  source_note text,
  updated_at timestamptz not null,
  updated_by text,
  changed_at timestamptz not null default now()
);

create or replace function public.capture_business_stats_history()
returns trigger
language plpgsql
as $$
begin
  insert into public.business_stats_history (
    business_stats_id,
    projects_delivered,
    client_organisations,
    sectors_served,
    locations_served,
    years_experience,
    as_of_date,
    source_note,
    updated_at,
    updated_by
  )
  values (
    old.id,
    old.projects_delivered,
    old.client_organisations,
    old.sectors_served,
    old.locations_served,
    old.years_experience,
    old.as_of_date,
    old.source_note,
    old.updated_at,
    old.updated_by
  );

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists business_stats_history_trigger on public.business_stats_current;
create trigger business_stats_history_trigger
before update on public.business_stats_current
for each row
execute function public.capture_business_stats_history();

alter table public.business_stats_current enable row level security;
alter table public.business_stats_history enable row level security;

drop policy if exists business_stats_select_all on public.business_stats_current;
create policy business_stats_select_all
on public.business_stats_current
for select
to anon, authenticated
using (true);

drop policy if exists business_stats_history_select_all on public.business_stats_history;
create policy business_stats_history_select_all
on public.business_stats_history
for select
to anon, authenticated
using (true);

drop policy if exists business_stats_service_write on public.business_stats_current;
create policy business_stats_service_write
on public.business_stats_current
for all
to service_role
using (true)
with check (true);

drop policy if exists business_stats_history_service_write on public.business_stats_history;
create policy business_stats_history_service_write
on public.business_stats_history
for all
to service_role
using (true)
with check (true);

insert into public.business_stats_current (
  is_active,
  projects_delivered,
  client_organisations,
  sectors_served,
  locations_served,
  years_experience,
  as_of_date,
  source_note,
  updated_by
)
select
  true,
  259,
  120,
  18,
  20,
  15,
  current_date,
  'Seeded from existing website values',
  'migration:20260301093000'
where not exists (
  select 1 from public.business_stats_current where is_active = true
);
