/**
 * withAuth — standardized auth middleware for API route handlers.
 *
 * Wraps a Next.js App Router route handler so that:
 *   1. Per-IP rate limiting is enforced before any work.
 *   2. The caller's Supabase session is resolved into an {@link AuthContext}.
 *   3. The required role (`admin` | `member` | `guest`) is enforced.
 *   4. Any thrown {@link ApiError} (or unknown error) is serialized via the
 *      standard {@link error} envelope.
 *
 * Roles:
 *   - `admin`: requires an authenticated user whose `app_metadata.role` (or
 *     `app_metadata.roles` containing `"admin"`) is set server-side.
 *   - `member`: requires any authenticated user.
 *   - `guest`: no auth required; the `auth.user` may be `null`. Useful for
 *     routes that optionally personalize but serve anonymous traffic too.
 *
 * The wrapped handler receives `(req, auth)` (plus the optional `context`
 * for dynamic routes). Handlers can `throw new ApiError(...)` freely; it will
 * be caught and serialized here.
 */

import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import { createAuthServerClient } from "@/platform/supabase/server";
import { rateLimit } from "@/lib/rateLimit";
import { ApiError, API_ERROR_CODES, toApiError } from "./ApiError";
import { error } from "./apiResponse";
import { isAppAdmin, readAppRole } from "@/lib/auth/roles";
import {
  DEV_BYPASS_USER,
  isDevAuthBypassEnabled,
} from "@/lib/auth/devAuthBypass";
import { normalizeClientIp } from "@/lib/clientIp";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { CSRF_REJECTION_HEADER_NAME } from "@/lib/security/csrfConstants";

/** Roles supported by {@link withAuth}. */
export type AuthRole = "admin" | "member" | "guest";

/** Resolved auth context handed to wrapped handlers. */
export type AuthContext = {
  /** The authenticated Supabase user, or `null` for guest role. */
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
  /** True when the user has the `admin` role. */
  isAdmin: boolean;
  /** The role that was required for this route. */
  requiredRole: AuthRole;
};

/** Options for {@link withAuth}. */
export type WithAuthOptions = {
  /** Required role. Defaults to `member`. */
  role?: AuthRole;
  /** Rate-limit scope key (e.g. `"catalog:get"`). Required. */
  rateLimitScope: string;
  /** Rate-limit request count per window. Default 30. */
  rateLimit?: number;
  /** Rate-limit window in ms. Default 60_000. */
  rateLimitWindowMs?: number;
  /** Require CSRF double-submit token on mutating HTTP methods. */
  requireCsrf?: boolean;
};

/** Extract a normalized client IP from common proxy headers. */
function getClientIp(req: NextRequest | Request): string {
  const raw =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1";
  return normalizeClientIp(raw);
}

/**
 * Resolve the Supabase session into an {@link AuthContext}. Throws
 * {@link ApiError} (AUTH_REQUIRED / INSUFFICIENT_PERMISSIONS) when the
 * required role is not satisfied.
 */
export async function resolveAuthContext(
  requiredRole: AuthRole,
): Promise<AuthContext> {
  if (isDevAuthBypassEnabled()) {
    return {
      user: {
        id: DEV_BYPASS_USER.id,
        email: DEV_BYPASS_USER.email,
        role: DEV_BYPASS_USER.role,
      },
      isAdmin: true,
      requiredRole,
    };
  }

  if (requiredRole === "guest") {
    // Guest routes may still benefit from a user if present, but never fail.
    try {
      const supabase = await createAuthServerClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (user) {
        const role = readAppRole(user);
        return {
          user: { id: user.id, email: user.email ?? "", role },
          isAdmin: isAppAdmin(user),
          requiredRole,
        };
      }
    } catch {
      // ignore — guest routes tolerate missing session
    }
    return { user: null, isAdmin: false, requiredRole };
  }

  let user: {
    id: string;
    email?: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  } | null = null;

  try {
    const supabase = await createAuthServerClient();
    const { data, error: authError } = await supabase.auth.getUser();
    user = authError ? null : (data.user ?? null);
  } catch {
    user = null;
  }

  if (!user || !user.id) {
    throw new ApiError(
      401,
      API_ERROR_CODES.AUTH_REQUIRED,
      "Authentication required",
    );
  }

  const role = readAppRole(user);
  const isAdmin = isAppAdmin(user);

  if (requiredRole === "admin" && !isAdmin) {
    throw new ApiError(
      403,
      API_ERROR_CODES.INSUFFICIENT_PERMISSIONS,
      "Admin access required",
    );
  }

  return {
    user: { id: user.id, email: user.email ?? "", role },
    isAdmin,
    requiredRole,
  };
}

/** Enforce rate limiting; returns a 429 NextResponse or null when allowed. */
async function enforceRateLimit(
  req: NextRequest | Request,
  options: WithAuthOptions,
): Promise<NextResponse | null> {
  const ip = getClientIp(req);
  const limit = options.rateLimit ?? 30;
  const windowMs = options.rateLimitWindowMs ?? 60_000;
  const result = await rateLimit(
    `${options.rateLimitScope}:${ip}`,
    limit,
    windowMs,
  );
  if (result.success) {return null;}
  return error(
    new ApiError(
      429,
      API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      "Too many requests",
    ),
    { reset: result.reset },
  );
}

/**
 * Higher-order function wrapping a route handler with rate-limit + auth +
 * error-handling. The wrapped handler receives the resolved {@link AuthContext}
 * as its second argument.
 *
 * @example
 *   export const GET = withAuth(async (req, auth) => {
 *     if (!auth.isAdmin) throw ApiError.forbidden();
 *     return success({ items: [] });
 *   }, { role: "member", rateLimitScope: "my-route:get" });
 */
export function withAuth(
  handler: (
    req: NextRequest,
    auth: AuthContext,
  ) => Promise<NextResponse | Response> | NextResponse | Response,
  options: WithAuthOptions,
): (req: NextRequest, context?: unknown) => Promise<NextResponse | Response>;
export function withAuth<TContext>(
  handler: (
    req: NextRequest,
    auth: AuthContext,
    context: TContext,
  ) => Promise<NextResponse | Response> | NextResponse | Response,
  options: WithAuthOptions,
): (req: NextRequest, context: TContext) => Promise<NextResponse | Response>;
export function withAuth(
  handler: (
    req: NextRequest,
    auth: AuthContext,
    context: unknown,
  ) => Promise<NextResponse | Response> | NextResponse | Response,
  options: WithAuthOptions,
): (req: NextRequest, context?: unknown) => Promise<NextResponse | Response>;
export function withAuth(
  handler: (
    req: NextRequest,
    auth: AuthContext,
    context: unknown,
  ) => Promise<NextResponse | Response> | NextResponse | Response,
  options: WithAuthOptions,
): (req: NextRequest, context?: unknown) => Promise<NextResponse | Response> {
  const requiredRole: AuthRole = options.role ?? "member";
  return async (req, context) => {
    const limited = await enforceRateLimit(req, options);
    if (limited) {return limited;}

    const method = req.method.toUpperCase();
    if (
      options.requireCsrf &&
      !isDevAuthBypassEnabled() &&
      ["POST", "PUT", "PATCH", "DELETE"].includes(method)
    ) {
      const csrfValid = await validateCsrfRequest(req);
      if (!csrfValid) {
        return error(
          new ApiError(
            403,
            API_ERROR_CODES.CSRF_FAILED,
            "Invalid or missing CSRF token",
          ),
          { headers: { [CSRF_REJECTION_HEADER_NAME]: "1" } },
        );
      }
    }

    try {
      const auth = await resolveAuthContext(requiredRole);
      // Next.js App Router always supplies context for dynamic routes; tests may omit it.
      return await handler(req, auth, context);
    } catch (err) {
      if (err instanceof ApiError) {return error(err);}
      console.error(`[withAuth:${options.rateLimitScope}] error:`, err);
      return error(toApiError(err));
    }
  };
}
