import "server-only";

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Server-only env with Cloudflare S3 credential pair aliases.
 * Prefer `@/env` for shared public + server keys without R2 alias logic.
 * Prefer this module for AI keys, DB URLs, and R2/S3 pairs (catalog scripts).
 */

/** emptyStringAsUndefined handles blanks; keep schemas plain for createEnv. */
const optionalEnvString = z.string().min(1).optional();
const optionalEnvUrl = z.string().url().optional();

const serverSchema = {
  OPENAI_API_KEY: optionalEnvString,
  OPENROUTER_API_KEY_PRIMARY: optionalEnvString,
  OPENROUTER_API_KEY_BACKUP: optionalEnvString,
  OPENROUTER_MODEL: optionalEnvString,
  GEMINI_API_KEY: optionalEnvString,
  GEMINI_MODEL: optionalEnvString,
  LANCE_DB_URI: optionalEnvString,
  PRODUCTS_DATABASE_URL: optionalEnvUrl,
  SUPABASE_AUTH_DATABASE_URL: optionalEnvUrl,
  CLOUDFLARE_ACCOUNT_ID: optionalEnvString,
  CLOUDFLARE_API_TOKEN: optionalEnvString,
  CLOUDFLARE_S3_URL: optionalEnvUrl,
  CLOUDFLARE_ACCESS_KEY_ID: optionalEnvString,
  CLOUDFLARE_SECRET_ACCESS_KEY: optionalEnvString,
};

type ServerEnv = {
  OPENAI_API_KEY?: string;
  OPENROUTER_API_KEY_PRIMARY?: string;
  OPENROUTER_API_KEY_BACKUP?: string;
  OPENROUTER_MODEL?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  LANCE_DB_URI?: string;
  PRODUCTS_DATABASE_URL?: string;
  SUPABASE_AUTH_DATABASE_URL?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_S3_URL?: string;
  CLOUDFLARE_ACCESS_KEY_ID?: string;
  CLOUDFLARE_SECRET_ACCESS_KEY?: string;
};

/**
 * Normalize Cloudflare env aliases.
 * S3 keys must stay an **intact pair** (same source for access + secret).
 * Do not treat API tokens / Authorization headers as S3 secrets.
 */
function resolveCloudflarePair(env: NodeJS.ProcessEnv): {
  access: string | undefined;
  secret: string | undefined;
  apiToken: string | undefined;
  s3Url: string | undefined;
  accountId: string | undefined;
} {
  const r2Access = env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
  const r2Secret = env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
  const access = env.CLOUDFLARE_ACCESS_KEY_ID?.trim();
  const secret = env.CLOUDFLARE_SECRET_ACCESS_KEY?.trim();
  const typoAccess = env.CLOULD_ACCESS_KEY_ID?.trim();
  const typoSecret = env.CLOULDFLARE_S3_SECRET_ACCESS_KEY?.trim();

  let resolvedAccess = access;
  let resolvedSecret = secret;
  if (r2Access && r2Secret) {
    resolvedAccess = r2Access;
    resolvedSecret = r2Secret;
  } else if (access && secret) {
    resolvedAccess = access;
    resolvedSecret = secret;
  } else if (typoAccess && typoSecret) {
    resolvedAccess = typoAccess;
    resolvedSecret = typoSecret;
  } else {
    resolvedAccess = undefined;
    resolvedSecret = undefined;
  }

  return {
    access: resolvedAccess,
    secret: resolvedSecret,
    apiToken:
      env.CLOUDFLARE_API_TOKEN ||
      env.CLOOUDFLARE_SECRET_API_TOKEN ||
      env.CLOULDFLARE_S3_API_TOKEN ||
      env.CLOUDFLARE_SECRET_API_TOKEN,
    s3Url: env.CLOUDFLARE_S3_URL || env.CLOULDFLARE_S3_URL,
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
  };
}

function buildRuntimeEnv(source: NodeJS.ProcessEnv) {
  const cf = resolveCloudflarePair(source);
  return {
    OPENAI_API_KEY: source.OPENAI_API_KEY,
    OPENROUTER_API_KEY_PRIMARY: source.OPENROUTER_API_KEY_PRIMARY,
    OPENROUTER_API_KEY_BACKUP: source.OPENROUTER_API_KEY_BACKUP,
    OPENROUTER_MODEL: source.OPENROUTER_MODEL,
    GEMINI_API_KEY: source.GEMINI_API_KEY,
    GEMINI_MODEL: source.GEMINI_MODEL,
    LANCE_DB_URI: source.LANCE_DB_URI,
    PRODUCTS_DATABASE_URL: source.PRODUCTS_DATABASE_URL,
    SUPABASE_AUTH_DATABASE_URL: source.SUPABASE_AUTH_DATABASE_URL,
    CLOUDFLARE_ACCOUNT_ID: cf.accountId,
    CLOUDFLARE_API_TOKEN: cf.apiToken,
    CLOUDFLARE_S3_URL: cf.s3Url,
    CLOUDFLARE_ACCESS_KEY_ID: cf.access,
    CLOUDFLARE_SECRET_ACCESS_KEY: cf.secret,
  };
}

function createServerEnvFrom(source: NodeJS.ProcessEnv): ServerEnv {
  return createEnv({
    server: serverSchema,
    client: {},
    runtimeEnv: buildRuntimeEnv(source),
    emptyStringAsUndefined: true,
    // Always validate this server module (lazy via Proxy). Shared `@/env` may skip in Vitest.
    skipValidation: false,
    // `server-only` module — force server access (Vitest has no Next server runtime).
    isServer: true,
  }) as ServerEnv;
}

/**
 * Lazy validation (Proxy) preserves prior test contract: invalid env throws on access.
 * Cloudflare pair resolution runs on each read so alias tests stay honest.
 */
export const env = new Proxy({} as ServerEnv, {
  get(_target, property: string) {
    try {
      const parsed = createServerEnvFrom(process.env);
      return parsed[property as keyof ServerEnv];
    } catch (error) {
      console.error("Invalid server environment variables:", error);
      throw new Error("Invalid server environment variables");
    }
  },
});
