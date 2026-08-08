/**
 * Planner project persistence — exclusive mode (never dual-write).
 *
 * - `DEV_AUTH_BYPASS=1` + non-production → **disk only** (`pnpm run dev`)
 * - otherwise → **admin Supabase only** (`public.oando_plans`)
 *
 * R2 is backup/ops only — not a live write path.
 */

import { isDevAuthBypassEnabled } from "@/lib/auth/devAuthBypass";

export type PlannerPersistenceMode = "disk" | "supabase";

export function getPlannerPersistenceMode(
  env: NodeJS.ProcessEnv = process.env,
): PlannerPersistenceMode {
  if (isDevAuthBypassEnabled(env)) {
    return "disk";
  }
  return "supabase";
}

/** Whether the active exclusive mode can serve traffic. */
export function isPlannerPersistenceConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (getPlannerPersistenceMode(env) === "disk") {
    return true;
  }
  return Boolean(
    env.NEXT_ADMIN_SUPABASE_URL?.trim() &&
      env.SUPABASE_ADMIN_SERVICE_ROLE_KEY?.trim(),
  );
}
