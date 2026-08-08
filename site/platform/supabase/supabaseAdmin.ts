import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function createSupabaseAdminClient() {
  // Prefer the server-only SUPABASE_URL and fall back to NEXT_PUBLIC_SUPABASE_URL
  // only if a dedicated server URL isn't provided. Admin operations must use
  // the service role key and a non-public URL where possible.
  const supabaseUrl =
    process.env.SUPABASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ??
    "";
  if (!supabaseUrl) {
    throw new Error(
      "Missing required env var: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)",
    );
  }

  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
