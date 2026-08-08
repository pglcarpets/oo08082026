type EnvSource = Partial<Record<string, string | undefined>>;

/** Sign-in target: admin/auth Supabase project (not products catalog). */
export interface E2EAuthEnv {
  authSupabaseUrl: string;
  authSupabaseAnonKey: string;
  adminEmail: string;
  adminPassword: string;
  userEmail: string;
  userPassword: string;
}

export interface E2EAuthSeedEnv {
  authSupabaseUrl: string;
  serviceRoleKey: string;
}

function readRequiredEnv(env: EnvSource, name: string): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function readAuthAnonKey(env: EnvSource): string {
  return (
    env.NEXT_ADMIN_SUPABASE_ANON_KEY?.trim() ||
    env.NEXT_ADMIN_PUBLISHABLE_KEY?.trim() ||
    ""
  );
}

export function getE2EAuthEnv(env: EnvSource = process.env): E2EAuthEnv {
  const authSupabaseAnonKey = readAuthAnonKey(env);

  if (!authSupabaseAnonKey) {
    throw new Error(
      "Missing required env var: NEXT_ADMIN_SUPABASE_ANON_KEY or NEXT_ADMIN_PUBLISHABLE_KEY",
    );
  }

  return {
    authSupabaseUrl: readRequiredEnv(env, "NEXT_ADMIN_SUPABASE_URL"),
    authSupabaseAnonKey,
    adminEmail: readRequiredEnv(env, "E2E_SUPABASE_ADMIN_EMAIL"),
    adminPassword: readRequiredEnv(env, "E2E_SUPABASE_ADMIN_PASSWORD"),
    userEmail: readRequiredEnv(env, "E2E_SUPABASE_USER_EMAIL"),
    userPassword: readRequiredEnv(env, "E2E_SUPABASE_USER_PASSWORD"),
  };
}

export function getE2EAuthSeedEnv(env: EnvSource = process.env): E2EAuthSeedEnv {
  return {
    authSupabaseUrl: readRequiredEnv(env, "NEXT_ADMIN_SUPABASE_URL"),
    serviceRoleKey: readRequiredEnv(env, "SUPABASE_ADMIN_SERVICE_ROLE_KEY"),
  };
}
