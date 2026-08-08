-- Admin DB cleanup: drop dead better-auth scaffolding.
-- We are using Supabase Auth (auth.users) on this project.
-- These public.auth_* tables are leftover from a never-wired better-auth path.
-- Backups: backups/pre-split-admin-*.sql

drop table if exists public.auth_session       cascade;
drop table if exists public.auth_account       cascade;
drop table if exists public.auth_verification  cascade;
drop table if exists public.auth_user          cascade;
