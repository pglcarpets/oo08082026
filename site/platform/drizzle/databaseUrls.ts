/**
 * Postgres wire URLs for Drizzle (server-only).
 * HTTP Supabase URLs (NEXT_PUBLIC_*, NEXT_ADMIN_*) are for Auth/REST only.
 */

export function resolveProductsDatabaseUrl(): string | null {
  return process.env.PRODUCTS_DATABASE_URL?.trim() || null;
}

export function isProductsDatabaseConfigured(): boolean {
  return Boolean(resolveProductsDatabaseUrl());
}

/** Primary planner DB: admin Supabase Postgres. */
export function resolvePlannerDatabaseUrl(): string | null {
  return (
    process.env.SUPABASE_AUTH_DATABASE_URL?.trim() ||
    process.env.PLANNER_DATABASE_URL?.trim() ||
    null
  );
}

export function isPlannerDatabaseUrlConfigured(): boolean {
  return Boolean(resolvePlannerDatabaseUrl());
}
