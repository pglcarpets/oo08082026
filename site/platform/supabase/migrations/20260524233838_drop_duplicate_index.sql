-- Tier 5: Drop redundant index on catalog_products(slug).
-- The unique constraint products_slug_key already enforces uniqueness and
-- creates a btree index covering the slug column, so idx_catalog_products_slug
-- is a duplicate.

drop index if exists public.idx_catalog_products_slug;
