-- Tier 5 follow-up: After adding FK indexes in Tier 3, the advisor flagged
-- duplicates because the database already had idx_<table>_<col> indexes
-- created by older migrations that the Tier 3 migration didn't account for.
-- Keep the original (in-use) idx_* indexes; drop the new *_idx duplicates.

drop index if exists public.catalog_items_series_id_idx;
drop index if exists public.catalog_product_slug_aliases_canonical_slug_idx;
drop index if exists public.catalog_products_category_id_idx;
drop index if exists public.clients_user_id_idx;
drop index if exists public.plan_comments_share_id_idx;
drop index if exists public.plan_comments_plan_id_idx;
drop index if exists public.plan_shares_plan_id_idx;
drop index if exists public.plan_versions_plan_id_idx;
drop index if exists public.plans_user_id_idx;
drop index if exists public.plans_project_id_idx;
drop index if exists public.projects_client_id_idx;
drop index if exists public.projects_user_id_idx;
drop index if exists public.quotes_plan_id_idx;
drop index if exists public.quotes_user_id_idx;
