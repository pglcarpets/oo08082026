import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database as AuthDatabase } from "@/types/database.admin.types";

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

/**
 * Server-side client for the admin/auth Supabase project.
 *
 * Owns: auth.users, profiles, user_history, customer_queries, plans,
 *       plan_versions, plan_comments, plan_shares, planner_settings,
 *       projects, clients, quotes, teams, team_members, invites, offices,
 *       templates, users.
 *
 * Use this for any server route that touches user-scoped or CRM-ish data.
 * For catalog data use createSupabaseAdminClient() in @/platform/supabase/supabaseAdmin.
 */
export function createSupabaseAuthAdminClient() {
  const supabaseUrl = process.env.NEXT_ADMIN_SUPABASE_URL?.trim() ?? "";
  if (!supabaseUrl) {
    throw new Error("Missing required env var: NEXT_ADMIN_SUPABASE_URL");
  }

  const serviceRoleKey = getEnv("SUPABASE_ADMIN_SERVICE_ROLE_KEY");

  return createClient<AuthDatabase>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
