import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabaseEnv } from "./authEnv";

let client: SupabaseClient | null = null;

export function getAuthSupabaseClient(): SupabaseClient {
  if (!client) {
    const env = getAdminSupabaseEnv();
    if (!env) {
      throw new Error(
        "Admin Supabase is not configured. Set NEXT_ADMIN_SUPABASE_URL and NEXT_ADMIN_SUPABASE_ANON_KEY at build time.",
      );
    }
    client = createClient(env.url, env.anonKey);
  }
  return client;
}

/** Test-only reset */
export function resetAuthSupabaseClientForTests(): void {
  client = null;
}
