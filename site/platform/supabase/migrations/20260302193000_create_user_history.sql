create table if not exists public.user_history (
  user_id text primary key,
  viewed_products text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_history_updated_at_idx
  on public.user_history(updated_at desc);

create index if not exists user_history_viewed_products_gin_idx
  on public.user_history using gin (viewed_products);

create or replace function public.touch_user_history_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists user_history_set_updated_at on public.user_history;
create trigger user_history_set_updated_at
before update on public.user_history
for each row execute function public.touch_user_history_updated_at();

alter table public.user_history enable row level security;

drop policy if exists user_history_select_service on public.user_history;
create policy user_history_select_service
on public.user_history
for select
to service_role
using (true);

drop policy if exists user_history_insert_service on public.user_history;
create policy user_history_insert_service
on public.user_history
for insert
to service_role
with check (true);

drop policy if exists user_history_update_service on public.user_history;
create policy user_history_update_service
on public.user_history
for update
to service_role
using (true)
with check (true);
