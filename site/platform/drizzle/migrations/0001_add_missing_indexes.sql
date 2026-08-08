-- Add missing indexes on foreign keys and common query fields for the
-- admin/planner DB (DATABASE_URL, DigitalOcean Postgres).
--
-- Postgres does NOT auto-index FK columns. Without these, joins and
-- lookups by FK, plus cascade deletes on parent tables, do sequential
-- scans. Statements use IF NOT EXISTS so the migration is idempotent.
--
-- team_members gets a composite primary key (team_id, user_id) which
-- also serves as the index for team_id lookups; the user_id side gets
-- a separate btree for reverse membership lookups.
--> statement-breakpoint
create index if not exists "profiles_email_idx" on "profiles" ("email");--> statement-breakpoint
create index if not exists "profiles_role_idx" on "profiles" ("role");--> statement-breakpoint
create index if not exists "profiles_created_at_idx" on "profiles" ("created_at");--> statement-breakpoint
create index if not exists "plans_user_id_idx" on "plans" ("user_id");--> statement-breakpoint
create index if not exists "plans_status_idx" on "plans" ("status");--> statement-breakpoint
create index if not exists "plans_created_at_idx" on "plans" ("created_at");--> statement-breakpoint
create index if not exists "plans_updated_at_idx" on "plans" ("updated_at");--> statement-breakpoint
create index if not exists "plans_user_id_status_idx" on "plans" ("user_id", "status");--> statement-breakpoint
create index if not exists "plans_user_id_created_at_idx" on "plans" ("user_id", "created_at");--> statement-breakpoint
create index if not exists "plans_user_id_updated_at_idx" on "plans" ("user_id", "updated_at");--> statement-breakpoint
create index if not exists "teams_created_at_idx" on "teams" ("created_at");--> statement-breakpoint

-- team_members: add composite PK if missing, then FK indexes.
-- Guarded because 0000 created the table without a PK.
do $$
begin
  if not exists (
    select 1 from pg_index i
    where i.indrelid = 'public.team_members'::regclass and i.indisprimary
  ) then
    alter table public.team_members
      add constraint team_members_pkey primary key (team_id, user_id);
  end if;
end
$$;--> statement-breakpoint

create index if not exists "team_members_team_id_idx" on "team_members" ("team_id");--> statement-breakpoint
create index if not exists "team_members_user_id_idx" on "team_members" ("user_id");--> statement-breakpoint
create index if not exists "invites_team_id_idx" on "invites" ("team_id");--> statement-breakpoint
create index if not exists "invites_invited_by_idx" on "invites" ("invited_by");--> statement-breakpoint
create index if not exists "invites_email_idx" on "invites" ("email");--> statement-breakpoint
create index if not exists "invites_created_at_idx" on "invites" ("created_at");--> statement-breakpoint
create index if not exists "audit_events_team_id_idx" on "audit_events" ("team_id");--> statement-breakpoint
create index if not exists "audit_events_actor_id_idx" on "audit_events" ("actor_id");--> statement-breakpoint
create index if not exists "audit_events_action_idx" on "audit_events" ("action");--> statement-breakpoint
create index if not exists "audit_events_created_at_idx" on "audit_events" ("created_at");--> statement-breakpoint
create index if not exists "audit_events_team_id_created_at_idx" on "audit_events" ("team_id", "created_at");
