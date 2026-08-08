/**
 * Workstation env contract — every key scripts/tests may read, with alias sync.
 * Loaded by loadEnvLocal.cjs; validated by validate-launch-env.mjs (direct run).
 */

/** Keys that must be non-empty after loadEnvLocal + syncWorkstationEnvAliases. */
export const WORKSTATION_REQUIRED_ENVS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PRODUCTS_DATABASE_URL",
  "SUPABASE_AUTH_DATABASE_URL",
  "PLANNER_DATABASE_URL",
  "SUPABASE_AUTH_URL",
  "NEXT_ADMIN_SUPABASE_URL",
  "NEXT_ADMIN_SUPABASE_ANON_KEY",
  "NEXT_ADMIN_PUBLISHABLE_KEY",
  "SUPABASE_ADMIN_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "SITE_URL",
  "NEXT_PUBLIC_TECH_DOCS_URL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "STAFF_NOTIFY_EMAIL",
  "RESEND_INBOX",
  "ADMIN_EMAILS",
  "OPENROUTER_API_KEY_PRIMARY",
  "OPENROUTER_API_KEY",
  "OPENROUTER_API_KEY_BACKUP",
  "OPENROUTER_BASE_URL",
  "OPENROUTER_MODEL",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_R2_CATALOG_BUCKET",
  "CLOUDFLARE_R2_BUCKET",
  "CLOUDFLARE_S3_URL",
  "CLOUDFLARE_R2_ACCESS_KEY_ID",
  "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
  "R2_CATALOG_BUCKET",
  "DEV_AUTH_BYPASS",
  "E2E_SUPABASE_ADMIN_EMAIL",
  "E2E_SUPABASE_ADMIN_PASSWORD",
  "E2E_SUPABASE_USER_EMAIL",
  "E2E_SUPABASE_USER_PASSWORD",
  "ADMIN_TOKEN",
  "CUSTOMER_QUERIES_ADMIN_TOKEN",
  "OPS_PORTAL_USER",
  "OPS_PORTAL_PASSWORD",
  "ACTIVE_THEME_ID",
  "SITE_MAINTENANCE_MODE",
  "NEXT_PUBLIC_CRM_DEMO_MODE",
  "SVG_RELEASE_AUTHORITY",
  "PNG_DISK_MIRROR",
  "LANCE_DB_URI",
];

/** Optional — warn on direct `launch:env` when empty (not a gate failure). */
export const WORKSTATION_OPTIONAL_ENVS = ["CLOUDFLARE_API_TOKEN"];

/** Written to .env.local when absent (explicit dev workstation profile). */
export const WORKSTATION_DEFAULTS = {
  ACTIVE_THEME_ID: "premium-light",
  SITE_MAINTENANCE_MODE: "readonly",
  NEXT_PUBLIC_CRM_DEMO_MODE: "1",
  SVG_RELEASE_AUTHORITY: "db",
  PNG_DISK_MIRROR: "0",
  NEXT_PUBLIC_TECH_DOCS_URL: "http://localhost:3001",
  CLOUDFLARE_R2_CATALOG_BUCKET: "oando-asset-cdn",
  LANCE_DB_URI: "site/.data/lancedb/catalog",
};

function pick(env, key) {
  const v = env[key];
  return typeof v === "string" ? v.trim() : "";
}

function setIfMissing(env, key, value) {
  if (!pick(env, key) && value) {
    env[key] = value;
  }
}

/**
 * Mirror alias env names so scripts/tests reading any variant get the same value.
 * Mutates `env` in place (process.env or a test bag).
 */
export function syncWorkstationEnvAliases(env = process.env) {
  const openRouter =
    pick(env, "OPENROUTER_API_KEY_PRIMARY") ||
    pick(env, "OPENROUTER_API_KEY") ||
    pick(env, "OPENROUTER_API_KEY_BACKUP");
  setIfMissing(env, "OPENROUTER_API_KEY_PRIMARY", openRouter);
  setIfMissing(env, "OPENROUTER_API_KEY", openRouter);

  setIfMissing(env, "PLANNER_DATABASE_URL", pick(env, "SUPABASE_AUTH_DATABASE_URL"));

  const publicUrl = pick(env, "NEXT_PUBLIC_SUPABASE_URL");
  const publicAnon = pick(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  setIfMissing(env, "SUPABASE_URL", publicUrl);
  setIfMissing(env, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", publicAnon);

  const adminUrl = pick(env, "NEXT_ADMIN_SUPABASE_URL") || pick(env, "SUPABASE_AUTH_URL");
  const adminAnon =
    pick(env, "NEXT_ADMIN_SUPABASE_ANON_KEY") || pick(env, "NEXT_ADMIN_PUBLISHABLE_KEY");
  setIfMissing(env, "NEXT_ADMIN_SUPABASE_URL", adminUrl);
  setIfMissing(env, "SUPABASE_AUTH_URL", adminUrl);
  setIfMissing(env, "NEXT_ADMIN_SUPABASE_ANON_KEY", adminAnon);
  setIfMissing(env, "NEXT_ADMIN_PUBLISHABLE_KEY", adminAnon);

  const siteUrl = pick(env, "NEXT_PUBLIC_SITE_URL") || pick(env, "SITE_URL");
  setIfMissing(env, "NEXT_PUBLIC_SITE_URL", siteUrl);
  setIfMissing(env, "SITE_URL", siteUrl);

  const bucket =
    pick(env, "CLOUDFLARE_R2_CATALOG_BUCKET") ||
    pick(env, "CLOUDFLARE_R2_BUCKET") ||
    pick(env, "R2_CATALOG_BUCKET") ||
    WORKSTATION_DEFAULTS.CLOUDFLARE_R2_CATALOG_BUCKET;
  setIfMissing(env, "CLOUDFLARE_R2_CATALOG_BUCKET", bucket);
  setIfMissing(env, "CLOUDFLARE_R2_BUCKET", bucket);
  setIfMissing(env, "R2_CATALOG_BUCKET", bucket);

  const accountId = pick(env, "CLOUDFLARE_ACCOUNT_ID");
  if (accountId) {
    setIfMissing(env, "CLOUDFLARE_S3_URL", `https://${accountId}.r2.cloudflarestorage.com`);
  }

  for (const [key, value] of Object.entries(WORKSTATION_DEFAULTS)) {
    setIfMissing(env, key, value);
  }

  return env;
}

/**
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [env]
 */
export function validateWorkstationEnv(env = process.env) {
  syncWorkstationEnvAliases(env);
  const missing = WORKSTATION_REQUIRED_ENVS.filter((name) => !pick(env, name));
  const missingOptional = WORKSTATION_OPTIONAL_ENVS.filter((name) => !pick(env, name));
  return {
    ok: missing.length === 0,
    checkedAt: new Date().toISOString(),
    required: WORKSTATION_REQUIRED_ENVS,
    missing,
    missingOptional,
  };
}

/**
 * Keys to add to .env.local when missing (canonical + aliases + defaults).
 * @param {Record<string, string>} map parsed KEY=value from file
 * @returns {Record<string, string>}
 */
export function deriveMissingEnvFileKeys(map) {
  const env = { ...map };
  syncWorkstationEnvAliases(env);
  const additions = {};
  for (const key of WORKSTATION_REQUIRED_ENVS) {
    if (!map[key]?.trim() && env[key]?.trim()) {
      additions[key] = env[key].trim();
    }
  }
  return additions;
}
