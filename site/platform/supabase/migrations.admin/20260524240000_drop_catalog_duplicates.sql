-- Admin DB cleanup: drop stale catalog duplicates.
-- The products DB (oando) is the source of truth for the entire catalog domain.
-- These tables on admin are leftover copies and contain stale data.
-- Backups: backups/pre-split-admin-*.sql

drop table if exists public.product_images          cascade;
drop table if exists public.product_specs           cascade;
drop table if exists public.products                cascade;
drop table if exists public.categories              cascade;

drop table if exists public.catalog_product_images  cascade;
drop table if exists public.catalog_product_specs   cascade;
drop table if exists public.catalog_products        cascade;
drop table if exists public.catalog_items           cascade;
drop table if exists public.catalog_categories      cascade;
drop table if exists public.series                  cascade;

drop table if exists public.__drizzle_migrations    cascade;
