-- Reversible SVG editor V2 foundation. Generated only; do not apply without owner approval.
create table if not exists "svg_assets_v2" (
  "id" uuid primary key default gen_random_uuid(),
  "product_id" uuid references "catalog_products"("id") on delete set null,
  "slug" text not null,
  "name" text not null,
  "asset_kind" text not null check ("asset_kind" in ('fixed', 'configurable', 'parametric')),
  "dimensions_mm" jsonb not null,
  "lifecycle" text not null check ("lifecycle" in ('draft', 'review', 'live', 'retired')),
  "current_version" integer not null default 0 check ("current_version" >= 0),
  "current_version_id" uuid,
  "current_source_checksum" text not null check ("current_source_checksum" ~ '^[a-f0-9]{64}$'),
  "capabilities" text[] not null,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "svg_assets_v2_slug_unique" unique ("slug")
);
--> statement-breakpoint
create table if not exists "svg_asset_versions_v2" (
  "id" uuid primary key default gen_random_uuid(),
  "asset_id" uuid not null references "svg_assets_v2"("id") on delete restrict,
  "version" integer not null check ("version" > 0),
  "manifest" jsonb not null,
  "source_checksum" text not null check ("source_checksum" ~ '^[a-f0-9]{64}$'),
  "created_by" text not null,
  "created_at" timestamptz not null default now(),
  constraint "svg_asset_versions_v2_asset_version_unique" unique ("asset_id", "version")
);
--> statement-breakpoint
alter table "svg_assets_v2"
  add constraint "svg_assets_v2_current_version_fk"
  foreign key ("current_version_id") references "svg_asset_versions_v2"("id") on delete restrict;
--> statement-breakpoint
create table if not exists "svg_asset_artifacts_v2" (
  "id" uuid primary key default gen_random_uuid(),
  "version_id" uuid not null references "svg_asset_versions_v2"("id") on delete restrict,
  "provider" text not null check ("provider" in ('supabase', 'r2')),
  "bucket" text not null,
  "object_key" text not null,
  "mime_type" text not null,
  "size_bytes" integer not null check ("size_bytes" >= 0),
  "checksum" text not null check ("checksum" ~ '^[a-f0-9]{64}$'),
  "created_at" timestamptz not null default now(),
  constraint "svg_asset_artifacts_v2_object_unique" unique ("provider", "bucket", "object_key")
);
--> statement-breakpoint
create table if not exists "svg_ai_runs_v2" (
  "id" uuid primary key default gen_random_uuid(),
  "asset_id" uuid not null references "svg_assets_v2"("id") on delete restrict,
  "base_version_id" uuid references "svg_asset_versions_v2"("id") on delete set null,
  "actor_id" text not null,
  "mode" text not null check ("mode" in ('edit', 'audit')),
  "status" text not null check ("status" in ('requested', 'completed', 'failed', 'applied', 'discarded')),
  "provider" text,
  "model" text,
  "input_snapshot_key" text not null,
  "output_snapshot_key" text,
  "input_checksum" text not null check ("input_checksum" ~ '^[a-f0-9]{64}$'),
  "output_checksum" text check ("output_checksum" is null or "output_checksum" ~ '^[a-f0-9]{64}$'),
  "error_code" text,
  "created_at" timestamptz not null default now()
);
--> statement-breakpoint
create index if not exists "svg_assets_v2_product_id_idx" on "svg_assets_v2" ("product_id");
create index if not exists "svg_assets_v2_lifecycle_idx" on "svg_assets_v2" ("lifecycle");
create index if not exists "svg_assets_v2_current_version_id_idx" on "svg_assets_v2" ("current_version_id");
create index if not exists "svg_asset_versions_v2_asset_id_idx" on "svg_asset_versions_v2" ("asset_id");
create index if not exists "svg_asset_versions_v2_checksum_idx" on "svg_asset_versions_v2" ("source_checksum");
create index if not exists "svg_asset_artifacts_v2_version_id_idx" on "svg_asset_artifacts_v2" ("version_id");
create index if not exists "svg_asset_artifacts_v2_checksum_idx" on "svg_asset_artifacts_v2" ("checksum");
create index if not exists "svg_ai_runs_v2_asset_id_idx" on "svg_ai_runs_v2" ("asset_id");
create index if not exists "svg_ai_runs_v2_status_idx" on "svg_ai_runs_v2" ("status");
create index if not exists "svg_ai_runs_v2_base_version_id_idx" on "svg_ai_runs_v2" ("base_version_id");
