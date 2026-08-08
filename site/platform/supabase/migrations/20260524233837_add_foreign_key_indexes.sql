-- Tier 3: Cover every foreign key with a btree index.
-- Postgres does NOT auto-index FK columns, only the referenced PK side.
-- Without these indexes, joins, lookups by FK, and cascading
-- delete/update operations on the parent table do a sequential scan.
--
-- Statements use IF NOT EXISTS so the migration is idempotent.
-- One FK (team_members.user_id) is already covered and intentionally omitted.

-- catalog domain
create index if not exists catalog_items_series_id_idx
  on public.catalog_items (series_id);

create index if not exists catalog_product_images_product_id_idx
  on public.catalog_product_images (product_id);

create index if not exists catalog_product_slug_aliases_canonical_slug_idx
  on public.catalog_product_slug_aliases (canonical_slug);

create index if not exists catalog_product_specs_product_id_idx
  on public.catalog_product_specs (product_id);

create index if not exists catalog_products_category_id_idx
  on public.catalog_products (category_id);

-- crm
create index if not exists clients_user_id_idx
  on public.clients (user_id);

-- teams / invites / offices
create index if not exists invites_team_id_idx
  on public.invites (team_id);

create index if not exists offices_created_by_idx
  on public.offices (created_by);

create index if not exists offices_team_id_idx
  on public.offices (team_id);

create index if not exists team_members_team_id_idx
  on public.team_members (team_id);

-- planning
create index if not exists plan_comments_plan_id_idx
  on public.plan_comments (plan_id);

create index if not exists plan_comments_share_id_idx
  on public.plan_comments (share_id);

create index if not exists plan_shares_plan_id_idx
  on public.plan_shares (plan_id);

create index if not exists plan_versions_plan_id_idx
  on public.plan_versions (plan_id);

create index if not exists plans_project_id_idx
  on public.plans (project_id);

create index if not exists plans_user_id_idx
  on public.plans (user_id);

-- projects
create index if not exists projects_client_id_idx
  on public.projects (client_id);

create index if not exists projects_user_id_idx
  on public.projects (user_id);

-- quotes
create index if not exists quotes_plan_id_idx
  on public.quotes (plan_id);

create index if not exists quotes_user_id_idx
  on public.quotes (user_id);

-- profiles (PK->FK to auth.users.id, helps when joining)
create index if not exists profiles_id_idx
  on public.profiles (id);
