create table if not exists public.customer_queries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  source text not null default 'website',
  source_path text,
  name text not null,
  company text,
  email text,
  phone text,
  preferred_contact text not null default 'any'
    check (preferred_contact in ('email', 'whatsapp', 'phone', 'any')),
  message text not null,
  requirement text,
  budget text,
  timeline text,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'closed', 'spam')),
  followup_channel text not null default 'none'
    check (followup_channel in ('email', 'whatsapp', 'phone', 'none')),
  followup_target text,
  followup_notes text
);

create index if not exists customer_queries_status_idx
  on public.customer_queries(status);

create index if not exists customer_queries_created_at_idx
  on public.customer_queries(created_at desc);

create index if not exists customer_queries_email_idx
  on public.customer_queries(email);

create index if not exists customer_queries_phone_idx
  on public.customer_queries(phone);

create or replace function public.touch_customer_queries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists customer_queries_set_updated_at on public.customer_queries;
create trigger customer_queries_set_updated_at
before update on public.customer_queries
for each row execute function public.touch_customer_queries_updated_at();

alter table public.customer_queries enable row level security;

drop policy if exists customer_queries_insert_public on public.customer_queries;
create policy customer_queries_insert_public
on public.customer_queries
for insert
to anon, authenticated
with check (true);

drop policy if exists customer_queries_select_service on public.customer_queries;
create policy customer_queries_select_service
on public.customer_queries
for select
to service_role
using (true);

drop policy if exists customer_queries_update_service on public.customer_queries;
create policy customer_queries_update_service
on public.customer_queries
for update
to service_role
using (true)
with check (true);

-- Add to realtime publication (idempotent — skip if already a member).
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables pub
    where pub.pubname = 'supabase_realtime'
      and pub.schemaname = 'public'
      and pub.tablename = 'customer_queries'
  ) then
    alter publication supabase_realtime add table public.customer_queries;
  end if;
end
$$;
