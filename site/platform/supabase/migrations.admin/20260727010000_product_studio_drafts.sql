create table if not exists public.product_studio_drafts (
  slug text primary key,
  schema_version integer not null,
  revision bigint not null default 0,
  draft jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text not null
);

alter table public.product_studio_drafts enable row level security;

drop policy if exists product_studio_drafts_service_role_all on public.product_studio_drafts;
create policy product_studio_drafts_service_role_all
  on public.product_studio_drafts for all
  to service_role using (true) with check (true);

create or replace function public.save_product_studio_draft(
  p_slug text,
  p_schema_version integer,
  p_draft jsonb,
  p_expected_revision bigint,
  p_updated_by text
)
returns table(ok boolean, revision bigint, saved_at timestamptz, remote_revision bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_revision bigint;
begin
  select d.revision into current_revision
  from public.product_studio_drafts d
  where d.slug = p_slug
  for update;

  if current_revision is null then
    if p_expected_revision <> 0 then
      return query select false, null::bigint, null::timestamptz, 0::bigint;
      return;
    end if;
    insert into public.product_studio_drafts (slug, schema_version, revision, draft, updated_by)
    values (p_slug, p_schema_version, 1, p_draft, p_updated_by)
    returning product_studio_drafts.revision, product_studio_drafts.updated_at into revision, saved_at;
    return query select true, revision, saved_at, null::bigint;
    return;
  end if;

  if current_revision <> p_expected_revision then
    return query select false, null::bigint, null::timestamptz, current_revision;
    return;
  end if;

  update public.product_studio_drafts
  set schema_version = p_schema_version,
      revision = current_revision + 1,
      draft = p_draft,
      updated_at = now(),
      updated_by = p_updated_by
  where product_studio_drafts.slug = p_slug
  returning product_studio_drafts.revision, product_studio_drafts.updated_at into revision, saved_at;
  return query select true, revision, saved_at, null::bigint;
end;
$$;

revoke all on function public.save_product_studio_draft(text, integer, jsonb, bigint, text) from public;
grant execute on function public.save_product_studio_draft(text, integer, jsonb, bigint, text) to service_role;
