-- Admin P05 — versioned price books (immutable released versions; Buyer P04 fixture source).

create table if not exists public.price_books (
  id                 uuid        primary key default gen_random_uuid(),
  family_slug        text        not null,
  book_id            text        not null,
  active_version_id  text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint price_books_book_id_key unique (book_id)
);

create table if not exists public.price_book_versions (
  id              uuid        primary key default gen_random_uuid(),
  book_row_id     uuid        not null references public.price_books (id) on delete cascade,
  version_id      text        not null,
  effective_from  date        not null,
  currency        text        not null,
  status          text        not null default 'draft',
  rules           jsonb       not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  constraint price_book_versions_book_version_key unique (book_row_id, version_id)
);

create index if not exists price_books_family_slug_idx on public.price_books (family_slug);
create index if not exists price_book_versions_status_idx on public.price_book_versions (status);

alter table public.price_books enable row level security;
alter table public.price_book_versions enable row level security;

drop policy if exists price_books_service_role_all on public.price_books;
create policy price_books_service_role_all
  on public.price_books for all
  to service_role using (true) with check (true);

drop policy if exists price_book_versions_service_role_all on public.price_book_versions;
create policy price_book_versions_service_role_all
  on public.price_book_versions for all
  to service_role using (true) with check (true);