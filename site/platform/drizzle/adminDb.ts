import "server-only";

import { createPostgresDrizzle } from "./createPostgresDrizzle";
import { resolvePlannerDatabaseUrl } from "./databaseUrls";

let cachedDb: ReturnType<typeof createPostgresDrizzle> | null = null;

export function getAdminDb() {
  if (cachedDb) return cachedDb;

  const connectionString = resolvePlannerDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      "Planner database URL is missing. Set SUPABASE_AUTH_DATABASE_URL in repo-root .env.local",
    );
  }

  cachedDb = createPostgresDrizzle(connectionString);
  return cachedDb;
}

/** Admin / planner Postgres (alias `db` for existing imports). */
export const adminDb = new Proxy({} as ReturnType<typeof createPostgresDrizzle>, {
  get(_target, property, receiver) {
    return Reflect.get(getAdminDb(), property, receiver);
  },
});
