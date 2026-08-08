/**
 * Shared guards for admin server actions (auth, IP, rate limit, ApiError mapping).
 * Keeps next-safe-action wrappers thin and stops per-file copies of the same glue.
 */

import { headers } from "next/headers";
import { returnServerError } from "next-safe-action";
import { normalizeClientIp } from "@/lib/clientIp";
import { rateLimit } from "@/lib/rateLimit";
import { ApiError } from "@/features/shared/api/ApiError";
import { resolveAuthContext } from "@/features/shared/api/withAuth";

/** Resolve client IP from edge / proxy headers (same order as API rate limiting). */
export function resolveClientIp(headerStore: Headers): string {
  const raw =
    headerStore.get("cf-connecting-ip") ||
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1";
  return normalizeClientIp(raw);
}

/** Require an authenticated admin; maps failures to safe-action serverError. */
export async function requireAdminAction(
  fallbackMessage = "Admin access required",
): Promise<void> {
  try {
    await resolveAuthContext("admin");
  } catch (err) {
    if (err instanceof ApiError) {
      returnServerError(err.message || fallbackMessage);
    }
    returnServerError(fallbackMessage);
  }
}

/**
 * IP-scoped rate limit. `scope` matches REST `rateLimitScope` values where possible
 * (e.g. `admin-catalogs:post`) so action + route share the same bucket key pattern.
 */
export async function assertActionRateLimit(
  scope: string,
  limit: number,
  message = "Too many requests. Please try again shortly.",
): Promise<void> {
  const headerStore = await headers();
  const ip = resolveClientIp(headerStore);
  const limitRes = await rateLimit(`${scope}:${ip}`, limit, 60_000);
  if (!limitRes.success) {
    returnServerError(message);
  }
}

/**
 * Run a domain call that throws `ApiError` on expected failures; map those to
 * `returnServerError`. Unexpected errors rethrow into handleServerError.
 */
export async function runAdminDomain<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) {
      returnServerError(err.message);
    }
    throw err;
  }
}
