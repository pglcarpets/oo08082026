-- ---------------------------------------------------------------------------
-- Archive the pre-`oando_plans` legacy tables out of `public`
-- ---------------------------------------------------------------------------
-- These nine tables predate the Planner persistence cutover. Live Planner
-- storage is `public.oando_plans` (see lib/Planner/projectsStore.supabase.ts);
-- these have no reader anywhere in `site/` or `scripts/` — verified by a
-- repo-wide search for `.from("<table>")`.
--
-- They are moved, not dropped: `plans` (6 rows), `templates` (4) and `users`
-- (2) still hold data. Every foreign key among them points inside this set
-- (plan_versions→plans, quotes→plans, plan_comments→plan_shares,
-- plan_comments→plans, plan_shares→plans, clients→users, projects→clients,
-- projects→users), and no view depends on them, so the cluster relocates as a
-- unit with constraints intact.
--
-- PostgREST only exposes `public`, so this removes them from the API surface
-- while preserving every row. It also stops `public.plans` from shadowing
-- `public.oando_plans` in generated types and in reader intuition.

create schema if not exists archive;

-- The archive schema is not an API surface.
revoke all on schema archive from anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'plan_comments',
    'plan_shares',
    'plan_versions',
    'quotes',
    'plans',
    'projects',
    'clients',
    'users',
    'templates'
  ]
  loop
    if to_regclass('public.' || quote_ident(t)) is not null then
      execute format('alter table public.%I set schema archive', t);
    end if;
  end loop;
end
$$;

-- rollback:
-- do $$
-- declare
--   t text;
-- begin
--   foreach t in array array[
--     'templates', 'users', 'clients', 'projects', 'plans',
--     'quotes', 'plan_versions', 'plan_shares', 'plan_comments'
--   ]
--   loop
--     if to_regclass('archive.' || quote_ident(t)) is not null then
--       execute format('alter table archive.%I set schema public', t);
--     end if;
--   end loop;
-- end
-- $$;
