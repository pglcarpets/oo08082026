/**
 * Resolve admin Supabase public env for tech-docs Vite build (same names as Next site).
 */
export function resolveAdminSupabaseEnv(
  env: Record<string, string | undefined>,
): { url: string; anonKey: string } {
  const url = (env.NEXT_ADMIN_SUPABASE_URL || env.SUPABASE_AUTH_URL || "").trim();
  const anonKey = (
    env.NEXT_ADMIN_SUPABASE_ANON_KEY ||
    env.NEXT_ADMIN_PUBLISHABLE_KEY ||
    ""
  ).trim();

  return { url, anonKey };
}

export function adminSupabaseDefine(
  env: Record<string, string | undefined>,
): Record<string, string> {
  const { url, anonKey } = resolveAdminSupabaseEnv(env);
  return {
    __TECH_DOCS_ADMIN_SUPABASE_URL__: JSON.stringify(url),
    __TECH_DOCS_ADMIN_SUPABASE_ANON_KEY__: JSON.stringify(anonKey),
  };
}
