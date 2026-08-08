create table if not exists public.product_studio_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  normalized_name text not null check (char_length(normalized_name) between 1 and 120),
  tags text[] not null default '{}',
  fragment jsonb not null,
  schema_version integer not null check (schema_version = 2),
  revision bigint not null default 1 check (revision > 0),
  archived_at timestamptz,
  created_by text not null,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists product_studio_templates_active_name_unique
  on public.product_studio_templates (normalized_name)
  where archived_at is null;

create table if not exists public.product_studio_template_audit (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.product_studio_templates(id),
  revision bigint not null,
  action text not null check (action in ('create', 'update', 'archive', 'restore')),
  snapshot jsonb not null,
  actor_id text not null,
  created_at timestamptz not null default now()
);

alter table public.product_studio_templates enable row level security;
alter table public.product_studio_template_audit enable row level security;
revoke all on public.product_studio_templates from anon, authenticated, service_role;
revoke all on public.product_studio_template_audit from anon, authenticated, service_role;
grant select on public.product_studio_templates to service_role;
grant select on public.product_studio_template_audit to service_role;

create or replace function public.reject_product_studio_template_audit_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'product studio template audit rows are immutable';
end;
$$;

drop trigger if exists product_studio_template_audit_immutable
  on public.product_studio_template_audit;
create trigger product_studio_template_audit_immutable
  before update or delete on public.product_studio_template_audit
  for each row execute function public.reject_product_studio_template_audit_mutation();

create or replace function public.create_product_studio_template(
  p_name text,
  p_normalized_name text,
  p_tags text[],
  p_fragment jsonb,
  p_schema_version integer,
  p_expected_revision bigint,
  p_actor_id text
)
returns table(ok boolean, remote_revision bigint, template jsonb)
language plpgsql security definer set search_path = public
as $$
declare
  next_row public.product_studio_templates%rowtype;
begin
  if p_expected_revision <> 0 or p_schema_version <> 2 then
    return query select false, 0::bigint, null::jsonb;
    return;
  end if;
  insert into public.product_studio_templates
    (name, normalized_name, tags, fragment, schema_version, revision, created_by, updated_by)
  values
    (p_name, p_normalized_name, p_tags, p_fragment, p_schema_version, 1, p_actor_id, p_actor_id)
  returning * into next_row;
  insert into public.product_studio_template_audit
    (template_id, revision, action, snapshot, actor_id)
  values (next_row.id, next_row.revision, 'create', to_jsonb(next_row), p_actor_id);
  return query select true, null::bigint, to_jsonb(next_row);
end;
$$;

create or replace function public.mutate_product_studio_template(
  p_id uuid,
  p_action text,
  p_expected_revision bigint,
  p_actor_id text,
  p_name text default null,
  p_normalized_name text default null,
  p_tags text[] default null
)
returns table(ok boolean, remote_revision bigint, template jsonb)
language plpgsql security definer set search_path = public
as $$
declare
  current_row public.product_studio_templates%rowtype;
  next_row public.product_studio_templates%rowtype;
begin
  if p_action not in ('update', 'archive', 'restore') then
    raise exception 'unsupported template action';
  end if;
  select * into current_row from public.product_studio_templates where id = p_id for update;
  if current_row.id is null then
    return query select false, null::bigint, null::jsonb;
    return;
  end if;
  if current_row.revision <> p_expected_revision then
    return query select false, current_row.revision, null::jsonb;
    return;
  end if;
  update public.product_studio_templates set
    name = case when p_action = 'update' then coalesce(p_name, name) else name end,
    normalized_name = case when p_action = 'update' then coalesce(p_normalized_name, normalized_name) else normalized_name end,
    tags = case when p_action = 'update' then coalesce(p_tags, tags) else tags end,
    archived_at = case
      when p_action = 'archive' then now()
      when p_action = 'restore' then null
      else archived_at
    end,
    revision = revision + 1,
    updated_by = p_actor_id,
    updated_at = now()
  where id = p_id returning * into next_row;
  insert into public.product_studio_template_audit
    (template_id, revision, action, snapshot, actor_id)
  values (next_row.id, next_row.revision, p_action, to_jsonb(next_row), p_actor_id);
  return query select true, null::bigint, to_jsonb(next_row);
end;
$$;

revoke all on function public.create_product_studio_template(
  text, text, text[], jsonb, integer, bigint, text
) from public, anon, authenticated;
grant execute on function public.create_product_studio_template(
  text, text, text[], jsonb, integer, bigint, text
) to service_role;
revoke all on function public.mutate_product_studio_template(
  uuid, text, bigint, text, text, text, text[]
) from public, anon, authenticated;
grant execute on function public.mutate_product_studio_template(
  uuid, text, bigint, text, text, text, text[]
) to service_role;
