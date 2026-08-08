-- SVG revision + artifact DB storage (Phase 2: Products DB authority).
-- Replaces disk-based inventory/descriptors/ and public/svg-catalog/ as source of truth.

-- Immutable SVG revision published via the pipeline.
create table if not exists public.svg_revisions (
  revision_id      text primary key,
  schema_version   integer not null,
  definition_type_id text not null,
  definition_version integer not null,
  compiler_version text,
  source_revision  integer,
  artifact_checksums jsonb,
  validation       jsonb,
  actor_id         text not null,
  published_at     timestamptz not null default now(),
  reason           text,
  slug             text not null,
  version          integer not null,
  definition       jsonb not null,
  released_product jsonb,
  unique (slug, version)
);

create index if not exists svg_revisions_slug_idx on public.svg_revisions (slug);

-- Artifact records (descriptor JSON + compiled SVG + generated PNG/thumbnail).
create table if not exists public.svg_revision_artifacts (
  id            uuid primary key default gen_random_uuid(),
  revision_id   text not null references public.svg_revisions (revision_id) on delete cascade,
  kind          text not null,
  checksum      text not null,
  storage_key   text not null,
  width         integer,
  created_at    timestamptz not null default now()
);

create index if not exists svg_revision_artifacts_revision_id_idx
  on public.svg_revision_artifacts (revision_id);

-- Live block descriptor (latest released descriptor per slug).
create table if not exists public.block_descriptors (
  slug             text primary key,
  current_version  integer not null,
  current_checksum text,
  descriptor       jsonb not null,
  updated_at       timestamptz not null default now(),
  updated_by       text
);

-- Enable RLS (service-role access only; no public policies).
alter table public.svg_revisions enable row level security;
alter table public.svg_revision_artifacts enable row level security;
alter table public.block_descriptors enable row level security;
