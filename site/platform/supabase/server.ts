import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database as AuthDatabase } from "@/types/database.admin.types";
import type { Database } from "@/platform/supabase/types";
import { getAuthSupabaseEnv, getPublicSupabaseEnv } from "./env";

async function createCookieBoundClient<TDatabase>(url: string, anonKey: string) {
  const cookieStore = await cookies();

  return createSSRClient<TDatabase>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll from a Server Component — middleware may refresh sessions.
        }
      },
    },
  });
}

/** Products / catalog Supabase project. */
export async function createServerClient() {
  const { url, anonKey } = getPublicSupabaseEnv();
  return createCookieBoundClient<Database>(url, anonKey);
}

/** Auth / planner Supabase project — sign-in, sessions, admin gate. */
export async function createAuthServerClient() {
  const { url, anonKey } = getAuthSupabaseEnv();
  return createCookieBoundClient<AuthDatabase>(url, anonKey);
}

export { createServerClient as createClient };