-- Fix "permission denied for table feature_flags" — RLS policy exists but
-- GRANT statements were missing (see AGENTS.md §7: "Supabase: Requires grants AND policies" and .github/instructions/migrations.instructions.md "Grants AND Policies").
-- Mirrors the pattern from 20260801130000_create_furniture_catalog.sql.

grant select on public.feature_flags to anon, authenticated;
grant all on public.feature_flags to service_role;

-- rollback
revoke all on public.feature_flags from service_role;
revoke select on public.feature_flags from anon, authenticated;
