type PublicSupabaseEnv = {
  url: string;
  anonKey: string;
};

function readEnv(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return trimmed;
}

export function getOptionalPublicSupabaseEnv(): PublicSupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  return url && anonKey ? { url, anonKey } : null;
}

/** Auth / planner Supabase project (users, profiles, plans) — not the products catalog project. */
export function getOptionalAuthSupabaseEnv(): PublicSupabaseEnv | null {
  const url =
    process.env.NEXT_ADMIN_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_AUTH_URL?.trim();
  const anonKey =
    process.env.NEXT_ADMIN_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_ADMIN_PUBLISHABLE_KEY?.trim();

  return url && anonKey ? { url, anonKey } : null;
}

export function hasPublicSupabaseEnv(): boolean {
  return Boolean(getOptionalPublicSupabaseEnv());
}

export function hasAuthSupabaseEnv(): boolean {
  return Boolean(getOptionalAuthSupabaseEnv());
}

/** Safe to call in server components or middleware without throwing. */
export function isSupabaseConfigAvailable(): boolean {
  return hasPublicSupabaseEnv();
}

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  return {
    url: readEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}

export function getAuthSupabaseEnv(): PublicSupabaseEnv {
  const optional = getOptionalAuthSupabaseEnv();
  if (optional) {
    return optional;
  }

  return {
    url: readEnv(
      "NEXT_ADMIN_SUPABASE_URL",
      process.env.NEXT_ADMIN_SUPABASE_URL ?? process.env.SUPABASE_AUTH_URL,
    ),
    anonKey: readEnv(
      "NEXT_ADMIN_SUPABASE_ANON_KEY",
      process.env.NEXT_ADMIN_SUPABASE_ANON_KEY ??
        process.env.NEXT_ADMIN_PUBLISHABLE_KEY,
    ),
  };
}