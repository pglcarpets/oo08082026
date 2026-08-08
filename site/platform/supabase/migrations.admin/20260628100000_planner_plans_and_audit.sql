-- Active planner persistence (Oando / Drizzle document model on admin Supabase).
-- Legacy CRM public.plans (integer id, document_json) is left unchanged.

create table if not exists public.oando_plans (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.profiles (id) on delete cascade,
  name          text        not null,
  engine        text        not null,
  payload       jsonb       not null default '{}'::jsonb,
  thumbnail_url text,
  status        text        not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.audit_events (
  id          uuid        primary key default gen_random_uuid(),
  team_id     uuid        not null,
  actor_id    uuid        not null,
  action      text        not null,
  target_type text,
  target_id   uuid,
  metadata    jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists oando_plans_user_id_idx on public.oando_plans (user_id);
create index if not exists oando_plans_status_idx on public.oando_plans (status);
create index if not exists oando_plans_created_at_idx on public.oando_plans (created_at);
create index if not exists oando_plans_updated_at_idx on public.oando_plans (updated_at);
create index if not exists oando_plans_user_id_status_idx on public.oando_plans (user_id, status);
create index if not exists oando_plans_user_id_created_at_idx on public.oando_plans (user_id, created_at);
create index if not exists oando_plans_user_id_updated_at_idx on public.oando_plans (user_id, updated_at);

create index if not exists audit_events_team_id_idx on public.audit_events (team_id);
create index if not exists audit_events_actor_id_idx on public.audit_events (actor_id);
create index if not exists audit_events_action_idx on public.audit_events (action);
create index if not exists audit_events_created_at_idx on public.audit_events (created_at);
create index if not exists audit_events_team_id_created_at_idx on public.audit_events (team_id, created_at);

alter table public.oando_plans enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists oando_plans_service_role_all on public.oando_plans;
create policy oando_plans_service_role_all
  on public.oando_plans for all
  to service_role using (true) with check (true);

drop policy if exists audit_events_service_role_all on public.audit_events;
create policy audit_events_service_role_all
  on public.audit_events for all
  to service_role using (true) with check (true);
