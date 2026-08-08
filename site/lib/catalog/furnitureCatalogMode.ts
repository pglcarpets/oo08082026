/**
 * Furniture catalog persistence — exclusive mode (never dual-write).
 *
 * - `DEV_AUTH_BYPASS=1` + non-production → **disk only**
 *   (`site/platform/shared/data/furniture/`, local `pnpm run dev`)
 * - otherwise → **Admin Supabase only** (`public.furniture_catalog` +
 *   the `catalog-assets` storage bucket)
 *
 * Deliberately mirrors `lib/Planner/plannerPersistenceMode.ts`, which governs
 * Planner projects the same way. Production has a read-only filesystem, so the
 * disk branch must never be the live path there.
 *
 * Neutral module: both `@studio/*` and `@planner/*` read the furniture library,
 * and neither may import the other (`pnpm run scan:boundaries`).
 */

import { isDevAuthBypassEnabled } from "@/lib/auth/devAuthBypass";

export type FurnitureCatalogMode = "disk" | "supabase";

export function getFurnitureCatalogMode(
  env: NodeJS.ProcessEnv = process.env,
): FurnitureCatalogMode {
  if (isDevAuthBypassEnabled(env)) {
    return "disk";
  }
  return "supabase";
}

/** Whether the active exclusive mode can serve traffic. */
export function isFurnitureCatalogConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (getFurnitureCatalogMode(env) === "disk") {
    return true;
  }
  return Boolean(
    env.NEXT_ADMIN_SUPABASE_URL?.trim() &&
      env.SUPABASE_ADMIN_SERVICE_ROLE_KEY?.trim(),
  );
}
