declare const __TECH_DOCS_ADMIN_SUPABASE_URL__: string;
declare const __TECH_DOCS_ADMIN_SUPABASE_ANON_KEY__: string;

export type AdminSupabaseEnv = {
  url: string;
  anonKey: string;
};

export function getAdminSupabaseEnv(): AdminSupabaseEnv | null {
  const url =
    typeof __TECH_DOCS_ADMIN_SUPABASE_URL__ === "string"
      ? __TECH_DOCS_ADMIN_SUPABASE_URL__.trim()
      : "";
  const anonKey =
    typeof __TECH_DOCS_ADMIN_SUPABASE_ANON_KEY__ === "string"
      ? __TECH_DOCS_ADMIN_SUPABASE_ANON_KEY__.trim()
      : "";

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isAdminSupabaseConfigured(): boolean {
  return getAdminSupabaseEnv() !== null;
}
