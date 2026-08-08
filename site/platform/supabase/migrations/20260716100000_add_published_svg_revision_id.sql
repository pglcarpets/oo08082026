-- DB-SVG-05: add published SVG revision pointer to planner_managed_products.
-- Apply: pnpm --filter oando-site run db:apply -- --dry  (plan)
--        pnpm --filter oando-site run db:apply          (after owner approval)

alter table public.planner_managed_products
  add column if not exists published_svg_revision_id text;

comment on column public.planner_managed_products.published_svg_revision_id is
  'References svg_revisions.revision_id. Set by Admin publish pipeline after successful DB write. NULL until first DB-authority publish.';

create index if not exists idx_planner_managed_products_published_svg_revision_id
  on public.planner_managed_products (published_svg_revision_id)
  where published_svg_revision_id is not null;
