-- Cleanup: Drop dead better-auth scaffolding and unused legacy tables.
-- A backup of all rows in these tables was written to backups/pre-cleanup-*.sql
-- prior to this migration.
--
-- These tables have NO references in app code. better-auth was never wired up;
-- the live auth path uses Supabase Auth (auth.users + supabase.auth.getUser).

drop table if exists public.auth_session       cascade;
drop table if exists public.auth_account       cascade;
drop table if exists public.auth_verification  cascade;
drop table if exists public.auth_user          cascade;
drop table if exists public.legacy_projects    cascade;
drop table if exists public.__drizzle_migrations cascade;
