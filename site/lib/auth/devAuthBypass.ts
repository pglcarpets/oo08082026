/**
 * Development auth bypass for admin/UI/API.
 *
 * ENABLED only when:
 *   - DEV_AUTH_BYPASS=1 (server env), AND
 *   - NODE_ENV is not "production"
 *
 * Never enable in production builds/deployments. Playwright/dev webServer
 * should set DEV_AUTH_BYPASS=1 only for local/CI non-prod servers.
 */

export const DEV_AUTH_BYPASS_ENV = "DEV_AUTH_BYPASS" as const;

export type DevBypassUser = {
  id: string;
  email: string;
  role: "admin";
};

/**
 * Stable synthetic admin for bypass sessions.
 * Must be a real UUID (hex only) — oando_plans.user_id and profiles.id are uuid.
 * The old suffix `…000dev` is not valid hex and broke every portal/list query.
 */
export const DEV_BYPASS_USER: DevBypassUser = {
  id: "00000000-0000-4000-8000-0000000000d1",
  email: "dev-bypass@localhost",
  role: "admin",
};

/**
 * True when server-side auth may be short-circuited for local/dev E2E.
 * Production always returns false even if the env flag is set.
 */
function readFlag(env: NodeJS.ProcessEnv, key: string): string | undefined {
  // Dynamic key access avoids some bundlers inlining missing env as undefined.
  return env[key];
}

export function isDevAuthBypassEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const bypass = readFlag(env, DEV_AUTH_BYPASS_ENV);
  const nodeEnv = readFlag(env, "NODE_ENV");

  if (nodeEnv === "production") {
    return false;
  }
  return bypass === "1";
}
