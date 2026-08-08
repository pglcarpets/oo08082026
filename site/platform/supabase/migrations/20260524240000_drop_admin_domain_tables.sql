-- Products DB cleanup: drop tables that admin owns under the new split.
-- All non-catalog domain (auth, planning, CRM, teams, etc) lives on admin.
-- Backups: backups/pre-split-products-*.sql

-- planning (drop child references first)
drop table if exists public.plan_comments    cascade;
drop table if exists public.plan_shares      cascade;
drop table if exists public.plan_versions    cascade;
drop table if exists public.plans            cascade;

-- projects + crm
drop table if exists public.quotes           cascade;
drop table if exists public.projects         cascade;
drop table if exists public.clients          cascade;

-- teams + invites + offices
drop table if exists public.team_members     cascade;
drop table if exists public.invites          cascade;
drop table if exists public.offices          cascade;
drop table if exists public.teams            cascade;

-- user data + auth
drop table if exists public.user_history     cascade;
drop table if exists public.profiles         cascade;
drop table if exists public.users            cascade;

-- customer queries (admin owns CRM-ish)
drop table if exists public.customer_queries cascade;
