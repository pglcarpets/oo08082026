create table if not exists public.workspace_editor_configs (
  id uuid primary key default gen_random_uuid(),
  workspace text not null check (workspace in ('product-studio', 'planner')),
  profile_key text not null,
  schema_version integer not null,
  revision bigint not null default 0,
  active boolean not null default false,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text not null,
  unique (workspace, profile_key)
);

create unique index if not exists workspace_editor_configs_one_active
  on public.workspace_editor_configs (workspace)
  where active;

create table if not exists public.workspace_editor_config_audit (
  id uuid primary key default gen_random_uuid(),
  config_id uuid not null references public.workspace_editor_configs(id),
  workspace text not null,
  profile_key text not null,
  revision bigint not null,
  action text not null check (action in ('create', 'update', 'activate', 'reset')),
  payload jsonb not null,
  actor_id text not null,
  created_at timestamptz not null default now()
);

alter table public.workspace_editor_configs enable row level security;
alter table public.workspace_editor_config_audit enable row level security;
revoke all on public.workspace_editor_configs from anon, authenticated;
revoke all on public.workspace_editor_config_audit from anon, authenticated;
grant select, insert, update, delete on public.workspace_editor_configs to service_role;
grant select, insert on public.workspace_editor_config_audit to service_role;

create or replace function public.reject_workspace_editor_config_audit_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'workspace editor configuration audit rows are immutable';
end;
$$;

drop trigger if exists workspace_editor_config_audit_immutable
  on public.workspace_editor_config_audit;
create trigger workspace_editor_config_audit_immutable
  before update or delete on public.workspace_editor_config_audit
  for each row execute function public.reject_workspace_editor_config_audit_mutation();

create or replace function public.mutate_workspace_editor_configuration(
  p_action text,
  p_workspace text,
  p_profile_key text,
  p_expected_revision bigint,
  p_actor_id text,
  p_schema_version integer default null,
  p_payload jsonb default null,
  p_active boolean default null
)
returns table(ok boolean, remote_revision bigint, configuration jsonb)
language plpgsql security definer set search_path = public
as $$
declare
  current_row public.workspace_editor_configs%rowtype;
  next_row public.workspace_editor_configs%rowtype;
  initial_payload jsonb;
  audit_action text;
begin
  if p_action not in ('upsert', 'activate', 'reset') then
    raise exception 'unsupported configuration action';
  end if;

  select * into current_row from public.workspace_editor_configs
    where workspace = p_workspace and profile_key = p_profile_key for update;

  if current_row.id is null then
    if p_action <> 'upsert' or p_expected_revision <> 0
      or p_schema_version is null or p_payload is null then
      return query select false, 0::bigint, null::jsonb;
      return;
    end if;
    if coalesce(p_active, false) then
      update public.workspace_editor_configs set active = false where workspace = p_workspace;
    end if;
    insert into public.workspace_editor_configs
      (workspace, profile_key, schema_version, revision, active, payload, updated_by)
    values
      (p_workspace, p_profile_key, p_schema_version, 1, coalesce(p_active, false), p_payload, p_actor_id)
    returning * into next_row;
    audit_action := 'create';
  else
    if current_row.revision <> p_expected_revision then
      return query select false, current_row.revision, null::jsonb;
      return;
    end if;
    if p_action = 'reset' then
      select a.payload into initial_payload
        from public.workspace_editor_config_audit a
        where a.config_id = current_row.id and a.action = 'create'
        order by a.created_at asc limit 1;
      if initial_payload is null then raise exception 'initial configuration audit is missing'; end if;
    end if;
    if p_action = 'activate' or coalesce(p_active, false) then
      update public.workspace_editor_configs set active = false
        where workspace = p_workspace and id <> current_row.id;
    end if;
    update public.workspace_editor_configs set
      schema_version = coalesce(p_schema_version, schema_version),
      revision = revision + 1,
      active = case when p_action = 'activate' then true else coalesce(p_active, active) end,
      payload = case when p_action = 'reset' then initial_payload else coalesce(p_payload, payload) end,
      updated_at = now(),
      updated_by = p_actor_id
      where id = current_row.id returning * into next_row;
    audit_action := case when p_action = 'upsert' then 'update' else p_action end;
  end if;

  insert into public.workspace_editor_config_audit
    (config_id, workspace, profile_key, revision, action, payload, actor_id)
  values
    (next_row.id, next_row.workspace, next_row.profile_key, next_row.revision,
     audit_action, next_row.payload, p_actor_id);
  return query select true, null::bigint, to_jsonb(next_row);
end;
$$;

revoke all on function public.mutate_workspace_editor_configuration(
  text, text, text, bigint, text, integer, jsonb, boolean
) from public, anon, authenticated;
grant execute on function public.mutate_workspace_editor_configuration(
  text, text, text, bigint, text, integer, jsonb, boolean
) to service_role;
