import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

export const REQUIRED_PUBLIC_ENVS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

export const REQUIRED_SERVER_ENVS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

export const PRODUCTION_REQUIRED_ENVS = [
  "PRODUCTS_DATABASE_URL",
  "SUPABASE_AUTH_DATABASE_URL",
];

export const FORBIDDEN_PUBLIC_SECRET_PATTERNS = [
  /^NEXT_PUBLIC_.*SECRET/i,
  /^NEXT_PUBLIC_.*SERVICE_ROLE/i,
  /^NEXT_PUBLIC_.*PRIVATE/i,
  /^NEXT_PUBLIC_.*TOKEN/i,
];

/**
 * @param {string} name
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [env]
 */
export function hasValue(name, env = process.env) {
  return Boolean(env[name]?.trim());
}

/**
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [env]
 */
export function validateLaunchEnv(env = process.env) {
  const missingPublic = REQUIRED_PUBLIC_ENVS.filter((name) => !hasValue(name, env));
  const missingServer = REQUIRED_SERVER_ENVS.filter((name) => !hasValue(name, env));
  const missingProduction =
    env.NODE_ENV === "production"
      ? PRODUCTION_REQUIRED_ENVS.filter((name) => !hasValue(name, env))
      : [];
  const forbiddenPublic = Object.keys(env).filter((name) =>
    FORBIDDEN_PUBLIC_SECRET_PATTERNS.some((pattern) => pattern.test(name)),
  );

  return {
    ok:
      missingPublic.length === 0 &&
      missingServer.length === 0 &&
      missingProduction.length === 0 &&
      forbiddenPublic.length === 0,
    checkedAt: new Date().toISOString(),
    requiredPublic: REQUIRED_PUBLIC_ENVS,
    requiredServer: REQUIRED_SERVER_ENVS,
    productionRequired: PRODUCTION_REQUIRED_ENVS,
    missingPublic,
    missingServer,
    missingProduction,
    forbiddenPublic,
  };
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return path.resolve(entry) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isDirectRun()) {
  require("./loadEnvLocal.cjs").loadEnvLocal();
  const launch = validateLaunchEnv();
  const { validateWorkstationEnv } = require("./workstation-env.mjs");
  const workstation = validateWorkstationEnv();
  const result = {
    ...launch,
    workstationRequired: workstation.required,
    missingWorkstation: workstation.missing,
    missingWorkstationOptional: workstation.missingOptional,
    workstationOk: workstation.ok,
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!launch.ok || !workstation.ok) {
    process.exitCode = 1;
  }
}
