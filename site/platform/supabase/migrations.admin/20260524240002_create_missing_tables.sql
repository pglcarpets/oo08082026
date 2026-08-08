-- Admin DB additions: create the tables admin owns under the new split
-- but doesn't have yet (DDL copied from oando).

-- user_history (tracking, recommendations, ai-advisor)
create table if not exists public.user_history (
  user_id     text                                              not null,
  viewed_products text[]   default '{}'::text[]                  not null,
  created_at  timestamptz default timezone('utc'::text, now())   not null,
  updated_at  timestamptz default timezone('utc'::text, now())   not null,
  primary key (user_id)
);

-- customer_queries (contact form submissions / CRM-ish)
create table if not exists public.customer_queries (
  id                uuid        default gen_random_uuid()                  not null,
  created_at        timestamptz default timezone('utc'::text, now())       not null,
  updated_at        timestamptz default timezone('utc'::text, now())       not null,
  source            text        default 'website'::text                    not null,
  source_path       text,
  name              text                                                   not null,
  company           text,
  email             text,
  phone             text,
  preferred_contact text        default 'any'::text                        not null,
  message           text                                                   not null,
  requirement       text,
  budget            text,
  timeline          text,
  status            text        default 'new'::text                        not null,
  followup_channel  text        default 'none'::text                       not null,
  followup_target   text,
  followup_notes    text,
  primary key (id)
);

-- profiles (Supabase Auth profile extension)
create table if not exists public.profiles (
  id           uuid        not null,
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now(),
  primary key (id)
);

-- teams
create table if not exists public.teams (
  id         uuid        default gen_random_uuid() not null,
  name       text                                  not null,
  slug       text                                  not null,
  created_at timestamptz default now(),
  primary key (id),
  unique (slug)
);

-- team_members
create table if not exists public.team_members (
  team_id   uuid                                not null,
  user_id   uuid                                not null,
  role      text        default 'member'::text,
  joined_at timestamptz default now(),
  primary key (team_id, user_id)
);

-- invites
create table if not exists public.invites (
  id          uuid        default gen_random_uuid()                                 not null,
  team_id     uuid,
  email       text                                                                  not null,
  token       text        default encode(gen_random_bytes(32), 'hex'::text)         not null,
  role        text        default 'member'::text,
  expires_at  timestamptz default (now() + '7 days'::interval),
  accepted_at timestamptz,
  primary key (id),
  unique (token)
);

-- offices
create table if not exists public.offices (
  id             uuid        default gen_random_uuid() not null,
  team_id        uuid,
  name           text                                  not null,
  slug           text                                  not null,
  payload        jsonb       default '{}'::jsonb,
  tldraw_payload jsonb       default '{}'::jsonb,
  draft_payload  jsonb       default '{}'::jsonb,
  zone_graph     jsonb       default '{}'::jsonb,
  babylon_config jsonb       default '{}'::jsonb,
  floor_count    integer     default 1,
  updated_at     timestamptz default now(),
  created_by     uuid,
  primary key (id),
  unique (team_id, slug)
);

-- Foreign keys (only where the parent exists on this DB)
alter table public.team_members
  add constraint team_members_team_id_fkey
  foreign key (team_id) references public.teams(id) on delete cascade;

alter table public.invites
  add constraint invites_team_id_fkey
  foreign key (team_id) references public.teams(id) on delete cascade;

alter table public.offices
  add constraint offices_team_id_fkey
  foreign key (team_id) references public.teams(id) on delete cascade;

-- Cover FKs with btree indexes
create index if not exists team_members_team_id_idx on public.team_members (team_id);
create index if not exists team_members_user_id_idx on public.team_members (user_id);
create index if not exists invites_team_id_idx      on public.invites (team_id);
create index if not exists offices_team_id_idx      on public.offices (team_id);
create index if not exists offices_created_by_idx   on public.offices (created_by);
create index if not exists user_history_user_id_idx on public.user_history (user_id);
create index if not exists customer_queries_email_idx on public.customer_queries (email);
create index if not exists customer_queries_created_at_idx on public.customer_queries (created_at desc);

-- RLS: enable on all new tables (admin DB convention).
alter table public.user_history     enable row level security;
alter table public.customer_queries enable row level security;
alter table public.profiles         enable row level security;
alter table public.teams            enable row level security;
alter table public.team_members     enable row level security;
alter table public.invites          enable row level security;
alter table public.offices          enable row level security;

-- customer_queries: anonymous public can submit (insert), service-role can manage.
drop policy if exists "customer_queries_insert_public" on public.customer_queries;
create policy "customer_queries_insert_public"
  on public.customer_queries for insert
  to anon, authenticated
  with check (true);

drop policy if exists "customer_queries_service_all" on public.customer_queries;
create policy "customer_queries_service_all"
  on public.customer_queries for all
  to service_role using (true) with check (true);

-- All other private tables: service-role only.
do $$
declare
  t text;
  private_tables text[] := array['user_history','profiles','teams','team_members','invites','offices'];
begin
  foreach t in array private_tables loop
    execute format(
      'drop policy if exists %I on public.%I',
      t || '_service_role_all', t
    );
    execute format(
      'create policy %I on public.%I for all to service_role using (true) with check (true)',
      t || '_service_role_all', t
    );
  end loop;
end$$;
